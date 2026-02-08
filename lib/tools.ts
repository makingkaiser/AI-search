import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';

let exaInstance: Exa | null = null;
function getExa() {
  if (!exaInstance) {
    exaInstance = new Exa(process.env.EXA_API_KEY as string);
  }
  return exaInstance;
}

export interface ParameterConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'array' | 'boolean' | 'date';
  section: 'search' | 'filters' | 'contents';
  required?: boolean;
  default?: unknown;
  options?: string[];
  description?: string;
}

export interface ToolMetadataEntry {
  displayName: string;
  endpoint: string;
  description: string;
  icon: string;
  category: 'search' | 'research' | 'extract' | 'similar';
  availableParams: ParameterConfig[];
}

const CATEGORY_OPTIONS = [
  'company',
  'research paper', 
  'news',
  'pdf',
  'github',
  'tweet',
  'personal site',
  'financial report',
  'people',
] as const;

const SEARCH_TYPE_OPTIONS = ['auto', 'neural', 'fast'] as const;

export const toolMetadata: Record<string, ToolMetadataEntry> = {
  exa_search: {
    displayName: 'Web Search',
    endpoint: '/search',
    description: 'Search the web for real-time information using Exa API',
    icon: 'Search',
    category: 'search',
    availableParams: [
      { key: 'query', label: 'Search Query', type: 'text', section: 'search', required: true, description: 'The search query' },
      { key: 'type', label: 'Search Type', type: 'select', section: 'search', default: 'auto', options: [...SEARCH_TYPE_OPTIONS], description: 'auto (default), neural (semantic), or fast (keyword)' },
      { key: 'category', label: 'Category', type: 'select', section: 'search', options: [...CATEGORY_OPTIONS], description: 'Filter results by content type' },
      { key: 'numResults', label: 'Number of Results', type: 'number', section: 'search', default: 5, description: 'Number of results to return (1-100)' },
      { key: 'includeDomains', label: 'Include Domains', type: 'array', section: 'filters', description: 'Only search these domains' },
      { key: 'excludeDomains', label: 'Exclude Domains', type: 'array', section: 'filters', description: 'Exclude these domains from results' },
      { key: 'startPublishedDate', label: 'Published After', type: 'date', section: 'filters', description: 'Filter by publish date (YYYY-MM-DD)' },
      { key: 'endPublishedDate', label: 'Published Before', type: 'date', section: 'filters', description: 'Filter by publish date (YYYY-MM-DD)' },
      { key: 'includeText', label: 'Must Include Text', type: 'array', section: 'filters', description: 'Results must contain this phrase (max 5 words)' },
      { key: 'excludeText', label: 'Exclude Text', type: 'array', section: 'filters', description: 'Exclude results containing this phrase' },
    ],
  },
  exa_contents: {
    displayName: 'Get Contents',
    endpoint: '/contents',
    description: 'Extract content from specific URLs',
    icon: 'Globe',
    category: 'extract',
    availableParams: [
      { key: 'urls', label: 'URLs', type: 'array', section: 'search', required: true, description: 'URLs to extract content from' },
      { key: 'text', label: 'Include Text', type: 'boolean', section: 'contents', default: true, description: 'Return full page text' },
      { key: 'highlights', label: 'Highlights', type: 'boolean', section: 'contents', description: 'Extract relevant highlights' },
      { key: 'summary', label: 'Summary', type: 'boolean', section: 'contents', description: 'Generate AI summary' },
    ],
  },
  exa_find_similar: {
    displayName: 'Find Similar',
    endpoint: '/findSimilar',
    description: 'Find pages similar to a given URL',
    icon: 'Copy',
    category: 'similar',
    availableParams: [
      { key: 'url', label: 'Source URL', type: 'text', section: 'search', required: true, description: 'URL to find similar pages for' },
      { key: 'numResults', label: 'Number of Results', type: 'number', section: 'search', default: 5, description: 'Number of similar pages to return' },
      { key: 'includeDomains', label: 'Include Domains', type: 'array', section: 'filters', description: 'Only search these domains' },
      { key: 'excludeDomains', label: 'Exclude Domains', type: 'array', section: 'filters', description: 'Exclude these domains' },
      { key: 'category', label: 'Category', type: 'select', section: 'search', options: [...CATEGORY_OPTIONS], description: 'Filter by content type' },
    ],
  },
};

