import { Tool } from 'ai';

export async function createFirecrawlTools(): Promise<Record<string, Tool>> {
    const firecrawlAisdk = await import('firecrawl-aisdk');

    return {
        firecrawl_scrape: firecrawlAisdk.scrapeTool as unknown as Tool,
        firecrawl_search: firecrawlAisdk.searchTool as unknown as Tool,
        firecrawl_crawl: firecrawlAisdk.crawlTool as unknown as Tool,
        firecrawl_batch_scrape: firecrawlAisdk.batchScrapeTool as unknown as Tool,
        firecrawl_extract: firecrawlAisdk.extractTool as unknown as Tool,
    };
}
