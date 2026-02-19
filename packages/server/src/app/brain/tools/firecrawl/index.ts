import { Tool, ToolSet } from 'ai';

// Tool names
export const FIRECRAWL_SCRAPE_TOOL_NAME = 'firecrawl_scrape';
export const FIRECRAWL_SEARCH_TOOL_NAME = 'firecrawl_search';
export const FIRECRAWL_CRAWL_TOOL_NAME = 'firecrawl_crawl';
export const FIRECRAWL_BATCH_SCRAPE_TOOL_NAME = 'firecrawl_batch_scrape';
export const FIRECRAWL_EXTRACT_TOOL_NAME = 'firecrawl_extract';

// Tool creator
export async function createFirecrawlTools(): Promise<Record<string, Tool>> {
    try {
       
        const firecrawlAisdk = await import('firecrawl-aisdk');

        const tools: ToolSet = {
            [FIRECRAWL_SCRAPE_TOOL_NAME]: firecrawlAisdk.scrapeTool as any,
            [FIRECRAWL_SEARCH_TOOL_NAME]: firecrawlAisdk.searchTool as any,
            [FIRECRAWL_CRAWL_TOOL_NAME]: firecrawlAisdk.crawlTool as any,
            [FIRECRAWL_BATCH_SCRAPE_TOOL_NAME]: firecrawlAisdk.batchScrapeTool as any,
            [FIRECRAWL_EXTRACT_TOOL_NAME]: firecrawlAisdk.extractTool as any,
        };
        return tools;
    } catch (error) {
        console.error('Failed to load Firecrawl tools:', error);
        return {};
    }
}
