import { Octokit } from "octokit";

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // Route: GET /api/validate-repo/:owner/:repo
    const validateRepoMatch = url.pathname.match(
      /^\/api\/validate-repo\/([^/]+)\/([^/]+)$/,
    );
    if (validateRepoMatch && request.method === "GET") {
      const [, owner, repo] = validateRepoMatch;

      try {
        const octokit = new Octokit({
          auth: env.GITHUB_TOKEN,
        });
        await octokit.rest.repos.get({ owner, repo });
        return Response.json({ valid: true });
      } catch {
        return Response.json(
          { valid: false, error: "Failed to validate repository" },
          { status: 500 },
        );
      }
    }

    // 404 for unmatched routes
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
