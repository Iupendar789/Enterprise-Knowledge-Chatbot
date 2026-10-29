
import { useEffect, useState } from "react";
import {
  FaComments,
  FaArrowRight,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

function getAuthToken() {
  return (
    getStoredValue("employeeAccessToken") ||
    getStoredValue("access_token") ||
    getStoredValue("token")
  );
}

function formatChatTime(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const now = new Date();

  const differenceInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const differenceInMinutes = Math.floor(
    differenceInSeconds / 60
  );

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} min ago`;
  }

  const differenceInHours = Math.floor(
    differenceInMinutes / 60
  );

  if (differenceInHours < 24) {
    return `${differenceInHours} hour${
      differenceInHours > 1 ? "s" : ""
    } ago`;
  }

  const differenceInDays = Math.floor(
    differenceInHours / 24
  );

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  if (differenceInDays < 7) {
    return `${differenceInDays} days ago`;
  }

  return date.toLocaleDateString();
}

function getConversationTitle(conversation) {
  return (
    conversation.title ||
    conversation.name ||
    conversation.question ||
    conversation.first_message ||
    conversation.firstMessage ||
    "New conversation"
  );
}

function getConversationPreview(conversation) {
  return (
    conversation.preview ||
    conversation.last_message ||
    conversation.lastMessage ||
    conversation.message ||
    conversation.summary ||
    "Continue this conversation..."
  );
}

function getConversationId(conversation) {
  return (
    conversation.id ||
    conversation._id ||
    conversation.conversation_id ||
    conversation.conversationId
  );
}

function RecentChats() {
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      setLoading(true);

      const token = getAuthToken();

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/conversations`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch conversations: ${response.status}`
        );
      }

      const data = await response.json();

      let conversationList = [];

      if (Array.isArray(data)) {
        conversationList = data;
      } else if (Array.isArray(data.conversations)) {
        conversationList = data.conversations;
      } else if (Array.isArray(data.data)) {
        conversationList = data.data;
      }

      conversationList.sort((a, b) => {
        const dateA = new Date(
          a.updated_at ||
            a.updatedAt ||
            a.created_at ||
            a.createdAt ||
            0
        );

        const dateB = new Date(
          b.updated_at ||
            b.updatedAt ||
            b.created_at ||
            b.createdAt ||
            0
        );

        return dateB - dateA;
      });

      const recentChats = conversationList
        .slice(0, 4)
        .map((conversation) => ({
          id: getConversationId(conversation),

          title: getConversationTitle(conversation),

          preview: getConversationPreview(conversation),

          time: formatChatTime(
            conversation.updated_at ||
              conversation.updatedAt ||
              conversation.created_at ||
              conversation.createdAt
          ),
        }));

      setChats(recentChats);
    } catch (error) {
      console.error(
        "Failed to load recent chats:",
        error
      );

      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  // Open a particular conversation.
  const handleChatClick = (chat) => {
    if (chat.id) {
      navigate(
        `/chat?conversation=${encodeURIComponent(chat.id)}`
      );
    } else {
      navigate("/chat");
    }
  };

  // Open complete chat history.
  const handleViewHistory = () => {
    navigate("/history");
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">

        <div>
          <h2 className="text-sm font-semibold text-[#334155]">
            Recent Chats
          </h2>

          <p className="mt-1 text-[10px] text-[#94A3B8]">
            Your latest conversations
          </p>
        </div>

        <button
          type="button"
          onClick={handleViewHistory}
          className="
            flex shrink-0 items-center gap-1.5
            text-[10px] font-medium
            text-[#6F9BCB]
            transition-colors
            hover:text-[#4F83BB]
          "
        >
          View history

          <FaArrowRight className="text-[8px]" />
        </button>

      </div>

      {/* Loading State */}
      {loading && (
        <div className="divide-y divide-[#EEF1F5]">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="
                flex items-center gap-3
                py-3
                first:pt-0
                last:pb-0
              "
            >
              <div
                className="
                  h-10 w-10 shrink-0
                  animate-pulse rounded-lg
                  bg-[#F1F5F9]
                "
              />

              <div className="min-w-0 flex-1">
                <div
                  className="
                    h-3 w-44
                    animate-pulse rounded
                    bg-[#F1F5F9]
                  "
                />

                <div
                  className="
                    mt-2 h-2 w-32
                    animate-pulse rounded
                    bg-[#F1F5F9]
                  "
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && chats.length === 0 && (
        <div
          className="
            flex min-h-[150px]
            flex-col items-center
            justify-center text-center
          "
        >
          <div
            className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl
              border border-[#E5EAF0]
              bg-[#F8FAFC]
              text-[#94A3B8]
            "
          >
            <FaComments className="text-sm" />
          </div>

          <p className="mt-3 text-xs font-medium text-[#64748B]">
            No conversations yet
          </p>

          <p className="mt-1 text-[10px] text-[#94A3B8]">
            Start a conversation to see it here.
          </p>

          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="
              mt-3 text-[10px]
              font-medium text-[#6F9BCB]
              transition-colors
              hover:text-[#4F83BB]
            "
          >
            Start conversation
          </button>
        </div>
      )}

      {/* Chat List */}
      {!loading && chats.length > 0 && (
        <div className="divide-y divide-[#EEF1F5]">

          {chats.map((chat) => (
            <button
              type="button"
              key={chat.id || chat.title}
              onClick={() => handleChatClick(chat)}
              className="
                group flex w-full
                items-center gap-3
                py-3 text-left
                transition-colors
                first:pt-0
                last:pb-0
                hover:bg-[#F8FAFC]
              "
            >

              {/* Chat Icon */}
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-lg
                  border border-[#E5EAF0]
                  bg-[#F8FAFC]
                  text-[#94A3B8]
                  transition-colors
                  group-hover:border-[#D5DFEA]
                  group-hover:bg-[#EAF2FB]
                  group-hover:text-[#7BA7D9]
                "
              >
                <FaComments className="text-xs" />
              </div>

              {/* Chat Details */}
              <div className="min-w-0 flex-1">

                <p
                  className="
                    truncate text-xs
                    font-medium text-[#475569]
                    transition-colors
                    group-hover:text-[#334155]
                  "
                >
                  {chat.title}
                </p>

                <p
                  className="
                    mt-1 truncate
                    text-[10px] text-[#94A3B8]
                  "
                >
                  {chat.preview}
                </p>

              </div>

              {/* Time + Arrow */}
              <div className="flex shrink-0 items-center gap-2">

                <span
                  className="
                    hidden text-[9px]
                    text-[#A0AAB8]
                    sm:block
                  "
                >
                  {chat.time}
                </span>

                <FaChevronRight
                  className="
                    text-[8px]
                    text-[#CBD5E1]
                    transition-all
                    group-hover:translate-x-0.5
                    group-hover:text-[#7BA7D9]
                  "
                />

              </div>

            </button>
          ))}

        </div>
      )}

    </section>
  );
}

export default RecentChats;