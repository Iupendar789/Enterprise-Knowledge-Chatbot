import os
import uuid
import json
import time
import hashlib
import sqlite3
from pathlib import Path
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from google import genai
from pwdlib import PasswordHash
from fastapi.responses import StreamingResponse
from auth import (
    verify_admin_password,
    create_access_token,
    get_current_admin,
    create_employee_access_token,
    get_current_employee,
)
from rbac import (
    find_document_by_filename,
    filter_accessible_documents,
    require_document_access,
    assign_document_permissions,
    employee_can_access_document,
)
RAG_VERSION = "3.0"
# ============================================================
# 1. PATHS AND ENVIRONMENT
# ============================================================
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
VECTOR_STORE_DIR = BASE_DIR / "vector_store"
CHAT_HISTORY_DIR = BASE_DIR / "chat_history"
DOCUMENTS_FILE = BASE_DIR / "documents.json"
EMPLOYEE_DB = BASE_DIR / "employees.db"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
CHAT_HISTORY_DIR.mkdir(parents=True, exist_ok=True)
load_dotenv(BASE_DIR / ".env")
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY was not found. "
        "Check your backend/.env file."
    )
client = genai.Client(api_key=api_key)
# ============================================================
# 2. GEMINI MODELS
# ============================================================
# Used only for RAG embeddings.
EMBEDDING_MODEL = "gemini-embedding-001"
# Generation models.
#
# We try these in order.
#
# IMPORTANT:
# The Google SDK already performs transient retries.
# Therefore we do not retry each model multiple times.
# If one model is temporarily unavailable, we move to
# the next model.
GENERATION_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
]
# Gemini errors that are usually temporary.
RETRYABLE_CODES = {
    408,
    429,
    500,
    502,
    503,
    504,
}
# Number of chunks sent to Gemini for one selected PDF.
DOCUMENT_TOP_K = 3
# Number of chunks sent to Gemini when searching
# the complete shared knowledge base.
SHARED_TOP_K = 6
# Safety limit so a large number of PDFs does not create
# an unnecessarily large Gemini prompt.
MAX_CONTEXT_CHARS = 12000
# ============================================================
# 3. PASSWORD HASHING
# ============================================================
employee_password_hasher = PasswordHash.recommended()
# ============================================================
# 4. DATABASE INITIALIZATION
# ============================================================

def init_employee_db():
    with sqlite3.connect(EMPLOYEE_DB) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS employees (
                email TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                department TEXT NOT NULL DEFAULT ''
            )
            """
        )

        # Migrate existing databases without deleting employee data.
        columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(employees)"
            ).fetchall()
        }

        if "department" not in columns:
            connection.execute(
                """
                ALTER TABLE employees
                ADD COLUMN department TEXT NOT NULL DEFAULT ''
                """
            )

init_employee_db()

# ============================================================
# 5. EMPLOYEE DATABASE OPERATIONS
# ============================================================
def register_employee(
    email: str,
    password: str,
    full_name: str,
) -> bool:
    email = email.strip().lower()
    full_name = full_name.strip()
    if not email or not password or not full_name:
        raise HTTPException(
            status_code=400,
            detail="All fields are required.",
        )
    password_hash = employee_password_hasher.hash(password)
    try:
        with sqlite3.connect(EMPLOYEE_DB) as connection:
            connection.execute(
                """
                INSERT INTO employees (
                    email,
                    password_hash,
                    full_name
                )
                VALUES (?, ?, ?)
                """,
                (
                    email,
                    password_hash,
                    full_name,
                ),
            )
        return True
    except sqlite3.IntegrityError:
        return False

def verify_employee_password(
    email: str,
    password: str,
) -> bool:
    email = email.strip().lower()
    try:
        with sqlite3.connect(EMPLOYEE_DB) as connection:
            row = connection.execute(
                """
                SELECT password_hash
                FROM employees
                WHERE email = ?
                """,
                (email,),
            ).fetchone()

        if row is None:
            return False

        return employee_password_hasher.verify(
            password,
            row[0],
        )

    except Exception as error:
        print(
            "Employee password verification error:",
            repr(error),
        )
        return False


# ADD THIS NEW FUNCTION BELOW THE EXISTING FUNCTION

def get_employee_by_email(email: str) -> dict | None:
    email = email.strip().lower()

    with sqlite3.connect(EMPLOYEE_DB) as connection:
        connection.row_factory = sqlite3.Row

        row = connection.execute(
            """
            SELECT email, full_name, department
            FROM employees
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

    if row is None:
        return None

    return dict(row)

# ============================================================
# 6. FASTAPI
# ============================================================
app = FastAPI(
    title="Enterprise Knowledge Chatbot API",
    description=(
        "Backend API for uploading, processing, "
        "searching, and chatting with enterprise documents."
    ),
    version="3.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ============================================================
# 7. REQUEST / RESPONSE MODELS
# ============================================================
class ChatRequest(BaseModel):
    question: str
class RAGChatRequest(BaseModel):
    question: str
    filename: str
    conversation_id: str | None = None
    regenerate: bool = False
class SharedChatRequest(BaseModel):
    question: str
    conversation_id: str | None = None
    regenerate: bool = False
class SourceCitation(BaseModel):
    document: str
    page: int
class RAGChatResponse(BaseModel):
    answer: str
    sources: list[int]
    citations: list[SourceCitation] = []
    conversation_id: str
class AdminLoginRequest(BaseModel):
    email: str
    password: str
class EmployeeRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
class EmployeeLoginRequest(BaseModel):
    email: str
    password: str

class AssignDepartmentRequest(BaseModel):
    email: str
    department: str

# ============================================================
# 8. DOCUMENT REGISTRY
# ============================================================
def load_documents() -> list[dict]:
    if not DOCUMENTS_FILE.is_file():
        return []
    try:
        with DOCUMENTS_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            documents = json.load(file)
        if not isinstance(documents, list):
            raise ValueError(
                "Document registry must contain a list."
            )
        return documents
    except (
        OSError,
        json.JSONDecodeError,
        ValueError,
    ) as error:
        print(
            "Document registry read error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail="Could not read the saved document list.",
        )
def save_documents(
    documents: list[dict],
) -> None:
    try:
        with DOCUMENTS_FILE.open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                documents,
                file,
                ensure_ascii=False,
                indent=2,
            )
    except OSError as error:
        print(
            "Document registry save error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail="Could not save the document list.",
        )
def calculate_file_hash(
    content: bytes,
) -> str:
    return hashlib.sha256(
        content
    ).hexdigest()
def get_pdf_path(
    filename: str,
) -> Path:
    if (
        Path(filename).name != filename
        or not filename.lower().endswith(".pdf")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid PDF filename.",
        )
    file_path = UPLOAD_DIR / filename
    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="PDF not found in the uploads folder.",
        )
    return file_path
def get_document_display_name(
    filename: str,
) -> str:
    for document in load_documents():
        if document.get(
            "saved_filename"
        ) == filename:
            return (
                document.get(
                    "original_filename"
                )
                or filename
            )
    embedding_path = (
        VECTOR_STORE_DIR
        / f"{filename}.json"
    )
    if embedding_path.is_file():
        try:
            with embedding_path.open(
                "r",
                encoding="utf-8",
            ) as file:
                data = json.load(file)
            return (
                data.get(
                    "original_filename"
                )
                or filename
            )
        except Exception:
            pass
    return filename
# ============================================================
# 9. PDF EXTRACTION
# ============================================================
def extract_pdf_pages(
    file_path: Path,
) -> list[dict]:
    try:
        reader = PdfReader(
            str(file_path)
        )
        pages = []
        for page_number, page in enumerate(
            reader.pages,
            start=1,
        ):
            text = page.extract_text() or ""
            text = " ".join(
                text.split()
            )
            pages.append(
                {
                    "page": page_number,
                    "text": text,
                }
            )
        return pages
    except Exception as error:
        print(
            "PDF extraction error:",
            repr(error),
        )
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not read this PDF. "
                "It may be damaged or encrypted."
            ),
        )
# ============================================================
# 10. CHUNKING
# ============================================================
def create_chunks(
    pages: list[dict],
    chunk_size: int = 800,
    overlap: int = 150,
) -> list[dict]:
    chunks = []
    for page_data in pages:
        page_number = page_data["page"]
        text = page_data["text"]
        if not text:
            continue
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            chunks.append(
                {
                    "chunk_id":
                        len(chunks) + 1,
                    "page":
                        page_number,
                    "text":
                        chunk_text,
                }
            )
            if end >= len(text):
                break
            start = end - overlap
    return chunks
# ============================================================
# 11. GEMINI EMBEDDING
# ============================================================
def create_embedding(
    text: str,
) -> list[float]:
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    if not result.embeddings:
        raise RuntimeError(
            "Gemini returned no embedding."
        )
    return result.embeddings[0].values
# ============================================================
# 12. COSINE SIMILARITY
# ============================================================
def cosine_similarity(
    vector_a,
    vector_b,
) -> float:
    vector_a = np.asarray(
        vector_a,
        dtype=np.float32,
    )
    vector_b = np.asarray(
        vector_b,
        dtype=np.float32,
    )
    if vector_a.shape != vector_b.shape:
        return 0.0
    denominator = (
        np.linalg.norm(vector_a)
        * np.linalg.norm(vector_b)
    )
    if denominator == 0:
        return 0.0
    return float(
        np.dot(vector_a, vector_b)
        / denominator
    )
