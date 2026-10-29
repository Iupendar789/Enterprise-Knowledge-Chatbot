import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import ChatSidebar from "../components/Chat/ChatSidebar";
import ChatHeader from "../components/Chat/ChatHeader";
import WelcomeChat from "../components/Chat/WelcomeChat";
import SuggestedQuestions from "../components/Chat/SuggestedQuestions";
import MessageList from "../components/Chat/MessageList";
import ChatInput from "../components/Chat/ChatInput";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function Chat() {
  const [searchParams] = useSearchParams();

  const selectedDocument =
    searchParams.get("document");

  const selectedDocumentName =
    searchParams.get("name") ||
    selectedDocument;

  const selectedConversationId =
    searchParams.get("conversation");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [messages, setMessages] =
    useState([]);

  const [hasStartedChat, setHasStartedChat] =
    useState(false);

  const [isTyping, setIsTyping] =
    useState(false);

  const [conversationId, setConversationId] =
    useState(selectedConversationId || "");

  const [conversations, setConversations] =
    useState([]);

  const [
    isLoadingConversations,
    setIsLoadingConversations,
  ] = useState(false);

  const [
    isLoadingConversation,
    setIsLoadingConversation,
  ] = useState(false);

  const [
    deletingConversationId,
    setDeletingConversationId,
  ] = useState("");

  const [
    statusMessage,
    setStatusMessage,
  ] = useState("");

  const abortControllerRef = useRef(null);

  // ---------------------------------------------------------
  // Authentication headers
  // ---------------------------------------------------------

  const getEmployeeAuthHeaders = (
    includeJson = false
  ) => {
    const token =
      localStorage.getItem("employeeAccessToken") ||
      sessionStorage.getItem("employeeAccessToken") ||
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    const headers = {};

    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  // ---------------------------------------------------------
  // Sidebar
  // ---------------------------------------------------------

  const handleOpenSidebar = () => {
    setMobileOpen(true);
  };

  const handleCloseSidebar = () => {
    setMobileOpen(false);
  };

  // ---------------------------------------------------------
  // Load conversation list
  // ---------------------------------------------------------

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);

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
          `Could not load conversations (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      setConversations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Loading conversations failed:",
        error
      );

      setStatusMessage(
        error.message ||
          "Could not load conversation history."
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ---------------------------------------------------------
  // New chat
  // ---------------------------------------------------------

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setMessages([]);
    setHasStartedChat(false);
    setConversationId("");
    setMobileOpen(false);
    setStatusMessage("");
    setIsTyping(false);
  };

  // ---------------------------------------------------------
  // Open existing conversation
  // ---------------------------------------------------------

  const handleSelectChat = useCallback(
    async (selectedId) => {
      if (
        !selectedId ||
        isLoadingConversation ||
        isTyping
      ) {
        return;
      }

      setIsLoadingConversation(true);
      setStatusMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/conversations/${encodeURIComponent(
            selectedId
          )}`,
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

          if (response.status === 404) {
            throw new Error(
              "This saved conversation could not be found."
            );
          }

          throw new Error(
            `Could not open conversation (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        const restoredMessages =
          Array.isArray(data.messages)
            ? data.messages.map((message, index) => ({
                id:
                  message.id ??
                  `${selectedId}-${index}`,

                role: message.role,

                content: message.content || "",

                sources: Array.isArray(message.sources)
                  ? message.sources
                  : [],

                citations: Array.isArray(message.citations)
                  ? message.citations
                  : [],

                status: message.status || "",
              }))
            : [];

        setConversationId(
          data.conversation_id || selectedId
        );

        setMessages(restoredMessages);

        setHasStartedChat(
          restoredMessages.length > 0
        );

        setMobileOpen(false);
      } catch (error) {
        console.error(
          "Opening conversation failed:",
          error
        );

        setStatusMessage(
          error.message ||
            "Could not open this conversation."
        );
      } finally {
        setIsLoadingConversation(false);
      }
    },
    [
      isLoadingConversation,
      isTyping,
    ]
  );

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    handleSelectChat(selectedConversationId);
  }, [
    selectedConversationId,
    handleSelectChat,
  ]);

  // ---------------------------------------------------------
  // Delete conversation
  // ---------------------------------------------------------

  const handleDeleteChat = async (
    id,
    title = "New conversation"
  ) => {
    if (!id || deletingConversationId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingConversationId(id);
    setStatusMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${encodeURIComponent(
          id
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
            conversation.conversation_id !== id
        )
      );

      if (conversationId === id) {
        setMessages([]);
        setConversationId("");
        setHasStartedChat(false);
        setStatusMessage("");
      }
    } catch (error) {
      console.error(
        "Deleting conversation failed:",
        error
      );

      setStatusMessage(
        error.message ||
          "Could not delete this conversation."
      );
    } finally {
      setDeletingConversationId("");
    }
  };

  // ---------------------------------------------------------
  // Update assistant message
  // ---------------------------------------------------------

  const updateAssistantMessage = (
    assistantMessageId,
    updates
  ) => {
    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        message.id === assistantMessageId
          ? {
              ...message,
              ...updates,
            }
          : message
      )
    );
  };

  // ---------------------------------------------------------
  // Common stream handler
  // ---------------------------------------------------------

  const streamChat = async ({
    question,
    assistantMessageId,
    regenerate = false,
    originalAssistantMessage = null,
  }) => {
    const trimmedQuestion =
      typeof question === "string"
        ? question.trim()
        : "";

    if (!trimmedQuestion) {
      return;
    }

    if (isLoadingConversation || isTyping) {
      return;
    }

    setIsTyping(true);
    setStatusMessage("");

    let receivedText = "";
    let streamFinished = false;

    const controller = new AbortController();

    abortControllerRef.current = controller;

    try {
      const endpoint = selectedDocument
        ? `${API_URL}/api/chat/stream`
        : `${API_URL}/api/chat/shared/stream`;

      const requestBody = selectedDocument
        ? {
            question: trimmedQuestion,

            filename: selectedDocument,

            ...(conversationId
              ? {
                  conversation_id: conversationId,
                }
              : {}),

            regenerate,
          }
        : {
            question: trimmedQuestion,

            ...(conversationId
              ? {
                  conversation_id: conversationId,
                }
              : {}),

            regenerate,
          };

      const response = await fetch(endpoint, {
        method: "POST",

        headers: getEmployeeAuthHeaders(true),

        body: JSON.stringify(requestBody),

        signal: controller.signal,
      });

      if (!response.ok) {
        let errorData = {};

        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }

        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (response.status === 404) {
          throw new Error(
            selectedDocument
              ? "The document streaming endpoint could not be found."
              : "The shared chat streaming endpoint could not be found."
          );
        }

        if (response.status === 409) {
          throw new Error(
            errorData.detail ||
              "This response cannot be regenerated."
          );
        }

        if (response.status === 422) {
          throw new Error(
            errorData.detail ||
              "The selected knowledge source is not ready for chat."
          );
        }

        throw new Error(
          errorData.detail ||
            `The request failed (HTTP ${response.status}).`
        );
      }

      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this response."
        );
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      const processEvent = (eventBlock) => {
        const dataLines = eventBlock
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart());

        if (dataLines.length === 0) {
          return;
        }

        const eventData = dataLines.join("\n");

        let event;

        try {
          event = JSON.parse(eventData);
        } catch (error) {
          console.error(
            "Could not parse streaming event:",
            eventData,
            error
          );
          return;
        }

        if (event.type === "start") {
          if (event.conversation_id) {
            setConversationId(
              event.conversation_id
            );
          }

          updateAssistantMessage(
            assistantMessageId,
            {
              sources: Array.isArray(event.sources)
                ? event.sources
                : [],

              citations: Array.isArray(event.citations)
                ? event.citations
                : [],

              status: "generating",
            }
          );
        }

        if (event.type === "token") {
          const chunk =
            typeof event.text === "string"
              ? event.text
              : "";

          if (!chunk) {
            return;
          }

          receivedText += chunk;

          updateAssistantMessage(
            assistantMessageId,
            {
              content: receivedText,
              status: "generating",
            }
          );
        }

        if (event.type === "done") {
          streamFinished = true;

          const finalAnswer =
            typeof event.answer === "string"
              ? event.answer
              : receivedText;

          if (event.conversation_id) {
            setConversationId(
              event.conversation_id
            );
          }

          updateAssistantMessage(
            assistantMessageId,
            {
              content: finalAnswer,

              sources: Array.isArray(event.sources)
                ? event.sources
                : [],

              citations: Array.isArray(event.citations)
                ? event.citations
                : [],

              status: "complete",
            }
          );
        }

        if (event.type === "error") {
          throw new Error(
            event.message ||
              event.error ||
              "An error occurred while generating the response."
          );
        }
      };

      while (true) {
        const {
          done,
          value,
        } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const eventBlocks = buffer.split(
          /\r?\n\r?\n/
        );

        buffer = eventBlocks.pop() || "";

        for (const eventBlock of eventBlocks) {
          processEvent(eventBlock);
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        processEvent(buffer);
      }

      if (!streamFinished) {
        if (
          regenerate &&
          !receivedText &&
          originalAssistantMessage
        ) {
          updateAssistantMessage(
            assistantMessageId,
            originalAssistantMessage
          );
        }

        throw new Error(
          "The response stream ended before the answer was completed."
        );
      }

      await loadConversations();
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatusMessage("Generation stopped.");

        if (
          regenerate &&
          !receivedText &&
          originalAssistantMessage
        ) {
          updateAssistantMessage(
            assistantMessageId,
            originalAssistantMessage
          );
        }

        return;
      }

      console.error(
        "Streaming chat request failed:",
        error
      );

      if (
        regenerate &&
        !receivedText &&
        originalAssistantMessage
      ) {
        updateAssistantMessage(
          assistantMessageId,
          originalAssistantMessage
        );
      } else if (!regenerate) {
        updateAssistantMessage(
          assistantMessageId,
          {
            content:
              receivedText ||
              error.message ||
              "Something went wrong. Please try again.",

            status: "error",
          }
        );
      }

      setStatusMessage(
        error instanceof TypeError
          ? "Cannot reach the backend. Check that FastAPI is running and the API URL is correct."
          : error.message ||
              "Something went wrong. Please try again."
      );
    } finally {
      if (
        abortControllerRef.current === controller
      ) {
        abortControllerRef.current = null;
      }

      setIsTyping(false);
    }
  };

  // ---------------------------------------------------------
  // Send new question
  // ---------------------------------------------------------

  const handleSendMessage = async (question) => {
    const trimmedQuestion =
      typeof question === "string"
        ? question.trim()
        : "";

    if (
      !trimmedQuestion ||
      isTyping ||
      isLoadingConversation
    ) {
      return;
    }

    const userMessage = {
      id: createMessageId("user"),

      role: "user",

      content: trimmedQuestion,

      sources: [],
      citations: [],
    };

    const assistantMessage = {
      id: createMessageId("assistant"),

      role: "assistant",

      content: "",

      sources: [],
      citations: [],

      status: "generating",
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
      assistantMessage,
    ]);

    setHasStartedChat(true);
    setStatusMessage("");

    await streamChat({
      question: trimmedQuestion,

      assistantMessageId: assistantMessage.id,

      regenerate: false,
    });
  };

  // ---------------------------------------------------------
  // Regenerate latest assistant answer
  // ---------------------------------------------------------

  const handleRegenerate = async (
    assistantMessageId
  ) => {
    if (isTyping || isLoadingConversation) {
      return;
    }

    const assistantIndex = messages.findIndex(
      (message) =>
        message.id === assistantMessageId
    );

    if (assistantIndex === -1) {
      return;
    }

    if (assistantIndex !== messages.length - 1) {
      setStatusMessage(
        "Only the latest AI response can be regenerated."
      );

      return;
    }

    const assistantMessage =
      messages[assistantIndex];

    if (assistantMessage.role !== "assistant") {
      return;
    }

    const userIndex = assistantIndex - 1;

    if (
      userIndex < 0 ||
      messages[userIndex].role !== "user"
    ) {
      setStatusMessage(
        "This response cannot be regenerated."
      );

      return;
    }

    const question =
      messages[userIndex].content?.trim();

    if (!question) {
      return;
    }

    const originalAssistantMessage = {
      ...assistantMessage,
    };

    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        message.id === assistantMessageId
          ? {
              ...message,
              content: "",
              sources: [],
              citations: [],
              status: "generating",
            }
          : message
      )
    );

    setStatusMessage("");

    await streamChat({
      question,

      assistantMessageId,

      regenerate: true,

      originalAssistantMessage,
    });
  };

  // ---------------------------------------------------------
  // Stop current generation
  // ---------------------------------------------------------

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ---------------------------------------------------------
  // Suggested question
  // ---------------------------------------------------------

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F8F8F8] text-[#171717]">
      <div className="flex h-screen w-full overflow-hidden">

        {/* Sidebar */}
        <ChatSidebar
          mobileOpen={mobileOpen}
          onClose={handleCloseSidebar}
          onNewChat={handleNewChat}
          conversations={conversations}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          activeConversationId={conversationId}
          deletingConversationId={deletingConversationId}
        />

        {/* Main Chat Area */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F8F8F8]">

          {/* Header */}
          <ChatHeader
            onMenuClick={handleOpenSidebar}
            onNewChat={handleNewChat}
          />

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">

            {/* Selected Document */}
            {selectedDocument && (
              <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pt-4">
                <div className="rounded-xl border border-[#E8C9CD] bg-[#F9EFF0] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E8C9CD] bg-white text-[#7A1F2B]">
                      <span className="text-[10px] font-bold">
                        PDF
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7A1F2B]">
                        Chatting with document
                      </p>

                      <p
                        className="truncate text-xs font-medium text-[#171717]"
                        title={
                          selectedDocumentName ||
                          "Selected document"
                        }
                      >
                        {selectedDocumentName ||
                          "Selected document"}
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            {(statusMessage ||
              isLoadingConversation) && (
              <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pt-4">
                <div
                  className="rounded-xl border border-[#E4E4E4] bg-white px-4 py-3 shadow-sm"
                  aria-live="polite"
                >
                  <p className="break-words text-xs font-medium text-[#5F5F5F]">
                    {isLoadingConversation
                      ? "Loading previous conversation..."
                      : statusMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Loading Conversations */}
            {isLoadingConversations && (
              <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pt-3">
                <p
                  className="text-xs text-[#8A8A8A]"
                  aria-live="polite"
                >
                  Refreshing conversation list...
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-y-auto">

              {hasStartedChat ? (
                <MessageList
                  messages={messages}
                  isTyping={isTyping}
                  onRegenerate={handleRegenerate}
                />
              ) : (
                <div className="mx-auto w-full max-w-5xl px-4 py-6">

                  {/* Welcome Card */}
                  <div className="rounded-2xl border border-[#E4E4E4] bg-white p-6 shadow-sm sm:p-8">

                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7E9EB] text-[#7A1F2B]">
                        <span className="text-sm font-bold">
                          AI
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7A1F2B]">
                          AI Knowledge Assistant
                        </p>

                        <h1 className="mt-2 text-xl font-semibold tracking-tight text-[#171717] sm:text-2xl">
                          Welcome to your Enterprise Knowledge Assistant
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F5F5F]">
                          Ask questions about your organization's
                          documents and knowledge base. Get clear,
                          intelligent answers grounded in your
                          enterprise information.
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Suggested Questions */}
                  <div className="mt-5">
                    <SuggestedQuestions
                      onSelectQuestion={
                        handleSuggestedQuestion
                      }
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-[#E4E4E4] bg-white">
              <div className="mx-auto w-full max-w-5xl">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={
                    isTyping ||
                    isLoadingConversation
                  }
                  isTyping={isTyping}
                  onStopGenerating={
                    handleStopGenerating
                  }
                  onStop={handleStopGenerating}
                />
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

export default Chat;