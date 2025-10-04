import { useParams } from "react-router-dom";
import { useState } from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

export default function Chat() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { type: "user", content: "How do I set up authentication in this repo?" },
    {
      type: "bot",
      content:
        "Based on the repository code, authentication is configured in `src/auth/config.ts`. You'll need to set up environment variables and install the required dependencies.\n\n```typescript\nconst config = {\n  apiKey: process.env.API_KEY,\n  authUrl: 'https://auth.example.com'\n};\n```",
    },
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!input.trim()) return;

      setMessages([
        ...messages,
        { type: "user", content: input },
        {
          type: "bot",
          content:
            "Here's an example:\n\n```javascript\nfunction hello() {\n  console.log('Hello, world!');\n}\n```",
        },
      ]);
      setInput("");
    }
  };

  return (
    <div className="container">
      <h3>
        {owner}/{repo}
      </h3>

      <div style={{ marginTop: "20px", fontFamily: "monospace" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ lineHeight: "1.5" }}>
            {msg.type === "user" ? (
              <>$ {msg.content}</>
            ) : (
              <Markdown rehypePlugins={[rehypeHighlight]}>
                {msg.content}
              </Markdown>
            )}
          </div>
        ))}

        <div style={{ lineHeight: "1.5" }}>
          ${" "}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            style={{
              border: 0,
              background: "transparent",
              outline: "none",
              width: "calc(100% - 20px)",
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
              padding: 0,
              margin: 0,
              verticalAlign: "baseline",
            }}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
