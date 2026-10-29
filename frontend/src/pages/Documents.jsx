import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";


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


function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 KB";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


export default function Documents() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");


  // --------------------------------------------------
  // Fetch employee documents
  // --------------------------------------------------

  const fetchDocuments = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getEmployeeToken();

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/employee/documents",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load documents."
        );
      }

      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Documents error:", err);

      setError(
        err.message ||
          "Something went wrong while loading documents."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // --------------------------------------------------
  // Load documents when page opens
  // --------------------------------------------------

  useEffect(() => {
    fetchDocuments();
  }, []);


  // --------------------------------------------------
  // Search documents
  // --------------------------------------------------

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return documents;
    }

    return documents.filter((document) => {
      const originalName =
        document.original_filename?.toLowerCase() || "";

      const savedName =
        document.saved_filename?.toLowerCase() || "";

      return (
        originalName.includes(query) ||
        savedName.includes(query)
      );
    });
  }, [documents, searchTerm]);


  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const processedCount = documents.filter(
    (document) => document.processed
  ).length;


  const totalSize = documents.reduce(
    (total, document) => total + (document.size || 0),
    0
  );


  // --------------------------------------------------
  // Open chat for selected document
  // --------------------------------------------------

  const handleChat = (document) => {
    if (!document.processed) {
      toast.error(
        "This document has not been processed for chat yet."
      );
      return;
    }

    navigate(
      `/chat?document=${encodeURIComponent(
        document.saved_filename
      )}&name=${encodeURIComponent(
        document.original_filename || document.saved_filename
      )}`
    );
  };


  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#171717]">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <header className="border-b border-[#E4E4E4] bg-white">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* Page title */}

            <div className="flex items-center gap-3">

              <button
                onClick={() => navigate("/dashboard")}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-[#E4E4E4]
                  bg-white
                  text-[#5F5F5F]
                  transition
                  hover:border-[#D4D4D4]
                  hover:bg-[#FAF5F6]
                  hover:text-[#7A1F2B]
                "
                title="Back to dashboard"
              >
                <FiArrowLeft size={17} />
              </button>


              <div>

                <h1 className="text-lg font-semibold text-[#171717]">
                  Documents
                </h1>

                <p className="mt-0.5 text-xs text-[#8A8A8A]">
                  Browse documents available in the enterprise
                  knowledge base
                </p>

              </div>

            </div>


            {/* Refresh button */}

            <button
              onClick={() => fetchDocuments(true)}
              disabled={refreshing}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-[#E4E4E4]
                bg-white
                px-3.5
                py-2
                text-xs
                font-medium
                text-[#5F5F5F]
                transition
                hover:border-[#D8C1C5]
                hover:bg-[#FAF5F6]
                hover:text-[#7A1F2B]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <FiRefreshCw
                size={14}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />

              {refreshing ? "Refreshing..." : "Refresh"}

            </button>

          </div>

        </div>

      </header>


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">


        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">


          {/* Total Documents */}

          <div
            className="
              rounded-xl
              border
              border-[#E4E4E4]
              bg-white
              p-4
              shadow-[0_1px_3px_rgba(0,0,0,0.04)]
              transition
              hover:border-[#D8C1C5]
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs text-[#8A8A8A]">
                  Total Documents
                </p>

                <p className="mt-1 text-xl font-semibold text-[#171717]">
                  {documents.length}
                </p>

              </div>


              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#F9EFF0]
                  text-[#7A1F2B]
                "
              >
                <FiFileText size={17} />
              </div>

            </div>

          </div>


          {/* Ready for Chat */}

          <div
            className="
              rounded-xl
              border
              border-[#E4E4E4]
              bg-white
              p-4
              shadow-[0_1px_3px_rgba(0,0,0,0.04)]
              transition
              hover:border-[#D8C1C5]
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs text-[#8A8A8A]">
                  Ready for Chat
                </p>

                <p className="mt-1 text-xl font-semibold text-[#171717]">
                  {processedCount}
                </p>

              </div>


              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#EDF7F1]
                  text-[#3F8F62]
                "
              >
                <FiCheckCircle size={17} />
              </div>

            </div>

          </div>


          {/* Knowledge Base Size */}

          <div
            className="
              rounded-xl
              border
              border-[#E4E4E4]
              bg-white
              p-4
              shadow-[0_1px_3px_rgba(0,0,0,0.04)]
              transition
              hover:border-[#D8C1C5]
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs text-[#8A8A8A]">
                  Knowledge Base Size
                </p>

                <p className="mt-1 text-xl font-semibold text-[#171717]">
                  {formatFileSize(totalSize)}
                </p>

              </div>


              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#F4F1F1]
                  text-[#7A1F2B]
                "
              >
                <FiFileText size={17} />
              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-md">

            <FiSearch
              size={16}
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-[#8A8A8A]
              "
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search documents..."
              className="
                w-full
                rounded-lg
                border
                border-[#E4E4E4]
                bg-white
                py-2.5
                pl-9
                pr-4
                text-sm
                text-[#171717]
                outline-none
                transition
                placeholder:text-[#A3A3A3]
                focus:border-[#7A1F2B]
                focus:ring-2
                focus:ring-[#7A1F2B]/10
              "
            />

          </div>


          <p className="text-xs text-[#8A8A8A]">
            Showing {filteredDocuments.length} of{" "}
            {documents.length} documents
          </p>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-[#E8C7CC]
              bg-[#FBEDEF]
              p-4
            "
          >

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-medium text-[#B84A56]">
                  Unable to load documents
                </p>

                <p className="mt-1 text-xs text-[#7A7A7A]">
                  {error}
                </p>

              </div>


              <button
                onClick={() => fetchDocuments()}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  border-[#E8C7CC]
                  bg-white
                  px-3
                  py-2
                  text-xs
                  font-medium
                  text-[#B84A56]
                  transition
                  hover:bg-[#F8E3E6]
                "
              >

                <FiRefreshCw size={13} />

                Try again

              </button>

            </div>

          </div>
        )}


        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div
            className="
              rounded-xl
              border
              border-[#E4E4E4]
              bg-white
              p-12
            "
          >

            <div className="flex items-center justify-center gap-3 text-sm text-[#8A8A8A]">

              <FiRefreshCw
                size={17}
                className="animate-spin text-[#7A1F2B]"
              />

              Loading documents...

            </div>

          </div>
        )}


        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!loading &&
          !error &&
          filteredDocuments.length === 0 && (

            <div
              className="
                rounded-xl
                border
                border-dashed
                border-[#DADADA]
                bg-white
                p-12
                text-center
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#F9EFF0]
                  text-[#7A1F2B]
                "
              >
                <FiFileText size={21} />
              </div>


              <h2 className="mt-4 text-sm font-semibold text-[#171717]">

                {documents.length === 0
                  ? "No documents available"
                  : "No matching documents"}

              </h2>


              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#8A8A8A]">

                {documents.length === 0
                  ? "There are currently no documents available in the enterprise knowledge base."
                  : "Try changing your search term to find another document."}

              </p>

            </div>
          )}


        {/* ==================================================
            DOCUMENTS TABLE
        ================================================== */}

        {!loading &&
          filteredDocuments.length > 0 && (

            <div
              className="
                overflow-hidden
                rounded-xl
                border
                border-[#E4E4E4]
                bg-white
                shadow-[0_1px_3px_rgba(0,0,0,0.04)]
              "
            >

              {/* Desktop Header */}

              <div
                className="
                  hidden
                  grid-cols-[minmax(0,2fr)_120px_130px_120px]
                  gap-4
                  border-b
                  border-[#E4E4E4]
                  bg-[#F5F5F5]
                  px-5
                  py-3
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-[#6F6F6F]
                  md:grid
                "
              >

                <span>Document</span>

                <span>Size</span>

                <span>Status</span>

                <span className="text-right">
                  Actions
                </span>

              </div>


              {/* Document Rows */}

              <div className="divide-y divide-[#EEEEEE]">

                {filteredDocuments.map((document) => (

                  <div
                    key={
                      document.saved_filename ||
                      document.original_filename
                    }
                    className="
                      px-4
                      py-4
                      transition
                      hover:bg-[#FAF5F6]
                      md:px-5
                    "
                  >

                    {/* ==================================================
                        DESKTOP
                    ================================================== */}

                    <div
                      className="
                        hidden
                        grid-cols-[minmax(0,2fr)_120px_130px_120px]
                        items-center
                        gap-4
                        md:grid
                      "
                    >

                      {/* Document */}

                      <div className="flex min-w-0 items-center gap-3">

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-[#F9EFF0]
                            text-[#7A1F2B]
                          "
                        >
                          <FiFileText size={18} />
                        </div>


                        <div className="min-w-0">

                          <p
                            className="
                              truncate
                              text-sm
                              font-medium
                              text-[#171717]
                            "
                            title={
                              document.original_filename ||
                              document.saved_filename
                            }
                          >
                            {document.original_filename ||
                              document.saved_filename}
                          </p>


                          <p className="mt-1 truncate text-[11px] text-[#A3A3A3]">
                            {document.saved_filename}
                          </p>

                        </div>

                      </div>


                      {/* Size */}

                      <div className="text-xs text-[#5F5F5F]">
                        {formatFileSize(document.size)}
                      </div>


                      {/* Status */}

                      <div>

                        {document.processed ? (

                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-[#EDF7F1]
                              px-2.5
                              py-1
                              text-[11px]
                              font-medium
                              text-[#3F8F62]
                            "
                          >

                            <FiCheckCircle size={12} />

                            Ready

                          </span>

                        ) : (

                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              bg-[#FBF5E8]
                              px-2.5
                              py-1
                              text-[11px]
                              font-medium
                              text-[#B7791F]
                            "
                          >

                            <FiClock size={12} />

                            Processing

                          </span>

                        )}

                      </div>


                      {/* Actions */}

                      <div className="flex justify-end">

                        <button
                          onClick={() =>
                            handleChat(document)
                          }
                          disabled={!document.processed}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-lg
                            bg-[#7A1F2B]
                            px-2.5
                            py-1.5
                            text-[11px]
                            font-medium
                            text-white
                            transition
                            hover:bg-[#641923]
                            disabled:cursor-not-allowed
                            disabled:bg-[#E5E5E5]
                            disabled:text-[#A3A3A3]
                          "
                        >

                          <FiMessageSquare size={13} />

                          Chat

                        </button>

                      </div>

                    </div>


                    {/* ==================================================
                        MOBILE
                    ================================================== */}

                    <div className="md:hidden">

                      <div className="flex items-start gap-3">

                        {/* Document icon */}

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-[#F9EFF0]
                            text-[#7A1F2B]
                          "
                        >
                          <FiFileText size={18} />
                        </div>


                        <div className="min-w-0 flex-1">

                          <p className="break-words text-sm font-medium text-[#171717]">
                            {document.original_filename ||
                              document.saved_filename}
                          </p>


                          <div className="mt-2 flex flex-wrap items-center gap-2">

                            <span className="text-[11px] text-[#8A8A8A]">
                              {formatFileSize(
                                document.size
                              )}
                            </span>


                            {document.processed ? (

                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1
                                  rounded-full
                                  bg-[#EDF7F1]
                                  px-2
                                  py-1
                                  text-[10px]
                                  font-medium
                                  text-[#3F8F62]
                                "
                              >

                                <FiCheckCircle
                                  size={11}
                                />

                                Ready

                              </span>

                            ) : (

                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1
                                  rounded-full
                                  bg-[#FBF5E8]
                                  px-2
                                  py-1
                                  text-[10px]
                                  font-medium
                                  text-[#B7791F]
                                "
                              >

                                <FiClock size={11} />

                                Processing

                              </span>

                            )}

                          </div>

                        </div>

                      </div>


                      {/* Mobile Chat button */}

                      <div className="mt-4">

                        <button
                          onClick={() =>
                            handleChat(document)
                          }
                          disabled={!document.processed}
                          className="
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-1.5
                            rounded-lg
                            bg-[#7A1F2B]
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-white
                            transition
                            hover:bg-[#641923]
                            disabled:cursor-not-allowed
                            disabled:bg-[#E5E5E5]
                            disabled:text-[#A3A3A3]
                          "
                        >

                          <FiMessageSquare size={13} />

                          {document.processed
                            ? "Chat with Document"
                            : "Document Processing"}

                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          )}

      </main>

    </div>
  );
}