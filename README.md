# Repo Chat

Chat with any github repository.

Available at: https://cf-ai-repo-chat.sakibulislam25800.workers.dev

## Goal

I did not have time to implement a RAG pipeline with indexing using Cloudflare’s Vectorize service so for now, it simply uses the available tools.

I wanted to use the GitHub MCP server, but it isn’t compatible with Cloudflare Agents since it’s built for IDE hosts and lacks the required HTTP/SSE transport and so I added the tools manually.

## Prompts

I do not have a PROMPTS.md, but instead included the prompts in the commits where I used an AI. For most commits, I prompted Claude Code to generate base code and then refined it manually. Some commits involved multiple prompts, while others were smaller fixes where I only included the main prompt used.

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npm run build && npm run deploy
```

Monitor your workers:

```bash
npx wrangler tail
```
