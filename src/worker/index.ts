import { Hono } from "hono";
import { Octokit } from "octokit";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/validate-repo/:owner/:repo", async (c) => {
  const { owner, repo } = c.req.param();

  try {
    const octokit = new Octokit({
      auth: c.env.GITHUB_TOKEN,
    });
    await octokit.rest.repos.get({ owner, repo });
    return c.json({ valid: true });
  } catch {
    return c.json(
      { valid: false, error: "Failed to validate repository" },
      500,
    );
  }
});

export default app;
