import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [repo, setRepo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo.trim()) {
      setError("Please enter a repository");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/validate-repo/${repo}`);
      const data = await response.json();

      if (!data.valid) {
        setError(data.error || "Repository not found");
        setLoading(false);
        return;
      }
      navigate(`/chat/${repo}`);
    } catch {
      setError("Failed to validate repository");
      setLoading(false);
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
                placeholder="e.g., cloudflare/agents"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                disabled={loading}
              />
              {error && <small style={{ color: "red" }}>{error}</small>}
            </div>
            <button
              type="submit"
              className="btn btn-default"
              disabled={loading}
            >
              {loading ? "Validating..." : "Chat"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
