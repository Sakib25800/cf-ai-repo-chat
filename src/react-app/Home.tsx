import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [repo, setRepo] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repo.trim()) {
      navigate(`/chat/${repo}`);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div style={{ width: "100%", maxWidth: "500px", padding: "20px" }}>
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>Enter GitHub Repository</legend>
            <div className="form-group">
              <label htmlFor="repo">owner/repo:</label>
              <input
                type="text"
                id="repo"
                placeholder="e.g., facebook/react"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-default">
              Chat
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
