import { useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import { isToolUIPart } from "ai";
import type { UIMessage } from "ai";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { APPROVAL } from "../shared";

const toolsRequiringConfirmation: string[] = [];

export default function Chat() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  const agent = useAgent({
    agent: "chat",
    name: `${owner}::${repo}`,
  });

  const [agentInput, setAgentInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

    const message = agentInput;
    setAgentInput("");

    // Check if the message is the clear command
    if (message.trim() === "clear") {
      clearHistory();
      return;
    }

    // Send message to agent
    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: message }],
    });
  };

  // Use the agent chat hook
  const {
    messages: agentMessages,
    addToolResult,
    clearHistory,
    status,
    sendMessage,
  } = useAgentChat<unknown, UIMessage<{ createdAt: string }>>({
    agent,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.altKey) {
      e.preventDefault();
      handleAgentSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAgentInput(e.target.value);
    autoResize();
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.max(textareaRef.current.scrollHeight, 24);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [agentInput]);

  return (
    <div className="container">
      <div className="mt-5 font-mono">
        {agentMessages.map((msg, i) => {
          const isUser = msg.role === "user";

          return (
            <div key={msg.id || i}>
              {msg.parts?.map((part, partIndex) => {
                if (part.type === "text") {
                  return (
                    <div key={partIndex} className="leading-[1.5] mb-3">
                      {isUser ? (
                        <div
                          style={{ display: "flex", alignItems: "flex-start" }}
                        >
                          <span style={{ flexShrink: 0, marginRight: "0.5em" }}>
                            user@1.1.1.1 {repo} $
                          </span>
                          <span style={{ flex: 1 }}>{part.text}</span>
                        </div>
                      ) : (
                        <Markdown rehypePlugins={[rehypeHighlight]}>
                          {part.text}
                        </Markdown>
                      )}
                    </div>
                  );
                }

                if (isToolUIPart(part)) {
                  const toolCallId = part.toolCallId;
                  const toolName = part.type.replace("tool-", "");
                  const needsConfirmation =
                    toolsRequiringConfirmation.includes(toolName);

                  // Render tool invocations
                  if (part.state === "input-available" && needsConfirmation) {
                    return (
                      <div
                        key={partIndex}
                        className="leading-[1.5] mb-3"
                        style={{
                          border: "1px solid",
                          padding: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <div>Tool: {toolName}</div>
                        <div>Input: {JSON.stringify(part.input)}</div>
                        <div style={{ marginTop: "8px" }}>
                          <button
                            onClick={() =>
                              addToolResult({
                                tool: toolName,
                                toolCallId,
                                output: APPROVAL.YES,
                              })
                            }
                            style={{ marginRight: "8px", cursor: "pointer" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              addToolResult({
                                tool: toolName,
                                toolCallId,
                                output: APPROVAL.NO,
                              })
                            }
                            style={{ cursor: "pointer" }}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (part.state === "output-available") {
                    return (
                      <div
                        key={partIndex}
                        className="leading-[1.5] mb-3"
                        style={{ opacity: 0.7 }}
                      >
                        [Tool executed: {toolName}]
                      </div>
                    );
                  }
                }

                return null;
              })}
            </div>
          );
        })}

        {(status === "submitted" ||
          (status === "streaming" &&
            (!agentMessages.length ||
              !agentMessages[agentMessages.length - 1]?.parts?.some(
                (part) => part.type === "text" && part.text.trim(),
              )))) && (
          <div className="leading-[1.5] mb-3" style={{ opacity: 0.7 }}>
            Thinking...
          </div>
        )}

        <div
          className="leading-[1.5]"
          style={{ display: "flex", alignItems: "flex-start" }}
        >
          <span style={{ flexShrink: 0, marginRight: "0.5em" }}>
            user@1.1.1.1 {repo} $
          </span>
          <textarea
            ref={textareaRef}
            value={agentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder=""
            rows={1}
            style={{
              border: 0,
              background: "transparent",
              outline: "none",
              flex: 1,
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
              padding: 0,
              margin: 0,
              resize: "none",
              overflow: "hidden",
              minHeight: "24px",
            }}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