export const exaSearchTool = tool({
  description: `Search the web using Exa AI's /search endpoint. Supports filtering by category, domains, dates, and text. Use for general questions, current events, news, research papers, code (github), company info, and more. If the user asks for several unrelate`,
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    type: z.enum(['auto', 'neural', 'fast']).optional().describe('Search type: auto (default), neural (semantic), or fast (keyword)'),
    category: z.enum(['company', 'research paper', 'news', 'pdf', 'github', 'tweet', 'personal site', 'financial report', 'people']).optional().describe('Filter by content category'),
    numResults: z.number().min(1).max(100).optional().describe('Number of results (default: 5, max: 100)'),
    includeDomains: z.array(z.string()).optional().describe('Only include results from these domains'),
    excludeDomains: z.array(z.string()).optional().describe('Exclude results from these domains'),
    startPublishedDate: z.string().optional().describe('Filter results published after this date (YYYY-MM-DD)'),
    endPublishedDate: z.string().optional().describe('Filter results published before this date (YYYY-MM-DD)'),
    includeText: z.array(z.string()).max(1).optional().describe('Results must contain this exact phrase (max 5 words)'),
    excludeText: z.array(z.string()).max(1).optional().describe('Exclude results containing this phrase'),
  }),
  execute: async (params) => {
    const { query, type, category, numResults, includeDomains, excludeDomains, startPublishedDate, endPublishedDate, includeText, excludeText } = params;
    
    const searchOptions: Record<string, unknown> = {
      type: type || 'auto',
      numResults: numResults || 5,
      text: true,
    };

    if (category) searchOptions.category = category;
    if (includeDomains?.length) searchOptions.includeDomains = includeDomains;
    if (excludeDomains?.length) searchOptions.excludeDomains = excludeDomains;
    if (startPublishedDate) searchOptions.startPublishedDate = startPublishedDate;
    if (endPublishedDate) searchOptions.endPublishedDate = endPublishedDate;
    if (includeText?.length) searchOptions.includeText = includeText;
    if (excludeText?.length) searchOptions.excludeText = excludeText;

    const result = await getExa().searchAndContents(query, searchOptions);
    
    return result.results.map(r => ({
      title: r.title,
      url: r.url,
      text: r.text?.slice(0, 1500),
      publishedDate: r.publishedDate,
    }));
  }
});

export const exaContentsTool = tool({
  description: `Extract content from specific URLs using Exa AI's /contents endpoint. Use when the user provides a URL and wants to see its content.`,
  inputSchema: z.object({
    urls: z.array(z.string()).min(1).describe('URLs to extract content from'),
    text: z.boolean().optional().describe('Return full page text (default: true)'),
    highlights: z.boolean().optional().describe('Extract relevant highlights'),
    summary: z.boolean().optional().describe('Generate AI summary'),
  }),
  execute: async ({ urls, text = true, highlights, summary }) => {
    const contentOptions: Record<string, unknown> = {};
    if (text !== false) contentOptions.text = true;
    if (highlights) contentOptions.highlights = true;
    if (summary) contentOptions.summary = true;

    const result = await getExa().getContents(urls, contentOptions);
    
    return result.results.map(r => {
      const item = r as Record<string, unknown>;
      return {
        title: r.title,
        url: r.url,
        text: r.text?.slice(0, 3000),
        highlights: item.highlights,
        summary: item.summary,
      };
    });
  }
});

export const exaFindSimilarTool = tool({
  description: `Find pages similar to a given URL using Exa AI's /findSimilar endpoint. Use when user wants to find content similar to a specific page.`,
  inputSchema: z.object({
    url: z.string().describe('URL to find similar pages for'),
    numResults: z.number().min(1).max(100).optional().describe('Number of results (default: 5)'),
    includeDomains: z.array(z.string()).optional().describe('Only include results from these domains'),
    excludeDomains: z.array(z.string()).optional().describe('Exclude results from these domains'),
    category: z.enum(['company', 'research paper', 'news', 'pdf', 'github', 'tweet', 'personal site', 'financial report', 'people']).optional().describe('Filter by content category'),
  }),
  execute: async ({ url, numResults, includeDomains, excludeDomains, category }) => {
    const searchOptions: Record<string, unknown> = {
      numResults: numResults || 5,
      text: true,
    };

    if (includeDomains?.length) searchOptions.includeDomains = includeDomains;
    if (excludeDomains?.length) searchOptions.excludeDomains = excludeDomains;
    if (category) searchOptions.category = category;

    const result = await getExa().findSimilarAndContents(url, searchOptions);
    
    return result.results.map(r => ({
      title: r.title,
      url: r.url,
      text: r.text?.slice(0, 1500),
      publishedDate: r.publishedDate,
    }));
  }
});

export const tools = {
  exa_search: exaSearchTool,
  exa_contents: exaContentsTool,
  exa_find_similar: exaFindSimilarTool,
};

export function getToolMetadata(toolName: string): ToolMetadataEntry {
  return toolMetadata[toolName] || {
    displayName: toolName,
    endpoint: 'unknown',
    description: 'Unknown tool',
    icon: 'HelpCircle',
    category: 'search' as const,
    availableParams: [],
  };
}

export function getToolParameters(toolName: string): ParameterConfig[] {
  return toolMetadata[toolName]?.availableParams || [];
}
