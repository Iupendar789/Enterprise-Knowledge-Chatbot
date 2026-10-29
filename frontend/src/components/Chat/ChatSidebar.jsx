import { useState } from "react";

export default function ChatSidebar({
  conversations = [],
  onSelectChat,
  onNewChat,
  onDeleteChat,
  activeConversationId,
  mobileOpen = false,
  onClose,
  deletingConversationId = "",
}) {
  const [search, setSearch] = useState("");

  const filteredConversations = conversations.filter((conversation) =>
    (conversation.title || "New conversation")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <aside
      className={[
        "z-50 flex h-screen w-72 shrink-0 flex-col",
        "border-r border-[#D6DCE3] bg-[#EAF2FB] text-[#52141C]",
        "md:sticky md:top-0 md:flex",
        mobileOpen
          ? "fixed inset-y-0 left-0"
          : "hidden md:relative md:flex",
      ].join(" ")}
    >
      {/* Sidebar Header */}
      <div
        className="
          flex shrink-0 items-center justify-between gap-3
          border-b border-[#D5E3F1]
          px-4 py-4
        "
      >
        <div>
          <h2 className="text-sm font-semibold text-[#52141C]">
            Conversations
          </h2>

          <p className="mt-1 text-[11px] text-[#7A1F2B]/70">
            Your chat history
          </p>
        </div>

        {/* Mobile Close */}
        <button
          type="button"
          onClick={onClose}
          className="
            rounded-lg
            px-2 py-1
            text-sm
            text-[#7A1F2B]
            transition-colors
            hover:bg-[#F7E9EB]
            hover:text-[#52141C]
            md:hidden
          "
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* New Chat Button */}
      <div className="shrink-0 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="
            w-full
            rounded-lg
            bg-white
            px-4 py-3
            text-sm
            font-semibold
            text-[#52141C]
            border border-[#D5E3F1]
            shadow-sm
            transition-all
            duration-200
            hover:border-[#7A1F2B]
            hover:bg-[#F7E9EB]
            focus:outline-none
            focus:ring-2
            focus:ring-[#7A1F2B]/20
          "
        >
          + New chat
        </button>
      </div>

      {/* Search Conversations */}
      <div className="shrink-0 px-3 pb-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search conversations..."
          aria-label="Search conversations"
          className="
            w-full
            rounded-lg
            border border-[#D5E3F1]
            bg-white
            px-3 py-2.5
            text-xs
            text-[#52141C]
            outline-none
            placeholder:text-[#8A8A8A]
            transition-all
            duration-200
            focus:border-[#7A1F2B]
            focus:ring-2
            focus:ring-[#7A1F2B]/15
          "
        />
      </div>

      {/* Conversation List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {filteredConversations.length === 0 ? (
          <p className="px-3 py-4 text-xs leading-5 text-[#7A1F2B]/70">
            {conversations.length === 0
              ? "Your saved conversations will appear here."
              : "No matching conversations."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filteredConversations.map((conversation) => {
              const conversationId =
                conversation.conversation_id;

              const title =
                conversation.title || "New conversation";

              const isActive =
                conversationId === activeConversationId;

              const isDeleting =
                deletingConversationId === conversationId;

              return (
                <div
                  key={conversationId}
                  className={[
                    `
                      group
                      flex
                      min-w-0
                      items-center
                      gap-2
                      rounded-lg
                      border
                      px-2
                      py-2
                      transition-all
                      duration-200
                    `,
                    isActive
                      ? `
                        border-[#D8AEB4]
                        bg-[#F7E9EB]
                        shadow-sm
                      `
                      : `
                        border-transparent
                        hover:border-[#D5E3F1]
                        hover:bg-white/70
                      `,
                  ].join(" ")}
                >
                  {/* Conversation Title */}
                  <button
                    type="button"
                    onClick={() =>
                      onSelectChat?.(conversationId)
                    }
                    className={[
                      `
                        min-w-0
                        flex-1
                        truncate
                        px-1
                        py-1
                        text-left
                        text-xs
                        transition-colors
                      `,
                      isActive
                        ? "font-semibold text-[#52141C]"
                        : "font-medium text-[#7A1F2B]",
                    ].join(" ")}
                    title={title}
                    disabled={isDeleting}
                  >
                    {title}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() =>
                      onDeleteChat?.(
                        conversationId,
                        title
                      )
                    }
                    disabled={
                      isDeleting ||
                      Boolean(deletingConversationId)
                    }
                    className="
                      shrink-0
                      rounded-md
                      px-2 py-1
                      text-[10px]
                      font-medium
                      text-[#8A8A8A]
                      transition-colors
                      hover:bg-[#FBEDEF]
                      hover:text-[#B84A56]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                    aria-label={`Delete ${title}`}
                    title="Delete conversation"
                  >
                    {isDeleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div
        className="
          shrink-0
          border-t border-[#D5E3F1]
          px-4 py-3
        "
      >
        <p className="text-[10px] text-[#7A1F2B]/65">
          Your saved conversations
        </p>
      </div>
    </aside>
  );
}