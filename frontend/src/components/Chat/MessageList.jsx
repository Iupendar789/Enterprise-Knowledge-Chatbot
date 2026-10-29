import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

function MessageList({
  messages = [],
  isTyping = false,
  onRegenerate,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isTyping]);

  const latestMessage =
    messages[messages.length - 1];

  return (
    <div className="min-h-full w-full">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center px-5">
          <p className="text-xs text-[#8A8A8A]">
            Your conversation will appear here.
          </p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-4xl py-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLatestAssistant={
                message.role === "assistant" &&
                message.id === latestMessage?.id
              }
              onRegenerate={onRegenerate}
              isTyping={isTyping}
            />
          ))}

          {isTyping && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

export default MessageList;