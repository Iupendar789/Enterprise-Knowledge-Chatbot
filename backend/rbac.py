
from pathlib import Path
from typing import Any

from fastapi import HTTPException



VALID_ROLES = {"employee", "admin"}


def normalize_values(values: Any) -> set[str]:
    """Normalize permission values to lowercase strings."""
    if not isinstance(values, list):
        return set()

    return {
        str(value).strip().lower()
        for value in values
        if str(value).strip()
    }


def employee_can_access_document(
    document: dict,
    employee: dict,
) -> bool:
    """
    Check both role and department permissions.

    Missing or invalid permission metadata denies employee access.
    Admin access is determined by the authenticated backend identity.
    """

    role = str(
        employee.get("role", "employee")
    ).strip().lower()

    if role == "admin":
        return True

    if role != "employee":
        return False

    # Fail closed if either permission field is missing.
    if (
        "allowed_roles" not in document
        or "allowed_departments" not in document
    ):
        return False

    allowed_roles = normalize_values(
        document.get("allowed_roles")
    )

    allowed_departments = normalize_values(
        document.get("allowed_departments")
    )

    department = str(
        employee.get("department", "")
    ).strip().lower()

    if not department:
        return False

    if role not in allowed_roles:
        return False

    if "*" in allowed_departments:
        return True

    return department in allowed_departments


def require_document_access(
    document: dict | None,
    employee: dict,
) -> dict:
    """Return an authorized document or reject the request."""

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    if not employee_can_access_document(
        document,
        employee,
    ):
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    return document


def find_document_by_filename(
    documents: list[dict],
    filename: str,
) -> dict | None:
    """Find a document by its stored filename."""

    requested_filename = Path(filename).name

    for document in documents:
        saved_filename = document.get("saved_filename")

        if (
            isinstance(saved_filename, str)
            and saved_filename == requested_filename
        ):
            return document

    return None


def filter_accessible_documents(
    documents: list[dict],
    employee: dict,
) -> list[dict]:
    """Return only documents accessible to the authenticated user."""

    return [
        document
        for document in documents
        if employee_can_access_document(
            document,
            employee,
        )
    ]


def assign_document_permissions(
    document: dict,
    allowed_roles: list[str],
    allowed_departments: list[str],
) -> dict:
    """Validate permission values before saving them."""

    roles = normalize_values(allowed_roles)
    departments = normalize_values(allowed_departments)

    if not roles:
        raise HTTPException(
            status_code=400,
            detail="Select at least one allowed role.",
        )

    if not roles.issubset(VALID_ROLES):
        raise HTTPException(
            status_code=400,
            detail="Invalid role supplied.",
        )

    if not departments:
        raise HTTPException(
            status_code=400,
            detail="Select at least one allowed department.",
        )

    document["allowed_roles"] = sorted(roles)
    document["allowed_departments"] = sorted(departments)

    return document
