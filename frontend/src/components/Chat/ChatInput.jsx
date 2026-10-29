import { useRef, useState } from "react";
import {
  FaPaperclip,
  FaArrowUp,
} from "react-icons/fa";

function ChatInput({
  onSend,
  disabled = false,
}) {
  const [message, setMessage] = useState("");

  const textareaRef = useRef(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      100
    )}px`;
  };

  const handleChange = (event) => {
    setMessage(event.target.value);

    resizeTextarea();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) {
      return;
    }

    onSend?.(trimmedMessage);

    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSubmit(event);
    }
  };

  return (
    <div
      className="
        w-full
        shrink-0
        border-t
        border-[#E4E4E4]
        bg-white
        px-4
        py-2.5
        sm:px-5
      "
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-3xl"
      >
        <div
          className="
            flex
            items-end
            gap-2
            rounded-xl
            border
            border-[#D4D4D4]
            bg-white
            px-2.5
            py-1.5
            transition-colors
            focus-within:border-[#A3A3A3]
          "
        >

          {/* Attachment */}
          <button
            type="button"
            disabled={disabled}
            className="
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-[#5F5F5F]
              transition-colors
              hover:bg-[#F5F5F5]
              hover:text-[#171717]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Attach document"
          >
            <FaPaperclip className="text-[10px]" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled}
            placeholder={
              disabled
                ? "AI is generating a response..."
                : "Ask anything about your organization..."
            }
            className="
              max-h-24
              min-h-7
              flex-1
              resize-none
              overflow-y-auto
              bg-white
              py-1
              text-[11px]
              leading-5
              text-[#171717]
              outline-none
              placeholder:text-[#8A8A8A]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          />

          {/* Send */}
          <button
            type="submit"
            disabled={
              !message.trim() ||
              disabled
            }
            className="
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-[#D4D4D4]
              bg-white
              text-[#171717]
              transition-colors
              hover:bg-[#F5F5F5]
              active:scale-95
              disabled:cursor-not-allowed
              disabled:bg-[#F5F5F5]
              disabled:text-[#A3A3A3]
            "
            aria-label="Send message"
          >
            <FaArrowUp className="text-[9px]" />
          </button>

        </div>

        <p className="mt-1 text-center text-[8px] text-[#8A8A8A]">
          AI responses may contain inaccurate information. Verify important details.
        </p>
      </form>
    </div>
  );
}

export default ChatInput;