# ============================================================
# 13. LOAD SAVED EMBEDDINGS
# ============================================================
def load_saved_chunks(
    filename: str,
) -> list[dict]:
    filename = filename.strip()
    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Filename cannot be empty.",
        )
    get_pdf_path(filename)
    json_path = (
        VECTOR_STORE_DIR
        / f"{filename}.json"
    )
    if not json_path.is_file():
        raise HTTPException(
            status_code=404,
            detail=(
                "Embeddings not found. "
                "Save the document embeddings first."
            ),
        )
    try:
        with json_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)
        if not isinstance(data, dict):
            raise ValueError(
                "Saved embeddings JSON must be an object."
            )
        chunks = data.get(
            "chunks",
            [],
        )
        valid_chunks = []
        for chunk in chunks:
            try:
                if (
                    not isinstance(
                        chunk,
                        dict,
                    )
                    or not str(
                        chunk["text"]
                    ).strip()
                    or not isinstance(
                        chunk["embedding"],
                        list,
                    )
                    or not chunk["embedding"]
                ):
                    continue
                int(chunk["page"])
                [
                    float(value)
                    for value in chunk["embedding"]
                ]
                valid_chunks.append(
                    chunk
                )
            except (
                KeyError,
                TypeError,
                ValueError,
            ):
                continue
        if not valid_chunks:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No valid embedding chunks "
                    "were found for this document."
                ),
            )
        return valid_chunks
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=(
                "The saved embeddings file "
                "contains invalid JSON."
            ),
        )
    except Exception as error:
        print(
            "JSON read error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not read the saved embeddings file."
            ),
        )
# ============================================================
# 14. SSE
# ============================================================
def create_sse_event(
    event_type: str,
    data: dict,
) -> str:
    payload = {
        "type": event_type,
        **data,
    }
    return (
        "data: "
        + json.dumps(
            payload,
            ensure_ascii=False,
        )
        + "\n\n"
    )
# ============================================================
# 15. AUTHENTICATION
# ============================================================
@app.post(
    "/api/auth/admin-login"
)
def admin_login(
    request: AdminLoginRequest,
):
    if not verify_admin_password(
        request.email,
        request.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )
    email = (
        request.email
        .strip()
        .lower()
    )
    return {
        "access_token":
            create_access_token(email),
        "token_type":
            "bearer",
        "email":
            email,
        "role":
            "admin",
    }
@app.get(
    "/api/auth/me"
)
def get_admin_profile(
    admin=Depends(get_current_admin),
):
    return admin
@app.post(
    "/api/auth/employee-register"
)
def employee_register(
    request: EmployeeRegisterRequest,
):
    success = register_employee(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
    )
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Employee account already exists.",
        )
    return {
        "message":
            "Employee registered successfully."
    }
@app.post(
    "/api/auth/employee-login"
)
def employee_login(
    request: EmployeeLoginRequest,
):
    if not verify_employee_password(
        request.email,
        request.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )
    email = (
        request.email
        .strip()
        .lower()
    )
    return {
        "access_token":
            create_employee_access_token(email),
        "token_type":
            "bearer",
        "email":
            email,
        "role":
            "employee",
    }
@app.get(
    "/api/auth/employee-me"
)
def get_employee_profile(
    employee=Depends(get_current_employee),
):
    employee_email = (
        employee["email"]
        .strip()
        .lower()
    )
    try:
        with sqlite3.connect(
            EMPLOYEE_DB
        ) as connection:
            row = connection.execute(
                """
                SELECT email, full_name
                FROM employees
                WHERE email = ?
                """,
                (employee_email,),
            ).fetchone()
        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Employee profile not found.",
            )
        return {
            "email":
                row[0],
            "full_name":
                row[1],
            "role":
                "employee",
        }
    except HTTPException:
        raise
    except Exception as error:
        print(
            "Employee profile error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail="Could not load employee profile.",
        )

@app.put("/api/admin/employees/department")
def assign_employee_department(
    request: AssignDepartmentRequest,
    admin=Depends(get_current_admin),
):
    email = request.email.strip().lower()
    department = request.department.strip()

    if not email or not department:
        raise HTTPException(
            status_code=400,
            detail="Email and department are required.",
        )

    with sqlite3.connect(EMPLOYEE_DB) as connection:
        cursor = connection.execute(
            """
            UPDATE employees
            SET department = ?
            WHERE email = ?
            """,
            (department, email),
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Employee not found.",
            )

    return {
        "message": "Employee department assigned successfully.",
        "email": email,
        "department": department,
    }

# ============================================================
# 16. HOME
# ============================================================
@app.get("/")
def home():
    return {
        "message":
            "Enterprise Knowledge Chatbot API is running."
    }
# ============================================================
# 17. UPLOAD PDF
# ============================================================
@app.post(
    "/api/upload"
)
async def upload_document(
    file: UploadFile = File(...),
    admin=Depends(get_current_admin),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename was provided.",
        )
    original_filename = Path(
        file.filename
    ).name
    if Path(
        original_filename
    ).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )
    try:
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )
        file_hash = calculate_file_hash(
            content
        )
        documents = load_documents()
        for document in documents:
            if document.get(
                "sha256"
            ) == file_hash:
                name = (
                    document.get(
                        "original_filename"
                    )
                    or document.get(
                        "saved_filename"
                    )
                    or "another document"
                )
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This PDF has already been "
                        f'uploaded as "{name}".'
                    ),
                )
        for existing_path in UPLOAD_DIR.glob(
            "*.pdf"
        ):
            try:
                existing_hash = calculate_file_hash(
                    existing_path.read_bytes()
                )
                if existing_hash == file_hash:
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            "This PDF has already been "
                            f'uploaded as '
                            f'"{get_document_display_name(existing_path.name)}".'
                        ),
                    )
            except HTTPException:
                raise
            except OSError:
                continue
        saved_filename = (
            f"{uuid.uuid4().hex}.pdf"
        )
        file_path = (
            UPLOAD_DIR / saved_filename
        )
        file_path.write_bytes(
            content
        )
        
        documents.append(
            {
                "original_filename": original_filename,
                "saved_filename": saved_filename,
                "size": len(content),
                "sha256": file_hash,
                "processed": False,

                # Secure default: admin-only until permissions
                # are explicitly assigned.
                "allowed_roles": ["admin"],
                "allowed_departments": [],
            }
        )

        save_documents(
            documents
        )
        return {
            "message":
                "File uploaded successfully.",
            "original_filename":
                original_filename,
            "saved_filename":
                saved_filename,
            "size":
                len(content),
        }
    except HTTPException:
        raise
    except Exception as error:
        print(
            "Upload error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail="Could not save the uploaded file.",
        )
    finally:
        await file.close()
# ============================================================
# 18. DISCOVER DOCUMENTS
# ============================================================

def discover_documents():
    documents = load_documents()

    # Existing documents that employees may access.
    # All other documents remain admin-only by default.
    employee_access_documents = {
        "NovaTech_01_Employee_Handbook.pdf",
        "NovaTech_02_Benefits_and_Learning_Handbook.pdf",
        "NovaTech_04_Performance_Appraisal_and_Promotion_Guide.pdf",
    }

    known_filenames = {
        document.get("saved_filename")
        for document in documents
    }

    changed = False

    # Register PDFs that exist in uploads but are missing
    # from documents.json. New/unrecognized PDFs default
    # to admin-only access.
    for file_path in UPLOAD_DIR.glob("*.pdf"):
        if file_path.name in known_filenames:
            continue

        try:
            content = file_path.read_bytes()
            file_hash = calculate_file_hash(content)
        except OSError as error:
            print("Could not read PDF:", repr(error))
            continue

        embedding_path = (
            VECTOR_STORE_DIR / f"{file_path.name}.json"
        )

        original_filename = file_path.name

        if embedding_path.is_file():
            try:
                with embedding_path.open(
                    "r", encoding="utf-8"
                ) as file:
                    embedding_data = json.load(file)

                original_filename = (
                    embedding_data.get("original_filename")
                    or file_path.name
                )
            except (OSError, json.JSONDecodeError, AttributeError):
                pass

        if original_filename in employee_access_documents:
            allowed_roles = ["admin", "employee"]
            allowed_departments = ["*"]
        else:
            allowed_roles = ["admin"]
            allowed_departments = []

        documents.append({
            "original_filename": original_filename,
            "saved_filename": file_path.name,
            "size": len(content),
            "sha256": file_hash,
            "processed": embedding_path.is_file(),
            "allowed_roles": allowed_roles,
            "allowed_departments": allowed_departments,
        })

        known_filenames.add(file_path.name)
        changed = True

    # Restore missing permission metadata on existing records.
    # Preserve permissions that are already present.
    for document in documents:
        original_filename = (
            document.get("original_filename")
            or document.get("saved_filename", "")
        )

        if (
            "allowed_roles" not in document
            or "allowed_departments" not in document
        ):
            if original_filename in employee_access_documents:
                document.setdefault(
                    "allowed_roles",
                    ["admin", "employee"],
                )
                document.setdefault(
                    "allowed_departments",
                    ["*"],
                )
            else:
                document.setdefault(
                    "allowed_roles",
                    ["admin"],
                )
                document.setdefault(
                    "allowed_departments",
                    [],
                )

            changed = True

    # Refresh processing status without removing permissions.
    for document in documents:
        saved_filename = document.get("saved_filename", "")
        embedding_path = (
            VECTOR_STORE_DIR / f"{saved_filename}.json"
        )

        document["processed"] = False

        if embedding_path.is_file():
            try:
                with embedding_path.open(
                    "r", encoding="utf-8"
                ) as embedding_file:
                    embedding_data = json.load(embedding_file)

                document["processed"] = (
                    embedding_data.get("rag_version") == RAG_VERSION
                )
                document["rag_version"] = (
                    embedding_data.get("rag_version")
                )
            except (
                OSError,
                json.JSONDecodeError,
                AttributeError,
            ):
                document["processed"] = False

    # Persist the restored permissions and processing status.
    save_documents(documents)

    return documents

