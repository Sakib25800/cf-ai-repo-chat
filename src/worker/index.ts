import { Octokit } from "octokit";
import { routeAgentRequest } from "agents";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { cleanupMessages } from "./utils";
import { createTools } from "./tools";

const model = openai("gpt-4.1-nano");

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>) {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Create tools with access to the environment
        const allTools = createTools(this.env);

        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Extract owner and repo from the agent name (format: "owner::repo")
        const decodedName = decodeURIComponent(this.name);
        const [owner, repo] = decodedName.split("::");

        const systemPrompt = `You are a technical assistant specialized in analyzing the GitHub repository: ${owner}/${repo}

        IMPORTANT: You can ONLY answer questions about the repository ${owner}/${repo}. If a user asks about a different repository, politely remind them that you're focused on ${owner}/${repo}.

        When analyzing this repository:
        1. Start by getting repository info to understand the project context
        2. Explore the codebase structure before diving into specific files
        3. Search for relevant code patterns when looking for specific functionality
        4. Check the README for project overview and documentation
        5. Use multiple tools when needed for comprehensive answers

        Guidelines for responses:
        - Always use tools to gather information before responding
        - Include code excerpts with file paths when useful
        - Keep answers concise and focused on the question
        - If information isn't in the repository, say so clearly
        - Never guess or fabricate code, functions, or files
        - Explain how code fits in the overall project structure

        Remember: All tool calls must use owner="${owner}" and repo="${repo}" as parameters.`;

        const result = streamText({
          system: systemPrompt,
          messages: convertToModelMessages(cleanedMessages),
          model,
          tools: allTools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10),
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`,
          },
        ],
        metadata: {
          createdAt: new Date(),
        },
      },
    ]);
  }
}

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

    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
