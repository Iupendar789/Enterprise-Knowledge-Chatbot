import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  FaUser,
  FaBrain,
  FaCopy,
  FaFileAlt,
  FaRedoAlt,
  FaCheck,
} from "react-icons/fa";

import SourceReferences from "./SourceReferences";

function MessageBubble({
  message = {},
  isLatestAssistant = false,
  onRegenerate,
  isTyping = false,
}) {
  const [copied, setCopied] = useState(false);

  const isUser = message?.role === "user";

  const citations = Array.isArray(message?.citations)
    ? message.citations
    : [];

  const hasCitations = citations.length > 0;

  const hasContent =
    typeof message?.content === "string" &&
    message.content.trim().length > 0;

  // =========================================================
  // Copy
  // =========================================================

  const handleCopy = async () => {
    if (!message?.content) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = message.content;

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);
      }

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  // =========================================================
  // Regenerate
  // =========================================================

  const handleRegenerate = () => {
    if (
      !isLatestAssistant ||
      isTyping ||
      !hasContent ||
      !onRegenerate ||
      !message?.id
    ) {
      return;
    }

    onRegenerate(message.id);
  };

  // =========================================================
  // Markdown
  // =========================================================

  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-5 text-lg font-bold text-[#171717] first:mt-0">
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2 className="mb-2 mt-5 text-base font-semibold text-[#171717] first:mt-0">
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-sm font-semibold text-[#171717]">
        {children}
      </h3>
    ),

    p: ({ children }) => (
      <p className="mb-3 text-sm leading-7 text-[#171717] last:mb-0">
        {children}
      </p>
    ),

    strong: ({ children }) => (
      <strong className="font-semibold text-[#171717]">
        {children}
      </strong>
    ),

    em: ({ children }) => (
      <em className="italic text-[#333333]">
        {children}
      </em>
    ),

    ul: ({ children }) => (
      <ul className="mb-3 ml-5 list-disc space-y-1 text-sm leading-7 text-[#171717]">
        {children}
      </ul>
    ),

    ol: ({ children }) => (
      <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm leading-7 text-[#171717]">
        {children}
      </ol>
    ),

    li: ({ children }) => (
      <li className="pl-1 text-[#171717]">
        {children}
      </li>
    ),

    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-2 border-[#D4D4D4] pl-4 text-[#444444]">
        {children}
      </blockquote>
    ),

    code: ({ children, className }) => {
      const isBlock = Boolean(className);

      if (isBlock) {
        return (
          <code className="block overflow-x-auto text-xs leading-6 text-[#171717]">
            {children}
          </code>
        );
      }

      return (
        <code className="font-mono text-xs text-[#171717]">
          {children}
        </code>
      );
    },

    pre: ({ children }) => (
      <pre className="my-3 overflow-x-auto border-l-2 border-[#D4D4D4] pl-4 text-[#171717]">
        {children}
      </pre>
    ),

    table: ({ children }) => (
      <div className="my-4 w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          {children}
        </table>
      </div>
    ),

    thead: ({ children }) => (
      <thead className="border-b border-[#D4D4D4]">
        {children}
      </thead>
    ),

    th: ({ children }) => (
      <th className="px-3 py-2 font-semibold text-[#171717]">
        {children}
      </th>
    ),

    td: ({ children }) => (
      <td className="border-b border-[#EEEEEE] px-3 py-2 text-[#333333]">
        {children}
      </td>
    ),

    a: ({ href, children }) => {
      const safeHref =
        typeof href === "string" &&
        /^(https?:\/\/|mailto:)/i.test(href);

      if (!safeHref) {
        return (
          <span className="text-[#171717]">
            {children}
          </span>
        );
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#171717] underline underline-offset-4"
        >
          {children}
        </a>
      );
    },

    hr: () => (
      <hr className="my-4 border-[#E4E4E4]" />
    ),
  };

  // =========================================================
  // USER MESSAGE
  // =========================================================

  if (isUser) {
    return (
      <div className="w-full py-3">
        <div className="mx-auto flex w-full max-w-4xl justify-end px-5">

          <div className="max-w-[75%] sm:max-w-[65%]">

            {/* User label */}
            <div className="mb-1 flex items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-[#5F5F5F]">
                You
              </span>

              <FaUser className="text-[9px] text-[#5F5F5F]" />
            </div>

            {/* User question */}
            <div className="text-right">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#171717]">
                {message?.content || ""}
              </p>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // AI MESSAGE
  // =========================================================

  return (
    <div className="w-full py-4">
      <div className="mx-auto flex w-full max-w-4xl justify-start px-5">

        <div className="w-full max-w-[85%] sm:max-w-[75%]">

          {/* AI label */}
          <div className="mb-1.5 flex items-center gap-2">

            <FaBrain className="text-[10px] text-[#171717]" />

            <span className="text-[10px] font-semibold text-[#171717]">
              NovaTech AI
            </span>

          </div>

          {/* AI answer */}
          <div className="min-w-0 break-words">

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message?.content || ""}
            </ReactMarkdown>

          </div>

          {/* =================================================
              Sources
          ================================================= */}

          {!isUser && hasCitations && (
            <div className="mt-4">

              <p className="mb-2 text-[10px] font-semibold text-[#5F5F5F]">
                Sources
              </p>

              <div className="space-y-2">

                {citations.map((citation, index) => {
                  const documentName =
                    citation?.document ||
                    "Company document";

                  const pageNumber =
                    citation?.page;

                  return (
                    <div
                      key={`${documentName}-${pageNumber}-${index}`}
                      className="flex items-center gap-2 text-xs text-[#333333]"
                    >
                      <FaFileAlt className="shrink-0 text-[10px] text-[#5F5F5F]" />

                      <span className="break-words">
                        {documentName}

                        {pageNumber != null && (
                          <span className="ml-2 text-[10px] text-[#8A8A8A]">
                            Page {pageNumber}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}

              </div>

            </div>
          )}

          {/* Older sources */}
          {!hasCitations &&
            message?.sources && (
              <div className="mt-4">
                <SourceReferences
                  sources={message.sources}
                />
              </div>
            )}

          {/* =================================================
              AI Actions
          ================================================= */}

          {hasContent && (
            <div className="mt-3 flex items-center gap-3">

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={isTyping}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  text-[10px]
                  text-[#5F5F5F]
                  transition-colors
                  hover:text-[#171717]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {copied ? (
                  <>
                    <FaCheck className="text-[9px]" />
                    Copied
                  </>
                ) : (
                  <>
                    <FaCopy className="text-[9px]" />
                    Copy
                  </>
                )}
              </button>

              {/* Regenerate */}
              {isLatestAssistant &&
                !isTyping &&
                onRegenerate && (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      text-[10px]
                      text-[#5F5F5F]
                      transition-colors
                      hover:text-[#171717]
                    "
                  >
                    <FaRedoAlt className="text-[9px]" />
                    Regenerate
                  </button>
                )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default MessageBubble;