# ============================================================
# 19. LIST DOCUMENTS
# ============================================================
@app.get(
    "/api/documents"
)
def list_documents(
    admin=Depends(get_current_admin),
):
    return discover_documents()


@app.get("/api/employee/documents")
def list_employee_documents(
    employee=Depends(get_current_employee),
):
    # Step 1: Get the employee's database record.
    employee_record = get_employee_by_email(
        employee["email"]
    )

    # Step 2: Ensure the employee exists.
    if employee_record is None:
        raise HTTPException(
            status_code=404,
            detail="Employee record not found.",
        )

    # Step 3: Combine the authenticated role with
    # the department stored in the database.
    employee_with_department = {
        **employee,
        "department": employee_record.get(
            "department",
            "",
        ),
    }

    # Step 4: Load the registered documents.
    documents = discover_documents()

    # Step 5: Filter documents using RBAC.
    accessible_documents = filter_accessible_documents(
        documents,
        employee_with_department,
    )

    # Step 6: Return only accessible document metadata.
    result = []

    for document in accessible_documents:
        result.append(
            {
                "original_filename": (
                    document.get("original_filename")
                    or document.get("saved_filename")
                ),
                "saved_filename": document.get(
                    "saved_filename"
                ),
                "size": document.get("size", 0),
                "processed": document.get(
                    "processed",
                    False,
                ),
            }
        )

    return result


# ============================================================
# 20. DOCUMENT TEXT
# ============================================================
@app.get(
    "/api/documents/{filename}/text"
)
def get_document_text(
    filename: str,
    admin=Depends(get_current_admin),
):
    pages = extract_pdf_pages(
        get_pdf_path(filename)
    )
    return {
        "filename":
            filename,
        "page_count":
            len(pages),
        "pages":
            pages,
    }
# ============================================================
# 21. DOCUMENT CHUNKS
# ============================================================
@app.get(
    "/api/documents/{filename}/chunks"
)
def get_document_chunks(
    filename: str,
    admin=Depends(get_current_admin),
):
    chunks = create_chunks(
        extract_pdf_pages(
            get_pdf_path(filename)
        )
    )
    return {
        "filename":
            filename,
        "chunk_count":
            len(chunks),
        "chunk_size":
            800,
        "overlap":
            150,
        "chunks":
            chunks,
    }
# ============================================================
# 22. CREATE EMBEDDINGS PREVIEW
# ============================================================
@app.post(
    "/api/documents/{filename}/embeddings"
)
def create_document_embeddings(
    filename: str,
    admin=Depends(get_current_admin),
):
    chunks = create_chunks(
        extract_pdf_pages(
            get_pdf_path(filename)
        )
    )
    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="No readable text found in this PDF.",
        )
    embedded_chunks = []
    try:
        for chunk in chunks:
            embedding = create_embedding(
                chunk["text"]
            )
            embedded_chunks.append(
                {
                    "chunk_id":
                        chunk["chunk_id"],
                    "page":
                        chunk["page"],
                    "text":
                        chunk["text"],
                    "embedding_dimensions":
                        len(embedding),
                    "embedding_preview":
                        embedding[:5],
                }
            )
        return {
            "filename":
                filename,
            "chunk_count":
                len(embedded_chunks),
            "message":
                "Embeddings created successfully.",
            "chunks":
                embedded_chunks,
        }
    except Exception as error:
        print(
            "Embedding error:",
            repr(error),
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not create embeddings. "
                "Check the backend terminal."
            ),
        )
# ============================================================
# 23. SAVE EMBEDDINGS
# ============================================================
@app.post(
    "/api/documents/{filename}/save-embeddings"
)
def save_document_embeddings(
    filename: str,
    original_filename: str | None = Query(
        default=None
    ),
    admin=Depends(get_current_admin),
):
    chunks = create_chunks(
        extract_pdf_pages(
            get_pdf_path(filename)
        )
    )
    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="No readable text found in this PDF.",
        )
    saved_chunks = []
    try:
        for chunk in chunks:
            embedding = create_embedding(
                chunk["text"]
            )
            saved_chunks.append(
                {
                    "chunk_id":
                        chunk["chunk_id"],
                    "page":
                        chunk["page"],
                    "text":
                        chunk["text"],
                    "embedding":
                        embedding,
                }
            )
    except Exception as error:
        print(
            "Embedding error:",
            repr(error),
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not create embeddings. "
                "Check the backend terminal."
            ),
        )
    documents = load_documents()
    registered_document = next(
        (
            document
            for document in documents
            if document.get(
                "saved_filename"
            ) == filename
        ),
        None,
    )
    display_name = (
        Path(
            original_filename
        ).name
        if original_filename
        else (
            registered_document.get(
                "original_filename"
            )
            if registered_document
            else filename
        )
    )
    json_path = (
        VECTOR_STORE_DIR
        / f"{filename}.json"
    )
    data = {
    "filename": filename,
    "original_filename": display_name,
    "chunk_count": len(saved_chunks),
    "embedding_model": EMBEDDING_MODEL,
    "rag_version": RAG_VERSION,
    "chunks": saved_chunks,
}
    try:
        with json_path.open(
            "w",
            encoding="utf-8",
        ) as json_file:
            json.dump(
                data,
                json_file,
                ensure_ascii=False,
            )
    except Exception as error:
        print(
            "JSON save error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not save the embeddings JSON file."
            ),
        )
    if registered_document:
        registered_document["processed"] = True
        save_documents(
            documents
        )
    return {
        "message":
            "Embeddings created and saved successfully.",
        "filename":
            filename,
        "original_filename":
            display_name,
        "chunk_count":
            len(saved_chunks),
        "saved_to":
            str(json_path),
    }
# ============================================================
# 24. SEARCH ONE DOCUMENT
# ============================================================
@app.post(
    "/api/documents/{filename}/search"
)
def search_document(
    filename: str,
    request: ChatRequest,
):
    question = request.question.strip()
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a search question.",
        )
    chunks = load_saved_chunks(
        filename
    )
    try:
        question_vector = create_embedding(
            question
        )
    except Exception as error:
        print(
            "Question embedding error:",
            repr(error),
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Could not create an embedding "
                "for the question."
            ),
        )
    scored_chunks = []
    for chunk in chunks:
        try:
            scored_chunks.append(
                {
                    "chunk_id":
                        chunk["chunk_id"],
                    "page":
                        int(chunk["page"]),
                    "text":
                        chunk["text"],
                    "similarity":
                        round(
                            cosine_similarity(
                                question_vector,
                                chunk["embedding"],
                            ),
                            4,
                        ),
                }
            )
        except (
            KeyError,
            TypeError,
            ValueError,
        ):
            continue
    if not scored_chunks:
        raise HTTPException(
            status_code=422,
            detail=(
                "No valid saved chunk embeddings "
                "were found."
            ),
        )
    scored_chunks.sort(
        key=lambda item:
            item["similarity"],
        reverse=True,
    )
    return {
        "filename":
            filename,
        "question":
            question,
        "results":
            scored_chunks[:DOCUMENT_TOP_K],
    }
# ============================================================
# 25. CONVERSATION HELPERS
# ============================================================
def validate_conversation_id(
    conversation_id: str,
) -> str:
    if (
        len(conversation_id) != 32
        or any(
            char not in "0123456789abcdef"
            for char in conversation_id.lower()
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid conversation ID.",
        )
    return conversation_id.lower()
def get_owned_conversation(
    conversation_id: str,
    employee_email: str,
) -> dict:
    conversation_id = (
        validate_conversation_id(
            conversation_id
        )
    )
    history_path = (
        CHAT_HISTORY_DIR
        / f"{conversation_id}.json"
    )
    if not history_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )
    try:
        with history_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            conversation = json.load(
                file
            )
    except (
        OSError,
        json.JSONDecodeError,
    ) as error:
        print(
            "Chat history read error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not read saved chat history."
            ),
        )
    owner_email = (
        conversation.get(
            "owner_email",
            "",
        )
        .strip()
        .lower()
    )
    if owner_email != employee_email.strip().lower():
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )
    return conversation
