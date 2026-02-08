"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { getAssetPath } from "./utils";
import { ToolCallCard } from "@/components/ToolCallCard";
import { Loader2, Square } from "lucide-react";

export default function Page() {
  const [input, setInput] = useState("");
  const [showModelNotice, setShowModelNotice] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: getAssetPath("/api/chat") }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayMessages = messages.filter((m) => m.role !== "system");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setShowModelNotice(false);
    sendMessage({ text: input });
    setInput("");
  };

  const handleStop = () => {
    stop();
  };

  const handleRerunTool = async (
    toolName: string,
    newArgs: Record<string, unknown>
  ) => {
    // Create a user message that triggers the tool with the updated parameters
    const toolPrompt = `Please run the ${toolName} tool again with these parameters: ${JSON.stringify(
      newArgs,
      null,
      2
    )}`;

    sendMessage({ text: toolPrompt });
  };

  const getMessageText = (message: (typeof messages)[0]): string => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("");
  };

  const getToolInvocations = (message: (typeof messages)[0]) => {
    // Debug: log all parts to see what we're getting
    console.log("[Message Parts]", JSON.stringify(message.parts, null, 2));

    return message.parts
      .filter((part) => {
        // Match both static tools (tool-{name}) and dynamic tools
        const isToolPart =
          part.type.startsWith("tool-") || part.type === "dynamic-tool";
        return isToolPart;
      })
      .map((part) => {
        // Cast to access all possible properties
        const toolPart = part as Record<string, unknown>;

        // For static tools: type is "tool-{toolName}" (e.g., "tool-exa_search")
        // For dynamic tools: type is "dynamic-tool" and toolName is a property
        const isStaticTool =
          part.type.startsWith("tool-") && part.type !== "dynamic-tool";
        const toolName = isStaticTool
          ? part.type.replace("tool-", "")
          : (toolPart.toolName as string);

        // Debug: log the actual structure
        console.log("[ToolPart Debug]", {
          type: part.type,
          toolName,
          state: toolPart.state,
          hasInput: "input" in toolPart,
          input: toolPart.input,
          keys: Object.keys(toolPart),
        });

        // AI SDK v6 uses 'input' for the tool parameters
        const args = (toolPart.input || {}) as Record<string, unknown>;

        return {
          toolCallId: toolPart.toolCallId as string,
          toolName,
          args,
          state: toolPart.state as
            | "input-streaming"
            | "input-available"
            | "output-available"
            | "output-error",
          result: toolPart.output,
          errorText: toolPart.errorText as string | undefined,
        };
      });
  };

  const getToolStatus = (
    state: string
  ): "pending" | "running" | "completed" | "error" => {
    if (state === "output-available") return "completed";
    if (state === "output-error") return "error";
    if (state === "input-available") return "running";
    if (state === "input-streaming") return "running";
    return "pending";
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b z-50">
        <div className="md:max-w-4xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <a
            href="https://dashboard.exa.ai/playground/answer"
            target="_blank"
            className="flex items-center px-4 py-1.5 bg-white border-2 border-[var(--brand-default)] text-[var(--brand-default)] rounded-full hover:bg-[var(--brand-default)] hover:text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-sm">Try Exa API</span>
          </a>
          <div className="flex items-center gap-4 text-md text-gray-600">
            <a
              href="https://exa.ai/demos"
              target="_blank"
              className="hover:text-[var(--brand-default)] transition-colors"
            >
              <span className="underline">See More Demos</span>
            </a>
            <span className="text-gray-400">|</span>
            <a
              href="https://github.com/exa-labs/exa-deepseek-chat"
              target="_blank"
              className="flex items-center gap-1.5 hover:text-[var(--brand-default)] transition-colors"
            >
              <span className="underline">View Project Code</span>
            </a>
          </div>
        </div>
      </div>

      <div className="md:max-w-4xl mx-auto p-6 pt-20 pb-24 space-y-6 bg-[var(--secondary-default)]">
        <div className="space-y-6">
          {displayMessages.map((message) => {
            const toolInvocations = getToolInvocations(message);
            const textContent = getMessageText(message);

            return (
              <div key={message.id}>
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="rounded py-3 px-4 max-w-[85%] bg-[var(--secondary-darker)] text-black">
                      <div className="whitespace-pre-wrap text-[15px]">
                        {textContent}
                      </div>
                    </div>
                  </div>
                )}

                {message.role === "assistant" && (
                  <div className="flex justify-start">
                    <div className="rounded py-3 max-w-[85%] text-gray-900 space-y-4">
                      {toolInvocations.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">Tools Used</span>
                          </div>
                          {toolInvocations.map(
                            (inv) =>
                              inv && (
                                <ToolCallCard
                                  key={inv.toolCallId}
                                  toolName={inv.toolName}
                                  args={inv.args}
                                  result={
                                    inv.result !== undefined
                                      ? typeof inv.result === "string"
                                        ? inv.result
                                        : JSON.stringify(inv.result)
                                      : undefined
                                  }
                                  status={getToolStatus(inv.state)}
                                  onRerun={(newArgs) =>
                                    handleRerunTool(inv.toolName, newArgs)
                                  }
                                />
                              )
                          )}
                        </div>
                      )}

                      {textContent && (
                        <div className="prose prose-base max-w-none px-4 text-gray-800 text-base">
                          <ReactMarkdown>{textContent}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading &&
            displayMessages.length > 0 &&
            displayMessages[displayMessages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded py-3 px-4 text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Claude is thinking...</span>
                </div>
              </div>
            )}

          {error && (
            <div className="p-4 bg-red-50 rounded border border-red-100">
              <p className="text-sm text-red-800">⚠️ {error.message}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        className={`${
          displayMessages.length === 0
            ? "fixed inset-0 flex items-center justify-center bg-transparent"
            : "fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t"
        } z-40 transition-all duration-300`}
      >
        <div
          className={`${
            displayMessages.length === 0
              ? "w-full max-w-2xl mx-auto px-6"
              : "w-full max-w-4xl mx-auto px-6 py-4"
          }`}
        >
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="flex gap-2 w-full max-w-4xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                autoFocus
                disabled={isLoading}
                className="flex-1 p-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)] text-base disabled:opacity-50"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-5 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium w-[120px] flex items-center justify-center gap-2 transition-colors"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-5 py-3 bg-[var(--brand-default)] text-white rounded-md hover:bg-[var(--brand-muted)] font-medium w-[120px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Ask
                </button>
              )}
            </div>
            {showModelNotice && displayMessages.length === 0 && (
              <p className="text-xs md:text-sm text-gray-600 mt-8">
                Powered by Claude Sonnet 4.5 with Exa search tools
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
