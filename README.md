# AI Search Chat App

![Homepage Screenshot](./public/homepage.png)

A Next.js chat application powered by Claude (Anthropic) with Exa AI search tools for real-time web search capabilities.

## Features

- **AI-Powered Chat**: Powered by Claude Sonnet 4.5 via Anthropic API
- **Web Search**: Integrated Exa AI search tools for real-time information retrieval
- **Tool Calling**: Parallel tool execution for efficient multi-query searches
- **Modern UI**: Built with Next.js, TailwindCSS, and TypeScript

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **AI Provider**: Anthropic Claude Sonnet 4.5
- **Search API**: Exa AI
- **UI**: TailwindCSS, React Markdown
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- Anthropic API key
- Exa API key

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd AI-search
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
EXA_API_KEY=your_exa_api_key_here
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Keys

- **Anthropic API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
- **Exa API Key**: Get from [Exa Dashboard](https://dashboard.exa.ai/api-keys)

## Available Tools

The app includes three Exa AI search tools:

- **exa_search**: General web search with filtering options
- **exa_contents**: Extract content from specific URLs
- **exa_find_similar**: Find pages similar to a given URL

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