def save_chat_message(
    conversation_id: str,
    role: str,
    content: str,
    filename: str,
    employee_email: str,
    sources: list[int] | None = None,
    citations: list[dict] | None = None,
    status: str | None = None,
    replace_last_assistant: bool = False,
):
    conversation_id = (
        validate_conversation_id(
            conversation_id
        )
    )
    employee_email = (
        employee_email
        .strip()
        .lower()
    )
    history_path = (
        CHAT_HISTORY_DIR
        / f"{conversation_id}.json"
    )
    if history_path.is_file():
        conversation = get_owned_conversation(
            conversation_id,
            employee_email,
        )
    else:
        conversation = {
            "conversation_id":
                conversation_id,
            "owner_email":
                employee_email,
            "filename":
                filename,
            "messages":
                [],
        }
    conversation["filename"] = filename
    message = {
        "role":
            role,
        "content":
            content,
        "sources":
            sources or [],
        "citations":
            citations or [],
    }
    if status:
        message["status"] = status
    messages = conversation.setdefault(
        "messages",
        [],
    )
    if replace_last_assistant:
        if role != "assistant":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Only assistant messages "
                    "can be replaced."
                ),
            )
        if (
            not messages
            or messages[-1].get(
                "role"
            ) != "assistant"
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "The previous assistant "
                    "response could not be found."
                ),
            )
        messages[-1] = message
    else:
        messages.append(
            message
        )
    try:
        with history_path.open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                conversation,
                file,
                ensure_ascii=False,
                indent=2,
            )
    except OSError as error:
        print(
            "Chat history save error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not save chat history."
            ),
        )
# ============================================================
# 26. REGENERATION VALIDATION
# ============================================================
def validate_regeneration_request(
    conversation_id: str,
    employee_email: str,
    question: str,
    filename: str,
    allow_shared_source_switch: bool = False,
):
    conversation = get_owned_conversation(
        conversation_id,
        employee_email,
    )
    conversation_filename = (
        conversation.get(
            "filename",
            "",
        )
        .strip()
    )
    # Normal document regeneration is strict.
    #
    # Shared regeneration is intentionally allowed to switch
    # from an old PDF source to the shared knowledge base.
    if (
        conversation_filename != filename
        and not allow_shared_source_switch
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "This conversation does not match "
                "the selected knowledge source."
            ),
        )
    messages = conversation.get(
        "messages",
        [],
    )
    if len(messages) < 2:
        raise HTTPException(
            status_code=409,
            detail=(
                "The latest response cannot be "
                "regenerated. Please send the "
                "question again."
            ),
        )
    latest_message = messages[-1]
    previous_message = messages[-2]
    if (
        latest_message.get("role")
        != "assistant"
        or previous_message.get("role")
        != "user"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "The latest response cannot be "
                "regenerated. Please send the "
                "question again."
            ),
        )
    stored_question = (
        previous_message.get(
            "content",
            "",
        )
        .strip()
    )
    if stored_question != question.strip():
        raise HTTPException(
            status_code=409,
            detail=(
                "The latest response cannot be "
                "regenerated. Please send the "
                "question again."
            ),
        )
# ============================================================
# 27. LIST CONVERSATIONS
# ============================================================
@app.get(
    "/api/conversations"
)
def get_conversations(
    employee=Depends(get_current_employee),
):
    employee_email = (
        employee["email"]
        .strip()
        .lower()
    )
    conversations = []
    for history_path in CHAT_HISTORY_DIR.glob(
        "*.json"
    ):
        try:
            with history_path.open(
                "r",
                encoding="utf-8",
            ) as file:
                conversation = json.load(
                    file
                )
            if (
                conversation.get(
                    "owner_email",
                    "",
                )
                .strip()
                .lower()
                != employee_email
            ):
                continue
            conversation_id = (
                conversation.get(
                    "conversation_id"
                )
            )
            messages = (
                conversation.get(
                    "messages",
                    [],
                )
            )
            if (
                not conversation_id
                or not isinstance(
                    messages,
                    list,
                )
            ):
                continue
            first_user_message = next(
                (
                    message.get(
                        "content",
                        "",
                    ).strip()
                    for message in messages
                    if (
                        message.get(
                            "role"
                        ) == "user"
                        and message.get(
                            "content",
                            "",
                        ).strip()
                    )
                ),
                "",
            )
            title = (
                first_user_message
                or "New conversation"
            )
            if len(title) > 50:
                title = (
                    title[:47]
                    + "..."
                )
            conversations.append(
                {
                    "conversation_id":
                        conversation_id,
                    "title":
                        title,
                    "filename":
                        conversation.get(
                            "filename",
                            "",
                        ),
                    "updated_at":
                        history_path.stat().st_mtime,
                }
            )
        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            print(
                "Skipping invalid chat history:",
                repr(error),
            )
    conversations.sort(
        key=lambda item:
            item["updated_at"],
        reverse=True,
    )
    return conversations
# ============================================================
# 28. LOAD CONVERSATION
# ============================================================
@app.get(
    "/api/conversations/{conversation_id}"
)
def get_conversation(
    conversation_id: str,
    employee=Depends(get_current_employee),
):
    conversation = get_owned_conversation(
        conversation_id,
        employee["email"],
    )
    return {
        "conversation_id":
            conversation.get(
                "conversation_id",
                conversation_id,
            ),
        "filename":
            conversation.get(
                "filename",
                "",
            ),
        "messages":
            conversation.get(
                "messages",
                [],
            ),
    }
# ============================================================
# 29. LIMIT RAG CONTEXT
# ============================================================
def limit_context(
    context_parts: list[str],
    max_chars: int = MAX_CONTEXT_CHARS,
) -> str:
    result = []
    total_length = 0
    for part in context_parts:
        if (
            total_length
            + len(part)
            > max_chars
        ):
            remaining = (
                max_chars
                - total_length
            )
            if remaining > 200:
                result.append(
                    part[:remaining]
                )
            break
        result.append(
            part
        )
        total_length += len(part)
    return "\n\n".join(
        result
    )

# ============================================================
# 30. RETRIEVE ONE DOCUMENT
# ============================================================
def retrieve_document_context(
    question: str,
    filename: str,
    employee: dict | None = None,
):
    # --------------------------------------------------
    # 1. Validate document permissions BEFORE loading chunks
    # --------------------------------------------------
    documents = discover_documents()

    document = find_document_by_filename(
        documents,
        filename,
    )

    if employee is not None:
        require_document_access(
            document,
            employee,
        )
    elif document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # --------------------------------------------------
    # 2. Load chunks only from the authorized document
    # --------------------------------------------------
    chunks = load_saved_chunks(filename)

    question_vector = create_embedding(question)

    scored_chunks = []

    for chunk in chunks:
        try:
            text = str(chunk["text"]).strip()

            if not text:
                continue

            similarity = cosine_similarity(
                question_vector,
                chunk["embedding"],
            )

            scored_chunks.append(
                (
                    similarity,
                    {
                        "page": int(chunk["page"]),
                        "text": text,
                    },
                )
            )

        except (
            KeyError,
            TypeError,
            ValueError,
        ):
            continue

    # --------------------------------------------------
    # 3. Check retrieved chunks
    # --------------------------------------------------
    if not scored_chunks:
        raise HTTPException(
            status_code=422,
            detail=(
                "No valid saved chunk embeddings "
                "were found for this document."
            ),
        )

    scored_chunks.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    top_chunks = scored_chunks[:DOCUMENT_TOP_K]

    context_parts = []
    source_pages = []

    for similarity, chunk in top_chunks:
        context_parts.append(
            f"Source page {chunk['page']}:\n"
            f"{chunk['text']}"
        )

        source_pages.append(chunk["page"])

    context = limit_context(context_parts)

    sources = sorted(set(source_pages))

    return context, sources


# ============================================================
# 31. RETRIEVE SHARED KNOWLEDGE - RBAC ENFORCED
# ============================================================

