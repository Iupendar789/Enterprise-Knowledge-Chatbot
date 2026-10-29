import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaComments, FaSearch, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getEmployeeAuthHeaders() {
  const token =
    localStorage.getItem("employeeAccessToken") ||
    sessionStorage.getItem("employeeAccessToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function History() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const loadConversations = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/conversations`,
        {
          method: "GET",
          headers: getEmployeeAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          `Could not load conversation history (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Loading conversation history failed:",
        error
      );

      toast.error(
        error.message || "Could not load conversation history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleOpenConversation = (conversationId) => {
    if (!conversationId) {
      return;
    }

    navigate(
      `/chat?conversation=${encodeURIComponent(
        conversationId
      )}`
    );
  };

  const handleDeleteConversation = async (
    conversationId,
    title
  ) => {
    if (!conversationId || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(conversationId);

    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${encodeURIComponent(
          conversationId
        )}`,
        {
          method: "DELETE",
          headers: getEmployeeAuthHeaders(),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          data.detail ||
            `Could not delete conversation (HTTP ${response.status}).`
        );
      }

      setConversations((previous) =>
        previous.filter(
          (conversation) =>
            conversation.conversation_id !== conversationId
        )
      );

      toast.success("Conversation deleted.");
    } catch (error) {
      console.error(
        "Deleting conversation failed:",
        error
      );

      toast.error(
        error.message || "Could not delete conversation."
      );
    } finally {
      setDeletingId("");
    }
  };

  const filteredConversations = conversations.filter(
    (conversation) => {
      const title =
        conversation.title || "New conversation";

      const filename =
        conversation.filename || "";

      const searchText = search.toLowerCase();

      return (
        title.toLowerCase().includes(searchText) ||
        filename.toLowerCase().includes(searchText)
      );
    }
  );

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    const date = new Date(timestamp * 1000);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F8F8] text-[#171717]">
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">

            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-[#E4E4E4]
                bg-white
                text-[#5F5F5F]
                shadow-sm
                transition
                hover:border-[#D4D4D4]
                hover:bg-[#FAF5F6]
                hover:text-[#52141C]
              "
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <FaArrowLeft className="text-xs" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-[#171717] sm:text-xl">
                Conversation History
              </h1>

              <p className="mt-1 text-xs text-[#8A8A8A] sm:text-sm">
                View and continue your previous conversations.
              </p>
            </div>
          </div>

          {/* New Chat */}
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="
              flex
              shrink-0
              items-center
              gap-2
              rounded-lg
              bg-[#7A1F2B]
              px-3
              py-2
              text-xs
              font-medium
              text-white
              shadow-sm
              transition
              hover:bg-[#641923]
              sm:px-4
              sm:text-sm
            "
          >
            <FaComments className="text-xs" />
            <span>New Chat</span>
          </button>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-xs
                text-[#8A8A8A]
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search conversations..."
              className="
                w-full
                rounded-xl
                border
                border-[#E4E4E4]
                bg-white
                py-3
                pl-9
                pr-4
                text-sm
                text-[#171717]
                shadow-sm
                outline-none
                placeholder:text-[#A3A3A3]
                transition
                focus:border-[#7A1F2B]
                focus:ring-2
                focus:ring-[#7A1F2B]/10
              "
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

          {/* Total Conversations */}
          <div
            className="
              rounded-xl
              border
              border-[#E4E4E4]
              bg-white
              p-4
              shadow-sm
            "
          >
            <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
              Total Conversations
            </p>

            <p className="mt-2 text-xl font-semibold text-[#171717]">
              {conversations.length}
            </p>
          </div>

          {/* Showing */}
          <div
            className="
              rounded-xl
              border
              border-[#E4E4E4]
              bg-white
              p-4
              shadow-sm
            "
          >
            <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
              Showing
            </p>

            <p className="mt-2 text-xl font-semibold text-[#171717]">
              {filteredConversations.length}
            </p>
          </div>

          {/* Status */}
          <div
            className="
              rounded-xl
              border
              border-[#E4E4E4]
              bg-white
              p-4
              shadow-sm
            "
          >
            <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
              Status
            </p>

            <p className="mt-2 text-sm font-medium text-[#3F8F62]">
              Saved conversations
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">

              <div
                className="
                  mx-auto
                  h-7
                  w-7
                  animate-spin
                  rounded-full
                  border-2
                  border-[#E4E4E4]
                  border-t-[#7A1F2B]
                "
              />

              <p className="mt-3 text-xs text-[#8A8A8A]">
                Loading conversation history...
              </p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-[#E4E4E4]
              bg-white
              px-6
              text-center
              shadow-sm
            "
          >
            {/* Empty State Icon */}
            <div
              className="
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
              <FaComments className="text-lg" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-[#171717]">
              {conversations.length === 0
                ? "No conversations yet"
                : "No matching conversations"}
            </h2>

            <p className="mt-2 max-w-md text-xs leading-5 text-[#8A8A8A]">
              {conversations.length === 0
                ? "Start a conversation with the Enterprise Knowledge Assistant and your saved chats will appear here."
                : "Try searching with a different conversation title or document name."}
            </p>

            {conversations.length === 0 && (
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="
                  mt-5
                  rounded-lg
                  bg-[#7A1F2B]
                  px-4
                  py-2
                  text-xs
                  font-medium
                  text-white
                  shadow-sm
                  transition
                  hover:bg-[#641923]
                "
              >
                Start New Chat
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">

            {filteredConversations.map(
              (conversation) => {
                const conversationId =
                  conversation.conversation_id;

                const title =
                  conversation.title ||
                  "New conversation";

                const filename =
                  conversation.filename || "";

                const isDeleting =
                  deletingId === conversationId;

                return (
                  <div
                    key={conversationId}
                    className="
                      group
                      rounded-xl
                      border
                      border-[#E4E4E4]
                      bg-white
                      p-4
                      shadow-sm
                      transition
                      hover:border-[#D4D4D4]
                      hover:bg-[#FAF5F6]
                    "
                  >
                    <div className="flex items-start gap-3">

                      {/* Icon */}
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
                        <FaComments className="text-sm" />
                      </div>

                      {/* Conversation Details */}
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenConversation(
                            conversationId
                          )
                        }
                        disabled={isDeleting}
                        className="
                          min-w-0
                          flex-1
                          text-left
                          disabled:cursor-not-allowed
                        "
                      >
                        <h2
                          className="
                            truncate
                            text-sm
                            font-medium
                            text-[#171717]
                            transition
                            group-hover:text-[#7A1F2B]
                          "
                          title={title}
                        >
                          {title}
                        </h2>

                        {filename && (
                          <p
                            className="
                              mt-1
                              truncate
                              text-[11px]
                              text-[#8A8A8A]
                            "
                            title={filename}
                          >
                            Document: {filename}
                          </p>
                        )}

                        <p className="mt-2 text-[10px] text-[#A3A3A3]">
                          {formatDate(
                            conversation.updated_at
                          )}
                        </p>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteConversation(
                            conversationId,
                            title
                          )
                        }
                        disabled={
                          isDeleting ||
                          Boolean(deletingId)
                        }
                        className="
                          shrink-0
                          rounded-lg
                          p-2
                          text-[#A3A3A3]
                          transition
                          hover:bg-[#FBEDEF]
                          hover:text-[#B84A56]
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                        aria-label={`Delete ${title}`}
                        title="Delete conversation"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;