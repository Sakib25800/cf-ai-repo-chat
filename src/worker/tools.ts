/**
 * Tool definitions for the AI chat agent
 * Tools execute automatically with access to the environment
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { Octokit } from "octokit";

/**
 * Create tools with access to the environment
 */
export function createTools(env: Env) {
  return {
    /**
     * Get repository information and metadata
     */
    getRepositoryInfo: tool({
      description:
        "Get basic information about a GitHub repository including description, languages, stats, and metadata",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
      }),
      execute: async ({ owner, repo }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          const [repoResponse, languagesResponse] = await Promise.all([
            octokit.rest.repos.get({ owner, repo }),
            octokit.rest.repos.listLanguages({ owner, repo }),
          ]);

          const repoData = repoResponse.data;
          return {
            name: repoData.name,
            full_name: repoData.full_name,
            description: repoData.description,
            language: repoData.language,
            languages: languagesResponse.data,
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            size: repoData.size,
            default_branch: repoData.default_branch,
            created_at: repoData.created_at,
            updated_at: repoData.updated_at,
            topics: repoData.topics,
            license: repoData.license?.name,
            open_issues_count: repoData.open_issues_count,
            watchers_count: repoData.watchers_count,
            archived: repoData.archived,
            disabled: repoData.disabled,
            private: repoData.private,
          };
        } catch (error: unknown) {
          throw new Error(
            `Failed to get repository info: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * List contents of a directory in the repository
     */
    listDirectoryContents: tool({
      description:
        "List files and subdirectories in a specific path within the repository",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        path: z
          .string()
          .default("")
          .describe("Directory path (empty string for root directory)"),
        ref: z
          .string()
          .optional()
          .describe("Branch/commit reference (defaults to default branch)"),
      }),
      execute: async ({ owner, repo, path, ref }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          const response = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
          });

          if (Array.isArray(response.data)) {
            return response.data.map((item) => ({
              name: item.name,
              path: item.path,
              type: item.type,
              size: item.size,
              sha: item.sha,
              download_url: item.download_url,
            }));
          } else {
            return [
              {
                name: response.data.name,
                path: response.data.path,
                type: response.data.type,
                size: response.data.size,
                sha: response.data.sha,
                download_url: response.data.download_url,
              },
            ];
          }
        } catch (error: unknown) {
          throw new Error(
            `Failed to list directory contents: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * Get the content of a specific file
     */
    getFileContent: tool({
      description:
        "Retrieve the content of a specific file from the repository",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        path: z.string().describe("File path within the repository"),
        ref: z
          .string()
          .optional()
          .describe("Branch/commit reference (defaults to default branch)"),
      }),
      execute: async ({ owner, repo, path, ref }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          const response = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
          });

          if ("content" in response.data && response.data.content) {
            const content = atob(response.data.content.replace(/\s/g, ""));
            return {
              name: response.data.name,
              path: response.data.path,
              size: response.data.size,
              content: content,
              sha: response.data.sha,
              encoding: response.data.encoding,
            };
          } else {
            throw new Error("File content not available or file is too large");
          }
        } catch (error: unknown) {
          throw new Error(
            `Failed to get file content: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * Search for code within the repository
     */
    searchCode: tool({
      description:
        "Search for code patterns, functions, or text within the repository",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        query: z
          .string()
          .describe(
            "Search query (can include code patterns, function names, etc.)",
          ),
        language: z
          .string()
          .optional()
          .describe("Filter by programming language"),
        filename: z
          .string()
          .optional()
          .describe("Filter by filename or extension"),
        path: z.string().optional().describe("Filter by file path"),
      }),
      execute: async ({ owner, repo, query, language, filename, path }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          let searchQuery = `${query} repo:${owner}/${repo}`;
          if (language) searchQuery += ` language:${language}`;
          if (filename) searchQuery += ` filename:${filename}`;
          if (path) searchQuery += ` path:${path}`;

          const response = await octokit.rest.search.code({
            q: searchQuery,
            per_page: 30,
          });

          return {
            total_count: response.data.total_count,
            items: response.data.items.map((item) => ({
              name: item.name,
              path: item.path,
              sha: item.sha,
              url: item.html_url,
              repository: item.repository.full_name,
              text_matches: item.text_matches?.map((match) => ({
                object_url: match.object_url,
                property: match.property,
                fragment: match.fragment,
              })),
            })),
          };
        } catch (error: unknown) {
          throw new Error(
            `Failed to search code: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * Get repository tree structure
     */
    getRepositoryTree: tool({
      description:
        "Get the complete tree structure of the repository or a specific directory",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        tree_sha: z
          .string()
          .optional()
          .describe("Tree SHA (defaults to HEAD of default branch)"),
        recursive: z
          .boolean()
          .default(false)
          .describe("Whether to fetch the tree recursively"),
      }),
      execute: async ({ owner, repo, tree_sha, recursive }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          let treeSha = tree_sha;
          if (!treeSha) {
            const repoResponse = await octokit.rest.repos.get({ owner, repo });
            const branchResponse = await octokit.rest.repos.getBranch({
              owner,
              repo,
              branch: repoResponse.data.default_branch,
            });
            treeSha = branchResponse.data.commit.sha;
          }

          const response = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: treeSha,
            recursive: recursive ? "1" : "0",
          });

          return {
            sha: response.data.sha,
            truncated: response.data.truncated,
            tree: response.data.tree.map((item) => ({
              path: item.path,
              mode: item.mode,
              type: item.type,
              sha: item.sha,
              size: item.size,
              url: item.url,
            })),
          };
        } catch (error: unknown) {
          throw new Error(
            `Failed to get repository tree: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * Get recent commits from the repository
     */
    getRecentCommits: tool({
      description:
        "Get recent commits from the repository to understand recent changes",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        sha: z
          .string()
          .optional()
          .describe("Branch or commit SHA to start from"),
        path: z
          .string()
          .optional()
          .describe("Only commits that modified this file path"),
        per_page: z
          .number()
          .default(10)
          .describe("Number of commits to return (max 100)"),
      }),
      execute: async ({ owner, repo, sha, path, per_page }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          const response = await octokit.rest.repos.listCommits({
            owner,
            repo,
            sha: sha || undefined,
            path: path || undefined,
            per_page: Math.min(per_page, 100),
          });

          return response.data.map((commit) => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author?.name || null,
              email: commit.commit.author?.email || null,
              date: commit.commit.author?.date || null,
            },
            committer: {
              name: commit.commit.committer?.name || null,
              email: commit.commit.committer?.email || null,
              date: commit.commit.committer?.date || null,
            },
            url: commit.html_url,
            stats: commit.stats,
          }));
        } catch (error: unknown) {
          throw new Error(
            `Failed to get recent commits: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * List repository branches
     */
    listBranches: tool({
      description: "List all branches in the repository",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        protected_only: z
          .boolean()
          .optional()
          .describe("Filter to only protected branches"),
      }),
      execute: async ({ owner, repo, protected_only }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          const response = await octokit.rest.repos.listBranches({
            owner,
            repo,
            protected: protected_only,
          });

          return response.data.map((branch) => ({
            name: branch.name,
            commit: {
              sha: branch.commit.sha,
              url: branch.commit.url,
            },
            protected: branch.protected,
          }));
        } catch (error: unknown) {
          throw new Error(
            `Failed to list branches: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * Get README content
     */
    getReadme: tool({
      description: "Get the README file content from the repository",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        ref: z
          .string()
          .optional()
          .describe("Branch/commit reference (defaults to default branch)"),
      }),
      execute: async ({ owner, repo, ref }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          const response = await octokit.rest.repos.getReadme({
            owner,
            repo,
            ref,
          });

          const content = atob(response.data.content.replace(/\s/g, ""));
          return {
            name: response.data.name,
            path: response.data.path,
            sha: response.data.sha,
            size: response.data.size,
            content: content,
            download_url: response.data.download_url,
            html_url: response.data.html_url,
          };
        } catch (error: unknown) {
          throw new Error(
            `Failed to get README: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),

    /**
     * Search for issues and pull requests
     */
    searchIssuesAndPRs: tool({
      description:
        "Search for issues and pull requests in the repository for context about features and bugs",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner/organization name"),
        repo: z.string().describe("Repository name"),
        query: z.string().describe("Search query for issues/PRs"),
        state: z
          .enum(["open", "closed", "all"])
          .default("all")
          .describe("Filter by state"),
        type: z
          .enum(["issue", "pr", "all"])
          .default("all")
          .describe("Filter by type"),
      }),
      execute: async ({ owner, repo, query, state, type }) => {
        try {
          const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

          let searchQuery = `${query} repo:${owner}/${repo}`;
          if (state !== "all") searchQuery += ` state:${state}`;
          if (type === "issue") searchQuery += ` type:issue`;
          if (type === "pr") searchQuery += ` type:pr`;

          const response = await octokit.rest.search.issuesAndPullRequests({
            q: searchQuery,
            per_page: 20,
          });

          return {
            total_count: response.data.total_count,
            items: response.data.items.map((item) => ({
              number: item.number,
              title: item.title,
              body: item.body
                ? item.body.length > 500
                  ? item.body.substring(0, 500) + "..."
                  : item.body
                : null,
              state: item.state,
              created_at: item.created_at,
              updated_at: item.updated_at,
              labels: item.labels.map((label) =>
                typeof label === "string" ? label : label.name,
              ),
              url: item.html_url,
              type: item.pull_request ? "pull_request" : "issue",
            })),
          };
        } catch (error: unknown) {
          throw new Error(
            `Failed to search issues and PRs: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    }),
  } satisfies ToolSet;
}

// Keep the old exports for backward compatibility but they won't be used
export const tools = {} as ToolSet;
export const executions = {};