def retrieve_shared_context(
    question: str,
    employee: dict,
):
    # --------------------------------------------------
    # 1. Validate the authenticated employee
    # --------------------------------------------------
    employee_email = str(
        employee.get("email", "")
    ).strip().lower()

    role = str(
        employee.get("role", "")
    ).strip().lower()

    if not employee_email:
        raise HTTPException(
            status_code=401,
            detail="Authenticated employee identity is missing.",
        )

    if role not in {"employee", "admin"}:
        raise HTTPException(
            status_code=403,
            detail="Your role is not authorized to access the knowledge base.",
        )

    # --------------------------------------------------
    # 2. Load trusted document permissions
    # --------------------------------------------------
    documents = discover_documents()

    # Match documents by their actual saved filename.
    documents_by_saved_filename = {}

    for document in documents:
        saved_filename = document.get("saved_filename")

        if not isinstance(saved_filename, str):
            continue

        saved_filename = Path(saved_filename).name

        if not saved_filename.lower().endswith(".pdf"):
            continue

        documents_by_saved_filename[saved_filename] = document

    # --------------------------------------------------
    # 3. Determine which registered documents are accessible
    # --------------------------------------------------
    accessible_documents = filter_accessible_documents(
        documents,
        employee,
    )

    accessible_saved_filenames = {
        Path(document["saved_filename"]).name
        for document in accessible_documents
        if isinstance(document.get("saved_filename"), str)
    }

    if not accessible_saved_filenames:
        raise HTTPException(
            status_code=404,
            detail="No accessible documents were found.",
        )

    # --------------------------------------------------
    # 4. Find embedding files by actual saved filename
    # --------------------------------------------------
    embedding_files = list(
        VECTOR_STORE_DIR.glob("*.pdf.json")
    )

    if not embedding_files:
        raise HTTPException(
            status_code=404,
            detail="No processed document embeddings were found.",
        )

    authorized_embedding_files = []

    for json_path in embedding_files:
        # Example:
        # dcc3d3644b6c418cb35337f9bcbcb5f0.pdf.json
        #
        # Extract:
        # dcc3d3644b6c418cb35337f9bcbcb5f0.pdf
        saved_filename = json_path.name[:-len(".json")]

        # Fail closed if the PDF is not in the trusted registry.
        document = documents_by_saved_filename.get(
            saved_filename
        )

        if document is None:
            print(
                "RBAC: skipping unregistered embedding:",
                json_path.name,
            )
            continue

        # Fail closed if this document is not accessible.
        if saved_filename not in accessible_saved_filenames:
            print(
                "RBAC: skipping unauthorized embedding:",
                saved_filename,
                "role:",
                role,
                "department:",
                employee.get("department", ""),
            )
            continue

        # Confirm the permission check directly against
        # the trusted registry entry.
        if not employee_can_access_document(
            document,
            employee,
        ):
            print(
                "RBAC: permission denied:",
                saved_filename,
            )
            continue

        authorized_embedding_files.append(
            (json_path, document)
        )

    if not authorized_embedding_files:
        raise HTTPException(
            status_code=404,
            detail="No accessible processed documents were found.",
        )

    print(
        "RBAC retrieval:",
        "role =", role,
        "| department =", employee.get("department", ""),
        "| accessible embedding files =",
        len(authorized_embedding_files),
    )

    # --------------------------------------------------
    # 5. Embed the question
    # --------------------------------------------------
    question_vector = create_embedding(question)

    scored_chunks = []

    # --------------------------------------------------
    # 6. Read and rank chunks from authorized files ONLY
    # --------------------------------------------------
    for json_path, document in authorized_embedding_files:
        try:
            with json_path.open(
                "r",
                encoding="utf-8",
            ) as json_file:
                data = json.load(json_file)

        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            print(
                "RBAC: could not read embedding:",
                json_path.name,
                repr(error),
            )
            continue

        if not isinstance(data, dict):
            continue

        chunks = data.get("chunks", [])

        if not isinstance(chunks, list):
            continue

        # The citation name comes from the trusted registry,
        # NOT from the embedding JSON's internal metadata.
        document_name = (
            document.get("original_filename")
            or document.get("saved_filename")
        )

        for chunk in chunks:
            try:
                if not isinstance(chunk, dict):
                    continue

                text = str(
                    chunk["text"]
                ).strip()

                if not text:
                    continue

                page = int(chunk["page"])
                embedding = chunk["embedding"]

                similarity = cosine_similarity(
                    question_vector,
                    embedding,
                )

                scored_chunks.append(
                    {
                        "similarity": similarity,
                        "page": page,
                        "text": text,
                        "document": document_name,
                    }
                )

            except (
                KeyError,
                TypeError,
                ValueError,
            ):
                continue

    # --------------------------------------------------
    # 7. Validate retrieved chunks
    # --------------------------------------------------
    if not scored_chunks:
        raise HTTPException(
            status_code=404,
            detail=(
                "No relevant information was found "
                "in the accessible company documents."
            ),
        )

    # --------------------------------------------------
    # 8. Rank authorized chunks
    # --------------------------------------------------
    scored_chunks.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    top_chunks = scored_chunks[:SHARED_TOP_K]

    # --------------------------------------------------
    # 9. Build context and citations
    # --------------------------------------------------
    context_parts = []
    citations = []

    for chunk in top_chunks:
        context_parts.append(
            f"Document: {chunk['document']}\n"
            f"Source page {chunk['page']}:\n"
            f"{chunk['text']}"
        )

        citations.append(
            {
                "document": chunk["document"],
                "page": chunk["page"],
            }
        )

    # Remove duplicate document/page citations.
    unique_citations = []
    seen_citations = set()

    for citation in citations:
        key = (
            citation["document"],
            citation["page"],
        )

        if key not in seen_citations:
            seen_citations.add(key)
            unique_citations.append(citation)

    context = limit_context(context_parts)

    sources = sorted(
        {
            citation["page"]
            for citation in unique_citations
        }
    )

    print(
        "RBAC retrieval completed:",
        len(top_chunks),
        "chunks selected from authorized documents.",
    )

    return (
        context,
        sources,
        unique_citations,
    )
  
