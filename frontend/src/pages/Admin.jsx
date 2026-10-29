import { useCallback, useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getAdminToken() {
  return (
    localStorage.getItem("adminAccessToken") ||
    sessionStorage.getItem("adminAccessToken")
  );
}

async function readResponse(response) {
  return response.json().catch(() => ({}));
}

export default function Admin() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Admin login required. Please sign in first."
        );
      }

      const response = await fetch(
        `${API_URL}/api/documents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readResponse(response);

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          data.detail ||
            "Admin authorization failed. Please sign in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not load documents."
        );
      }

      setDocuments(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not load saved documents."
      );
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(event) {
    event.preventDefault();

    if (files.length === 0) {
      setError(
        "Please select one or more PDF files first."
      );
      return;
    }

    const token = getAdminToken();

    if (!token) {
      setError(
        "Admin login required. Please sign in first."
      );
      return;
    }

    setBusy(true);
    setStatus("");
    setError("");

    const selectedFiles = [...files];
    let uploadedCount = 0;
    let failedCount = 0;
    const messages = [];

    try {
      for (const file of selectedFiles) {
        setStatus(`Uploading ${file.name}…`);

        try {
          const formData = new FormData();
          formData.append("file", file);

          const uploadResponse = await fetch(
            `${API_URL}/api/upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

          const uploadData =
            await readResponse(uploadResponse);

          if (!uploadResponse.ok) {
            throw new Error(
              uploadData.detail ||
                "Document upload failed."
            );
          }

          const savedFilename =
            uploadData.saved_filename;

          if (!savedFilename) {
            throw new Error(
              "The backend did not return a saved filename."
            );
          }

          setStatus(
            `Processing ${file.name}…`
          );

          const embeddingUrl =
            `${API_URL}/api/documents/${encodeURIComponent(
              savedFilename
            )}` +
            `/save-embeddings?original_filename=` +
            encodeURIComponent(
              uploadData.original_filename ||
                file.name
            );

          const embeddingResponse =
            await fetch(
              embeddingUrl,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          const embeddingData =
            await readResponse(
              embeddingResponse
            );

          if (!embeddingResponse.ok) {
            throw new Error(
              embeddingData.detail ||
                "Could not create embeddings."
            );
          }

          uploadedCount += 1;

          messages.push(
            `${file.name}: processed ${
              embeddingData.chunk_count ??
              "unknown"
            } chunks`
          );
        } catch (err) {
          failedCount += 1;

          messages.push(
            `${file.name}: ${err.message}`
          );
        }
      }

      setStatus(
        `Finished. ${uploadedCount} processed; ${failedCount} failed. ` +
          messages.join(" | ")
      );

      setFiles([]);
      event.target.reset();

      await loadDocuments();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(document) {
    const name =
      document.original_filename ||
      document.saved_filename;

    if (
      !window.confirm(
        `Delete "${name}" and its saved embeddings?`
      )
    ) {
      return;
    }

    const token = getAdminToken();

    if (!token) {
      setError(
        "Admin login required. Please sign in first."
      );
      return;
    }

    setDeleting(
      document.saved_filename
    );

    setStatus("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/documents/${encodeURIComponent(
          document.saved_filename
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not delete document."
        );
      }

      setStatus(
        `Deleted "${name}".`
      );

      await loadDocuments();
    } catch (err) {
      setError(
        err.message ||
          "Could not delete document."
      );
    } finally {
      setDeleting("");
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F8F8] px-4 py-6 text-[#171717] sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="mb-7 rounded-2xl border border-[#E4E4E4] bg-white px-5 py-5 shadow-sm sm:px-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              {/* Admin Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7A1F2B]">
                <span className="text-sm font-bold tracking-wide text-white">
                  AD
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A1F2B]">
                  Enterprise Knowledge Chatbot
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#171717] sm:text-3xl">
                  Admin · Knowledge Base
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6B6B]">
                  Upload company PDFs, process them for
                  chatbot search, and manage documents
                  already saved in the backend.
                </p>
              </div>

            </div>

            <div className="shrink-0">
              <LogoutButton role="admin" />
            </div>

          </div>

        </header>

        {/* ==================================================
            UPLOAD SECTION
        ================================================== */}

        <section className="rounded-2xl border border-[#E4E4E4] bg-white p-5 shadow-sm sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F9EFF0]">
              <svg
                className="h-5 w-5 text-[#7A1F2B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M12 16V4m0 0L8 8m4-4l4 4M5 20h14"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#171717]">
                Upload Documents
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#6B6B6B]">
                Select multiple PDF files. Identical
                file contents are rejected as duplicates.
              </p>
            </div>

          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={handleUpload}
          >

            <div>

              <label
                htmlFor="documents"
                className="mb-2 block text-sm font-semibold text-[#171717]"
              >
                PDF documents
              </label>

              <div className="rounded-xl border border-dashed border-[#D4D4D4] bg-[#FAFAFA] p-4 transition hover:border-[#B9B9B9]">

                <input
                  id="documents"
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  disabled={busy}
                  onChange={(event) => {
                    setFiles(
                      Array.from(
                        event.target.files || []
                      )
                    );
                    setStatus("");
                    setError("");
                  }}
                  className="block w-full cursor-pointer text-sm text-[#5F5F5F] file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#7A1F2B] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#641923]"
                />

              </div>

              {files.length > 0 && (
                <div className="mt-3 rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] p-3">

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    Selected files ({files.length})
                  </p>

                  <ul className="space-y-1.5 text-sm text-[#5F5F5F]">

                    {files.map((file) => (
                      <li
                        key={`${file.name}-${file.size}`}
                        className="flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7A1F2B]" />

                        <span className="break-all">
                          {file.name}
                        </span>
                      </li>
                    ))}

                  </ul>

                </div>
              )}

            </div>

            <button
              type="submit"
              disabled={
                busy ||
                files.length === 0
              }
              className="w-full rounded-lg bg-[#7A1F2B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641923] focus:outline-none focus:ring-2 focus:ring-[#7A1F2B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {busy
                ? "Uploading and processing…"
                : "Upload and process PDFs"}
            </button>

          </form>

          {/* Processing Status */}

          {busy && (
            <div
              className="mt-5 flex items-center gap-3 rounded-lg border border-[#E4D2D5] bg-[#F9EFF0] px-4 py-3 text-sm text-[#7A1F2B]"
              aria-live="polite"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7A1F2B]" />

              <span>{status}</span>
            </div>
          )}

          {/* Success Status */}

          {status && !busy && (
            <div
              className="mt-5 break-words rounded-lg border border-[#CBE5D5] bg-[#EDF7F1] p-4 text-sm text-[#347552]"
              role="status"
            >
              {status}
            </div>
          )}

          {/* Error */}

          {error && (
            <div
              className="mt-5 break-words rounded-lg border border-[#E5B8BD] bg-[#FBEDEF] p-4 text-sm text-[#9A303E]"
              role="alert"
            >
              {error}
            </div>
          )}

        </section>

        {/* ==================================================
            SAVED DOCUMENTS
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-[#E4E4E4] bg-white p-5 shadow-sm sm:p-7">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F9EFF0]">
                <svg
                  className="h-5 w-5 text-[#7A1F2B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M15 3v5h5"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#171717]">
                  Saved Documents
                </h2>

                <p className="mt-1 text-sm text-[#6B6B6B]">
                  Documents remain listed after the
                  backend restarts.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={loadDocuments}
              disabled={
                busy ||
                Boolean(deleting)
              }
              className="rounded-lg border border-[#D8D8D8] bg-white px-4 py-2.5 text-sm font-semibold text-[#52141C] transition hover:border-[#7A1F2B] hover:bg-[#F9EFF0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh list
            </button>

          </div>

          {/* No documents */}

          {documents.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#DCDCDC] bg-[#FAFAFA] px-5 py-10 text-center">

              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F1F1F1]">

                <svg
                  className="h-5 w-5 text-[#8A8A8A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    d="M15 3v5h5"
                  />
                </svg>

              </div>

              <p className="mt-3 text-sm font-medium text-[#5F5F5F]">
                No documents found.
              </p>

              <p className="mt-1 text-xs text-[#8A8A8A]">
                Upload a PDF to get started.
              </p>

            </div>
          ) : (

            <div className="mt-6 space-y-3">

              {documents.map((document) => (

                <article
                  key={document.saved_filename}
                  className="flex flex-col gap-4 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-4 transition hover:border-[#D4D4D4] hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="min-w-0">

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E8E8E8]">

                        <svg
                          className="h-4 w-4 text-[#7A1F2B]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M15 3v5h5"
                          />

                        </svg>

                      </div>

                      <div className="min-w-0">

                        <p className="break-words font-semibold text-[#171717]">
                          {document.original_filename ||
                            document.saved_filename}
                        </p>

                        <p className="mt-1 break-all text-xs text-[#8A8A8A]">
                          {document.saved_filename}
                        </p>

                        <p className="mt-2 text-sm">

                          {document.processed ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-[#3F8F62]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#3F8F62]" />
                              Processed · Ready for chat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-medium text-[#B7791F]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" />
                              Uploaded · Embeddings not found
                            </span>
                          )}

                        </p>

                      </div>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(document)
                    }
                    disabled={
                      busy ||
                      Boolean(deleting)
                    }
                    className="w-full rounded-lg border border-[#E2B8BD] bg-white px-4 py-2.5 text-sm font-semibold text-[#A23845] transition hover:border-[#B84A56] hover:bg-[#FBEDEF] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {deleting ===
                    document.saved_filename
                      ? "Deleting…"
                      : "Delete"}
                  </button>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* ==================================================
            SECURITY NOTE
        ================================================== */}

        <div className="mt-5 flex items-center gap-2 px-1 text-xs text-[#8A8A8A]">

          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              d="M9.5 12l1.7 1.7 3.5-3.5"
            />
          </svg>

          <span>
            Admin access is protected by backend
            authentication.
          </span>

        </div>

      </div>

    </main>
  );
}