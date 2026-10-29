
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFilePdf,
  FaFileAlt,
  FaArrowRight,
} from "react-icons/fa";

function getEmployeeToken() {
  return (
    localStorage.getItem("employeeAccessToken") ||
    sessionStorage.getItem("employeeAccessToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

function extractDocuments(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.documents)) {
    return data.documents;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!size || size < 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getDocumentName(document) {
  return (
    document.original_filename ||
    document.filename ||
    document.file_name ||
    document.title ||
    document.saved_filename ||
    "Untitled document"
  );
}

function RecentDocuments() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      const token = getEmployeeToken();

      if (!token) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/employee/documents",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Documents request failed: ${response.status}`
          );
        }

        const data = await response.json();

        const documentList = extractDocuments(data);

        documentList.sort((a, b) => {
          const dateA =
            a.updated_at ||
            a.updatedAt ||
            a.created_at ||
            a.createdAt ||
            0;

          const dateB =
            b.updated_at ||
            b.updatedAt ||
            b.created_at ||
            b.createdAt ||
            0;

          return (
            new Date(dateB).getTime() -
            new Date(dateA).getTime()
          );
        });

        if (!cancelled) {
          setDocuments(documentList.slice(0, 5));
        }
      } catch (error) {
        console.error(
          "Failed to load recent documents:",
          error
        );

        if (!cancelled) {
          setDocuments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-xl border border-[#E5EAF0] bg-white shadow-sm">

      {/* Card Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E5EAF0] px-5 py-4">

        <div>
          <h2 className="text-sm font-semibold text-[#334155]">
            Recent Documents
          </h2>

          <p className="mt-1 text-xs text-[#8491A3]">
            Latest documents available in the knowledge base
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/documents")}
          className="
            flex shrink-0 items-center gap-1
            text-xs font-medium
            text-[#6F9BCB]
            transition-colors
            hover:text-[#4F83BB]
          "
        >
          View all
          <FaArrowRight className="text-[10px]" />
        </button>

      </div>

      {/* Document List */}
      <div className="divide-y divide-[#EEF1F5]">

        {/* Loading State */}
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="h-10 w-10 animate-pulse rounded-lg bg-[#F1F5F9]" />

              <div className="min-w-0 flex-1">
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#F1F5F9]" />

                <div className="mt-2 h-2 w-1/3 animate-pulse rounded bg-[#F1F5F9]" />
              </div>
            </div>
          ))

        ) : documents.length === 0 ? (

          /* Empty State */
          <div className="px-5 py-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#94A3B8]">
              <FaFileAlt className="text-lg" />
            </div>

            <p className="mt-3 text-sm font-medium text-[#64748B]">
              No documents available
            </p>

            <p className="mt-1 text-xs text-[#94A3B8]">
              Your recently uploaded documents will appear here.
            </p>

          </div>

        ) : (

          /* Documents */
          documents.map((document) => {
            const name = getDocumentName(document);

            return (
              <button
                key={
                  document.saved_filename ||
                  document.filename ||
                  name
                }
                type="button"
                onClick={() => navigate("/documents")}
                className="
                  flex w-full items-center gap-4
                  px-5 py-4 text-left
                  transition-colors duration-200
                  hover:bg-[#F8FAFC]
                "
              >

                {/* PDF Icon */}
                <div className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-lg
                  bg-[#FDF0F0]
                  text-[#D98F8F]
                ">
                  <FaFilePdf className="text-base" />
                </div>

                {/* Document Information */}
                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-medium text-[#475569]">
                    {name}
                  </p>

                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#94A3B8]">
                    <span>
                      {formatFileSize(document.size)}
                    </span>

                    {document.processed && (
                      <span className="font-medium text-[#86B99A]">
                        • Processed
                      </span>
                    )}
                  </p>

                </div>

                {/* Arrow */}
                <FaArrowRight className="shrink-0 text-[10px] text-[#CBD5E1]" />

              </button>
            );
          })
        )}

      </div>
    </section>
  );
}

export default RecentDocuments;