# ============================================================
# 32. GEMINI ERROR HELPERS
# ============================================================
def get_error_code(
    error,
):
    try:
        return int(
            getattr(
                error,
                "code",
                None,
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        return None
def is_retryable_gemini_error(
    error,
) -> bool:
    code = get_error_code(
        error
    )
    if code in RETRYABLE_CODES:
        return True
    error_text = repr(
        error
    ).upper()
    retryable_messages = (
        "408",
        "429",
        "500",
        "502",
        "503",
        "504",
        "UNAVAILABLE",
        "RESOURCE_EXHAUSTED",
        "TOO MANY REQUESTS",
        "HIGH DEMAND",
        "SERVICE UNAVAILABLE",
        "TEMPORARILY UNAVAILABLE",
        "DEADLINE_EXCEEDED",
    )
    return any(
        message in error_text
        for message in retryable_messages
    )
def get_gemini_error_message(
    error,
) -> str:
    if error is None:
        return (
            "The AI service could not generate "
            "an answer. Please try again."
        )
    code = get_error_code(
        error
    )
    error_text = repr(
        error
    ).upper()
    if (
        code == 429
        or "RESOURCE_EXHAUSTED" in error_text
        or "TOO MANY REQUESTS" in error_text
    ):
        return (
            "The AI service is temporarily busy "
            "or the request limit was reached. "
            "Please try again shortly."
        )
    if (
        code in {
            408,
            500,
            502,
            503,
            504,
        }
        or "UNAVAILABLE" in error_text
        or "HIGH DEMAND" in error_text
        or "SERVICE UNAVAILABLE" in error_text
        or "TEMPORARILY UNAVAILABLE" in error_text
        or "DEADLINE_EXCEEDED" in error_text
    ):
        return (
            "The AI service is temporarily busy. "
            "Please try again in a few seconds."
        )
    if (
        code in {
            401,
            403,
        }
        or "PERMISSION_DENIED" in error_text
    ):
        return (
            "The Gemini API key does not have "
            "permission to use the AI service."
        )
    if (
        code == 404
        or "MODEL_NOT_FOUND" in error_text
        or "NOT_FOUND" in error_text
    ):
        return (
            "The configured Gemini model could not be "
            "found. Please check the Gemini model configuration."
        )
    return (
        "The AI service could not generate "
        "an answer. Please try again."
    )
# ============================================================
# 33. GEMINI NORMAL GENERATION
# ============================================================
def generate_gemini_answer(
    prompt: str,
) -> str:
    last_error = None
    for index, model_name in enumerate(
        GENERATION_MODELS
    ):
        try:
            print(
                "[Gemini] Trying model:",
                f"{model_name} "
                f"({index + 1}/{len(GENERATION_MODELS)})",
            )
            response = (
                client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
            )
            answer = (
                response.text.strip()
                if response.text
                else ""
            )
            if answer:
                print(
                    "[Gemini] SUCCESS:",
                    model_name,
                )
                return answer
            last_error = RuntimeError(
                f"{model_name} returned an empty response."
            )
        except Exception as error:
            last_error = error
            print(
                "[Gemini] FAILED:",
                f"model={model_name}",
                f"code={get_error_code(error)}",
                f"error={repr(error)}",
            )
            if not is_retryable_gemini_error(
                error
            ):
                raise
            if index < len(
                GENERATION_MODELS
            ) - 1:
                print(
                    "[Gemini] Temporary error. "
                    "Switching to fallback model..."
                )
                time.sleep(
                    1
                )
    raise last_error or RuntimeError(
        "Gemini could not generate an answer."
    )
# ============================================================
# 34. GEMINI STREAMING GENERATION
# ============================================================
def generate_gemini_stream(
    prompt: str,
):
    last_error = None
    for index, model_name in enumerate(
        GENERATION_MODELS
    ):
        output = ""
        try:
            print(
                "[Gemini Stream] Trying model:",
                f"{model_name} "
                f"({index + 1}/{len(GENERATION_MODELS)})",
            )
            response_stream = (
                client.models.generate_content_stream(
                    model=model_name,
                    contents=prompt,
                )
            )
            for chunk in response_stream:
                try:
                    chunk_text = (
                        chunk.text
                        or ""
                    )
                except Exception:
                    chunk_text = ""
                if not chunk_text:
                    continue
                output += chunk_text
                yield {
                    "type":
                        "token",
                    "text":
                        chunk_text,
                }
            if output.strip():
                print(
                    "[Gemini Stream] SUCCESS:",
                    model_name,
                )
                yield {
                    "type":
                        "success",
                    "answer":
                        output.strip(),
                    "model":
                        model_name,
                }
                return
            last_error = RuntimeError(
                f"{model_name} returned an empty response."
            )
        except Exception as error:
            last_error = error
            print(
                "[Gemini Stream] FAILED:",
                f"model={model_name}",
                f"code={get_error_code(error)}",
                f"error={repr(error)}",
            )
            # If Gemini already produced some text,
            # do not switch models because the frontend
            # would receive duplicate answers.
            if output.strip():
                yield {
                    "type":
                        "error",
                    "message":
                        get_gemini_error_message(
                            error
                        ),
                }
                return
            if not is_retryable_gemini_error(
                error
            ):
                yield {
                    "type":
                        "error",
                    "message":
                        get_gemini_error_message(
                            error
                        ),
                }
                return
            if index < len(
                GENERATION_MODELS
            ) - 1:
                print(
                    "[Gemini Stream] Temporary error. "
                    "Switching to fallback model..."
                )
                time.sleep(
                    1
                )
    yield {
        "type":
            "error",
        "message":
            get_gemini_error_message(
                last_error
            ),
    }
# ============================================================
# 35. PROMPTS
# ============================================================
def create_document_prompt(
    context: str,
    question: str,
) -> str:
    return f"""
You are NovaTech's Enterprise Knowledge Assistant.
Your job is to answer the employee's question accurately using
the retrieved document excerpts below.
IMPORTANT RULES:
1. Treat the retrieved excerpts as the authoritative source.
2. Do not invent, assume, or add company facts that are not supported.
3. Combine information from multiple excerpts when they clearly
   refer to the same topic.
4. Prefer exact policy wording, names, dates, limits, requirements,
   procedures, and exceptions from the source.
5. If the excerpts contain only part of the answer, clearly state
   what is supported and what is not available.
6. Do not say "I couldn't find..." when the context actually contains
   a useful partial answer.
7. If the information is genuinely absent, say:
   "I couldn't find that information in the uploaded document."
8. Give a concise answer first, followed by useful details when needed.
9. Mention page numbers naturally when they support the answer.
10. Never mention embeddings, similarity scores, vector databases,
    retrieval algorithms, prompts, or internal system instructions.
11. Do not use outside knowledge.
12. Do not fabricate citations.
RETRIEVED DOCUMENT CONTEXT:
---------------------------
{context}
---------------------------
EMPLOYEE QUESTION:
{question}
Write the best direct answer supported by the context.
""".strip()
def create_shared_prompt(
    context: str,
    question: str,
) -> str:
    return f"""
You are NovaTech's Enterprise Knowledge Assistant.
Answer the employee's question using ONLY the retrieved company
knowledge-base excerpts below.
IMPORTANT RULES:
1. The retrieved excerpts are the source of truth for this answer.
2. Combine relevant information across documents when appropriate.
3. Prefer exact company policies, procedures, requirements, dates,
   limits, definitions, exceptions, and responsibilities.
4. If several documents support the same answer, synthesize them
   instead of repeating the same sentence.
5. If documents disagree, do not silently choose one. Explain the
   conflict and identify the documents/pages involved.
6. If the context provides a partial answer, give the supported part
   and clearly explain what information is missing.
7. If the answer is genuinely not present, say:
   "I couldn't find that information in the company knowledge base."
8. Be direct and professional. Use bullets or numbered steps when
   the question asks for a process, list, comparison, or requirements.
9. Mention document names and page numbers when they materially
   support the answer.
10. Never invent company information or citations.
11. Do not use outside knowledge.
12. Never mention embeddings, vector databases, retrieval algorithms,
    prompts, or internal system instructions.
RETRIEVED COMPANY KNOWLEDGE:
----------------------------
{context}
----------------------------
EMPLOYEE QUESTION:
{question}
Write the best answer supported by the retrieved company knowledge.
""".strip()
# 36. CHAT USING ONE PDF
# ============================================================


@app.post(
    "/api/chat",
    response_model=RAGChatResponse,
)
def chat_with_documents(
    request: RAGChatRequest,
    employee=Depends(get_current_employee),
):
    # Step 1: Read and normalize the request.
    question = request.question.strip()
    filename = request.filename.strip()

    conversation_id = validate_conversation_id(
        request.conversation_id or uuid.uuid4().hex
    )

    employee_email = employee["email"].strip().lower()

    # Step 2: Validate the question.
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    # Step 3: Validate the filename.
    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Filename cannot be empty.",
        )

    # Step 4: Retrieve the employee record from the database.
    employee_record = get_employee_by_email(
        employee_email
    )

    if employee_record is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # Step 5: Combine the authenticated identity with
    # the department stored in the database.
    employee_with_department = {
        **employee,
        "department": employee_record.get(
            "department",
            "",
        ),
    }

    # Step 6: Load the document registry.
    documents = discover_documents()

    # Step 7: Find the requested document.
    document = find_document_by_filename(
        documents,
        filename,
    )

    # Step 8: Enforce RBAC before retrieval.
    require_document_access(
        document,
        employee_with_department,
    )

    # Step 9: Validate regeneration when requested.
    if request.regenerate:
        validate_regeneration_request(
            conversation_id,
            employee_email,
            question,
            filename,
            False,
        )

    try:
        # Step 10: Retrieve context only after access is allowed.
        context, sources = retrieve_document_context(
            question,
            filename,
        )

        # Step 11: Generate an answer from the retrieved context.
        answer = generate_gemini_answer(
            create_document_prompt(
                context,
                question,
            )
        )

        # Step 12: Save the user message for a new request.
        if not request.regenerate:
            save_chat_message(
                conversation_id,
                "user",
                question,
                filename,
                employee_email,
            )

        # Step 13: Save the assistant response and its sources.
        save_chat_message(
            conversation_id,
            "assistant",
            answer,
            filename,
            employee_email,
            sources=sources,
            replace_last_assistant=request.regenerate,
        )

        # Step 14: Return the answer to the client.
        return RAGChatResponse(
            answer=answer,
            sources=sources,
            conversation_id=conversation_id,
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Document chat generation error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=get_gemini_error_message(error),
        )


# ============================================================
# 37. STREAMING CHAT USING ONE PDF
# ============================================================


@app.post("/api/chat/stream")
def stream_chat_with_documents(
    request: RAGChatRequest,
    employee=Depends(get_current_employee),
):
    question = request.question.strip()
    filename = request.filename.strip()

    conversation_id = validate_conversation_id(
        request.conversation_id or uuid.uuid4().hex
    )

    employee_email = (
        employee["email"].strip().lower()
    )

    # --------------------------------------------------
    # 1. Validate the request
    # --------------------------------------------------
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Filename cannot be empty.",
        )

    # --------------------------------------------------
    # 2. Load employee details and verify access
    # --------------------------------------------------
    documents = discover_documents()

    document = find_document_by_filename(
        documents,
        filename,
    )

    employee_record = get_employee_by_email(
        employee_email
    )

    if employee_record is None:
        raise HTTPException(
            status_code=404,
            detail="Employee record not found.",
        )

    employee_with_department = {
        **employee,
        "department": employee_record.get(
            "department", ""
        ),
    }

    require_document_access(
        document,
        employee_with_department,
    )

    # --------------------------------------------------
    # 3. Validate regeneration request
    # --------------------------------------------------
    if request.regenerate:
        validate_regeneration_request(
            conversation_id,
            employee_email,
            question,
            filename,
            False,
        )

    # --------------------------------------------------
    # 4. Retrieve document context
    # --------------------------------------------------
    try:
        context, sources = retrieve_document_context(
            question,
            filename,
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Streaming document retrieval error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Could not retrieve document "
                "information."
            ),
        )

    # --------------------------------------------------
    # 5. Validate retrieved context
    # --------------------------------------------------
    if not context or not str(context).strip():
        raise HTTPException(
            status_code=404,
            detail=(
                "No relevant information was found "
                "in the selected document."
            ),
        )

    # --------------------------------------------------
    # 6. Create the grounded prompt
    # --------------------------------------------------
    prompt = create_document_prompt(
        context,
        question,
    )

    # --------------------------------------------------
    # 7. Stream the generated answer
    # --------------------------------------------------
    def generate_stream():
        full_answer = ""
        assistant_saved = False

        try:
            if not request.regenerate:
                save_chat_message(
                    conversation_id,
                    "user",
                    question,
                    filename,
                    employee_email,
                )

            yield create_sse_event(
                "start",
                {
                    "conversation_id": conversation_id,
                    "sources": sources,
                    "citations": [],
                    "regenerate": request.regenerate,
                },
            )

            for event in generate_gemini_stream(
                prompt
            ):
                if event["type"] == "token":
                    full_answer += event["text"]

                    yield create_sse_event(
                        "token",
                        {
                            "text": event["text"],
                        },
                    )

                elif event["type"] == "success":
                    full_answer = event["answer"]
                    break

                elif event["type"] == "error":
                    yield create_sse_event(
                        "error",
                        {
                            "message": event["message"],
                        },
                    )
                    return

            full_answer = full_answer.strip()

            if not full_answer:
                yield create_sse_event(
                    "error",
                    {
                        "message": (
                            "The AI service could not "
                            "generate the answer. "
                            "Please try again."
                        ),
                    },
                )
                return

            # ------------------------------------------
            # 8. Save the completed assistant response
            # ------------------------------------------
            save_chat_message(
                conversation_id,
                "assistant",
                full_answer,
                filename,
                employee_email,
                sources=sources,
                citations=[],
                status="complete",
                replace_last_assistant=request.regenerate,
            )

            assistant_saved = True

            yield create_sse_event(
                "done",
                {
                    "answer": full_answer,
                    "sources": sources,
                    "citations": [],
                    "conversation_id": conversation_id,
                    "regenerate": request.regenerate,
                },
            )

        except Exception as error:
            print(
                "Streaming document chat error:",
                repr(error),
            )

            yield create_sse_event(
                "error",
                {
                    "message": get_gemini_error_message(
                        error
                    ),
                },
            )

        finally:
            # ------------------------------------------
            # 9. Save a partial response if interrupted
            # ------------------------------------------
            if (
                full_answer.strip()
                and not assistant_saved
            ):
                try:
                    save_chat_message(
                        conversation_id,
                        "assistant",
                        full_answer.strip(),
                        filename,
                        employee_email,
                        sources=sources,
                        citations=[],
                        status="interrupted",
                        replace_last_assistant=(
                            request.regenerate
                        ),
                    )

                except Exception as error:
                    print(
                        "Could not save partial "
                        "document response:",
                        repr(error),
                    )

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@app.post("/api/chat/stream")
def stream_chat_with_documents(
    request: RAGChatRequest,
    employee=Depends(get_current_employee),
):
    question = request.question.strip()
    filename = request.filename.strip()

    conversation_id = validate_conversation_id(
        request.conversation_id or uuid.uuid4().hex
    )

    employee_email = (
        employee["email"].strip().lower()
    )

    # --------------------------------------------------
    # 1. Validate the request
    # --------------------------------------------------
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Filename cannot be empty.",
        )

    # --------------------------------------------------
    # 2. Load employee details and verify access
    # --------------------------------------------------
    documents = discover_documents()

    document = find_document_by_filename(
        documents,
        filename,
    )

    employee_record = get_employee_by_email(
        employee_email
    )

    if employee_record is None:
        raise HTTPException(
            status_code=404,
            detail="Employee record not found.",
        )

    employee_with_department = {
        **employee,
        "department": employee_record.get(
            "department", ""
        ),
    }

    require_document_access(
        document,
        employee_with_department,
    )

    # --------------------------------------------------
    # 3. Validate regeneration request
    # --------------------------------------------------
    if request.regenerate:
        validate_regeneration_request(
            conversation_id,
            employee_email,
            question,
            filename,
            False,
        )

    # --------------------------------------------------
    # 4. Retrieve document context
    # --------------------------------------------------
    try:
        context, sources = retrieve_document_context(
            question,
            filename,
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Streaming document retrieval error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Could not retrieve document "
                "information."
            ),
        )

    # --------------------------------------------------
    # 5. Validate retrieved context
    # --------------------------------------------------
    if not context or not str(context).strip():
        raise HTTPException(
            status_code=404,
            detail=(
                "No relevant information was found "
                "in the selected document."
            ),
        )

    # --------------------------------------------------
    # 6. Create the grounded prompt
    # --------------------------------------------------
    prompt = create_document_prompt(
        context,
        question,
    )

    # --------------------------------------------------
    # 7. Stream the generated answer
    # --------------------------------------------------
    def generate_stream():
        full_answer = ""
        assistant_saved = False

        try:
            if not request.regenerate:
                save_chat_message(
                    conversation_id,
                    "user",
                    question,
                    filename,
                    employee_email,
                )

            yield create_sse_event(
                "start",
                {
                    "conversation_id": conversation_id,
                    "sources": sources,
                    "citations": [],
                    "regenerate": request.regenerate,
                },
            )

            for event in generate_gemini_stream(
                prompt
            ):
                if event["type"] == "token":
                    full_answer += event["text"]

                    yield create_sse_event(
                        "token",
                        {
                            "text": event["text"],
                        },
                    )

                elif event["type"] == "success":
                    full_answer = event["answer"]
                    break

                elif event["type"] == "error":
                    yield create_sse_event(
                        "error",
                        {
                            "message": event["message"],
                        },
                    )
                    return

            full_answer = full_answer.strip()

            if not full_answer:
                yield create_sse_event(
                    "error",
                    {
                        "message": (
                            "The AI service could not "
                            "generate the answer. "
                            "Please try again."
                        ),
                    },
                )
                return

            # ------------------------------------------
            # 8. Save the completed assistant response
            # ------------------------------------------
            save_chat_message(
                conversation_id,
                "assistant",
                full_answer,
                filename,
                employee_email,
                sources=sources,
                citations=[],
                status="complete",
                replace_last_assistant=request.regenerate,
            )

            assistant_saved = True

            yield create_sse_event(
                "done",
                {
                    "answer": full_answer,
                    "sources": sources,
                    "citations": [],
                    "conversation_id": conversation_id,
                    "regenerate": request.regenerate,
                },
            )

        except Exception as error:
            print(
                "Streaming document chat error:",
                repr(error),
            )

            yield create_sse_event(
                "error",
                {
                    "message": get_gemini_error_message(
                        error
                    ),
                },
            )

        finally:
            # ------------------------------------------
            # 9. Save a partial response if interrupted
            # ------------------------------------------
            if (
                full_answer.strip()
                and not assistant_saved
            ):
                try:
                    save_chat_message(
                        conversation_id,
                        "assistant",
                        full_answer.strip(),
                        filename,
                        employee_email,
                        sources=sources,
                        citations=[],
                        status="interrupted",
                        replace_last_assistant=(
                            request.regenerate
                        ),
                    )

                except Exception as error:
                    print(
                        "Could not save partial "
                        "document response:",
                        repr(error),
                    )

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@app.post("/api/chat/stream")
def stream_chat_with_documents(
    request: RAGChatRequest,
    employee=Depends(get_current_employee),
):
    question = request.question.strip()
    filename = request.filename.strip()

    conversation_id = validate_conversation_id(
        request.conversation_id or uuid.uuid4().hex
    )

    employee_email = (
        employee["email"].strip().lower()
    )

    # --------------------------------------------------
    # 1. Validate the request
    # --------------------------------------------------
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Filename cannot be empty.",
        )

    # --------------------------------------------------
    # 2. Load employee details and verify access
    # --------------------------------------------------
    documents = discover_documents()

    document = find_document_by_filename(
        documents,
        filename,
    )

    employee_record = get_employee_by_email(
        employee_email
    )

    if employee_record is None:
        raise HTTPException(
            status_code=404,
            detail="Employee record not found.",
        )

    employee_with_department = {
        **employee,
        "department": employee_record.get(
            "department", ""
        ),
    }

    require_document_access(
        document,
        employee_with_department,
    )

    # --------------------------------------------------
    # 3. Validate regeneration request
    # --------------------------------------------------
    if request.regenerate:
        validate_regeneration_request(
            conversation_id,
            employee_email,
            question,
            filename,
            False,
        )

    # --------------------------------------------------
    # 4. Retrieve document context
    # --------------------------------------------------
    try:
        context, sources = retrieve_document_context(
            question,
            filename,
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Streaming document retrieval error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Could not retrieve document "
                "information."
            ),
        )

    # --------------------------------------------------
    # 5. Validate retrieved context
    # --------------------------------------------------
    if not context or not str(context).strip():
        raise HTTPException(
            status_code=404,
            detail=(
                "No relevant information was found "
                "in the selected document."
            ),
        )

    # --------------------------------------------------
    # 6. Create the grounded prompt
    # --------------------------------------------------
    prompt = create_document_prompt(
        context,
        question,
    )

    # --------------------------------------------------
    # 7. Stream the generated answer
    # --------------------------------------------------
    def generate_stream():
        full_answer = ""
        assistant_saved = False

        try:
            if not request.regenerate:
                save_chat_message(
                    conversation_id,
                    "user",
                    question,
                    filename,
                    employee_email,
                )

            yield create_sse_event(
                "start",
                {
                    "conversation_id": conversation_id,
                    "sources": sources,
                    "citations": [],
                    "regenerate": request.regenerate,
                },
            )

            for event in generate_gemini_stream(
                prompt
            ):
                if event["type"] == "token":
                    full_answer += event["text"]

                    yield create_sse_event(
                        "token",
                        {
                            "text": event["text"],
                        },
                    )

                elif event["type"] == "success":
                    full_answer = event["answer"]
                    break

                elif event["type"] == "error":
                    yield create_sse_event(
                        "error",
                        {
                            "message": event["message"],
                        },
                    )
                    return

            full_answer = full_answer.strip()

            if not full_answer:
                yield create_sse_event(
                    "error",
                    {
                        "message": (
                            "The AI service could not "
                            "generate the answer. "
                            "Please try again."
                        ),
                    },
                )
                return

            # ------------------------------------------
            # 8. Save the completed assistant response
            # ------------------------------------------
            save_chat_message(
                conversation_id,
                "assistant",
                full_answer,
                filename,
                employee_email,
                sources=sources,
                citations=[],
                status="complete",
                replace_last_assistant=request.regenerate,
            )

            assistant_saved = True

            yield create_sse_event(
                "done",
                {
                    "answer": full_answer,
                    "sources": sources,
                    "citations": [],
                    "conversation_id": conversation_id,
                    "regenerate": request.regenerate,
                },
            )

        except Exception as error:
            print(
                "Streaming document chat error:",
                repr(error),
            )

            yield create_sse_event(
                "error",
                {
                    "message": get_gemini_error_message(
                        error
                    ),
                },
            )

        finally:
            # ------------------------------------------
            # 9. Save a partial response if interrupted
            # ------------------------------------------
            if (
                full_answer.strip()
                and not assistant_saved
            ):
                try:
                    save_chat_message(
                        conversation_id,
                        "assistant",
                        full_answer.strip(),
                        filename,
                        employee_email,
                        sources=sources,
                        citations=[],
                        status="interrupted",
                        replace_last_assistant=(
                            request.regenerate
                        ),
                    )

                except Exception as error:
                    print(
                        "Could not save partial "
                        "document response:",
                        repr(error),
                    )

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )



