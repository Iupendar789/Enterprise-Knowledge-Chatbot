import {
  FaBars,
  FaPlus,
  FaEllipsisV,
  FaBrain,
} from "react-icons/fa";

function ChatHeader({ onMenuClick, onNewChat }) {
  return (
    <header
      className="
        flex h-14 shrink-0 items-center justify-between
        border-b border-[#E4E4E4]
        bg-white
        px-4
        sm:px-5
      "
    >
      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-2.5">

        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="
            flex h-8 w-8 shrink-0 items-center justify-center
            rounded-lg
            text-[#8A8A8A]
            transition-colors
            hover:bg-[#F7E9EB]
            hover:text-[#7A1F2B]
            lg:hidden
          "
          aria-label="Open sidebar"
        >
          <FaBars className="text-xs" />
        </button>

        {/* AI Icon */}
        <div
          className="
            hidden h-8 w-8 shrink-0 items-center justify-center
            rounded-lg
            border border-[#E8C9CD]
            bg-[#F7E9EB]
            text-[#7A1F2B]
            sm:flex
          "
        >
          <FaBrain className="text-xs" />
        </div>

        {/* Title */}
        <div className="min-w-0">
          <h1 className="truncate text-xs font-semibold text-[#171717] sm:text-sm">
            Enterprise Knowledge Assistant
          </h1>

          <p className="mt-0.5 truncate text-[9px] text-[#8A8A8A] sm:text-[10px]">
            Ask questions about your organization's knowledge
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-1.5">

        {/* New Chat */}
        <button
          type="button"
          onClick={onNewChat}
          className="
            hidden h-8 items-center gap-2
            rounded-lg
            border border-[#E4E4E4]
            bg-white
            px-3
            text-[10px]
            font-medium
            text-[#5F5F5F]
            transition-all
            duration-200
            hover:border-[#E8C9CD]
            hover:bg-[#F9EFF0]
            hover:text-[#7A1F2B]
            sm:flex
          "
        >
          <FaPlus className="text-[8px] text-[#7A1F2B]" />
          New Chat
        </button>

        {/* Mobile New Chat */}
        <button
          type="button"
          onClick={onNewChat}
          className="
            flex h-8 w-8 items-center justify-center
            rounded-lg
            border border-[#E4E4E4]
            bg-white
            text-[#8A8A8A]
            transition-all
            duration-200
            hover:border-[#E8C9CD]
            hover:bg-[#F9EFF0]
            hover:text-[#7A1F2B]
            sm:hidden
          "
          aria-label="New chat"
        >
          <FaPlus className="text-[10px]" />
        </button>

        {/* More Options */}
        <button
          type="button"
          className="
            flex h-8 w-8 items-center justify-center
            rounded-lg
            text-[#8A8A8A]
            transition-colors
            hover:bg-[#F7E9EB]
            hover:text-[#7A1F2B]
          "
          aria-label="More options"
        >
          <FaEllipsisV className="text-[10px]" />
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;