# ============================================================
# 38. SHARED KNOWLEDGE STREAMING CHAT
# ============================================================

SHARED_FILENAME = "shared knowledge base"


@app.post("/api/chat/shared/stream")
def stream_shared_chat(
    request: SharedChatRequest,
    employee=Depends(get_current_employee),
):
    question = request.question.strip()

    conversation_id = validate_conversation_id(
        request.conversation_id or uuid.uuid4().hex
    )

    employee_email = (
        employee["email"].strip().lower()
    )

    # --------------------------------------------------
    # 1. Validate the question
    # --------------------------------------------------
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

        # --------------------------------------------------
    # 2. Load the authenticated employee's database record
    # --------------------------------------------------
    employee_record = get_employee_by_email(
        employee_email
    )

    if employee_record is None:
        raise HTTPException(
            status_code=401,
            detail="Employee account not found.",
        )

    employee_with_department = {
        **employee,
        "email": employee_email,
        "role": "employee",
        "department": str(
            employee_record.get("department") or ""
        ).strip(),
    }

    if not employee_with_department["department"]:
        raise HTTPException(
            status_code=403,
            detail=(
                "Your department is not configured. "
                "Contact the administrator."
            ),
        )

    # --------------------------------------------------
    # 3. Validate regeneration
    # --------------------------------------------------
    if request.regenerate:
        validate_regeneration_request(
            conversation_id,
            employee_email,
            question,
            SHARED_FILENAME,
            True,
        )

    
    # --------------------------------------------------
    # 4. Retrieve ONLY authorized document context
    # --------------------------------------------------
    try:
        # Retrieve context only from documents the employee
        # is authorized to access.
        context, sources, citations = retrieve_shared_context(
            question,
            employee=employee_with_department,
        )

    except HTTPException:
        # Preserve HTTP errors raised by the retrieval function.
        raise

    except Exception as error:
        # Log the actual error on the backend for debugging.
        print(
            "Streaming shared retrieval error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Could not retrieve information "
                "from the company knowledge base."
            ),
        )

    # --------------------------------------------------
    # 5. Validate the retrieved context
    # --------------------------------------------------
    if not context or not str(context).strip():
        raise HTTPException(
            status_code=404,
            detail=(
                "No relevant information was found "
                "in the accessible company documents."
            ),
        )


    # --------------------------------------------------
    # 5. Create the grounded prompt
    # --------------------------------------------------
    prompt = create_shared_prompt(
        context,
        question,
    )

    # --------------------------------------------------
    # 6. Stream the answer
    # --------------------------------------------------
    def generate_stream():
        full_answer = ""
        assistant_saved = False

        try:
            if not request.regenerate:
                save_chat_message(
                    conversation_id,
                    "user",
                    question,
                    SHARED_FILENAME,
                    employee_email,
                )

            yield create_sse_event(
                "start",
                {
                    "conversation_id": conversation_id,
                    "sources": sources,
                    "citations": citations,
                    "regenerate": request.regenerate,
                },
            )

            for event in generate_gemini_stream(prompt):
                if event["type"] == "token":
                    full_answer += event["text"]

                    yield create_sse_event(
                        "token",
                        {"text": event["text"]},
                    )

                elif event["type"] == "success":
                    full_answer = event["answer"]
                    break

                elif event["type"] == "error":
                    yield create_sse_event(
                        "error",
                        {"message": event["message"]},
                    )
                    return

            full_answer = full_answer.strip()

            if not full_answer:
                yield create_sse_event(
                    "error",
                    {
                        "message": (
                            "The AI service could not "
                            "generate the answer. "
                            "Please try again."
                        )
                    },
                )
                return

            save_chat_message(
                conversation_id,
                "assistant",
                full_answer,
                SHARED_FILENAME,
                employee_email,
                sources=sources,
                citations=citations,
                status="complete",
                replace_last_assistant=request.regenerate,
            )

            assistant_saved = True

            yield create_sse_event(
                "done",
                {
                    "answer": full_answer,
                    "sources": sources,
                    "citations": citations,
                    "conversation_id": conversation_id,
                    "regenerate": request.regenerate,
                },
            )

        except Exception as error:
            print(
                "Streaming shared chat error:",
                repr(error),
            )

            yield create_sse_event(
                "error",
                {
                    "message": get_gemini_error_message(
                        error
                    )
                },
            )

        finally:
            if full_answer.strip() and not assistant_saved:
                try:
                    save_chat_message(
                        conversation_id,
                        "assistant",
                        full_answer.strip(),
                        SHARED_FILENAME,
                        employee_email,
                        sources=sources,
                        citations=citations,
                        status="interrupted",
                        replace_last_assistant=request.regenerate,
                    )

                except Exception as error:
                    print(
                        "Could not save partial shared response:",
                        repr(error),
                    )

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

# ============================================================
# 39. NON-STREAMING SHARED CHAT
# ============================================================
@app.post(
    "/api/chat/shared",
    response_model=RAGChatResponse,
)
def chat_with_shared_knowledge(
    request: SharedChatRequest,
    employee=Depends(get_current_employee),
):
    question = request.question.strip()
    conversation_id = (
        validate_conversation_id(
            request.conversation_id
            or uuid.uuid4().hex
        )
    )
    employee_email = (
        employee["email"]
        .strip()
        .lower()
    )
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )
    if request.regenerate:
        validate_regeneration_request(
            conversation_id,
            employee_email,
            question,
            SHARED_FILENAME,
            True,
        )
    try:
        (
            context,
            sources,
            citations,
        ) = retrieve_shared_context(
            question
        )
        answer = generate_gemini_answer(
            create_shared_prompt(
                context,
                question,
            )
        )
        if not request.regenerate:
            save_chat_message(
                conversation_id,
                "user",
                question,
                SHARED_FILENAME,
                employee_email,
            )
        save_chat_message(
            conversation_id,
            "assistant",
            answer,
            SHARED_FILENAME,
            employee_email,
            sources=sources,
            citations=citations,
            replace_last_assistant=
                request.regenerate,
        )
        return RAGChatResponse(
            answer=answer,
            sources=sources,
            citations=citations,
            conversation_id=
                conversation_id,
        )
    except HTTPException:
        raise
    except Exception as error:
        print(
            "Shared chat generation error:",
            repr(error),
        )
        raise HTTPException(
            status_code=502,
            detail=get_gemini_error_message(
                error
            ),
        )
# ============================================================
# 40. DELETE DOCUMENT
# ============================================================
@app.delete(
    "/api/documents/{filename}"
)
def delete_document(
    filename: str,
    admin=Depends(get_current_admin),
):
    file_path = get_pdf_path(
        filename
    )
    embedding_path = (
        VECTOR_STORE_DIR
        / f"{filename}.json"
    )
    documents = load_documents()
    try:
        file_path.unlink()
        if embedding_path.is_file():
            embedding_path.unlink()
        documents = [
            document
            for document in documents
            if document.get(
                "saved_filename"
            ) != filename
        ]
        save_documents(
            documents
        )
        return {
            "message":
                "Document deleted successfully.",
            "filename":
                filename,
        }
    except OSError as error:
        print(
            "Document delete error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not delete the document."
            ),
        )
# ============================================================
# 41. DELETE CONVERSATION
# ============================================================
@app.delete(
    "/api/conversations/{conversation_id}"
)
def delete_conversation(
    conversation_id: str,
    employee=Depends(get_current_employee),
):
    conversation_id = (
        validate_conversation_id(
            conversation_id
        )
    )
    get_owned_conversation(
        conversation_id,
        employee["email"],
    )
    history_path = (
        CHAT_HISTORY_DIR
        / f"{conversation_id}.json"
    )
    try:
        history_path.unlink()
        return {
            "message":
                "Conversation deleted successfully.",
            "conversation_id":
                conversation_id,
        }
    except OSError as error:
        print(
            "Chat history delete error:",
            repr(error),
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not delete conversation."
            ),
        )
     