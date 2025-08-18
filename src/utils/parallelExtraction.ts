import { ExtractionResult } from '@/types/contact';
import { extractContactWithWiza } from './wiza';
import { getApiKeyPool } from './apiKeyPool';

interface ExtractionTask {
  url: string;
  apiKey: string;
  index: number;
}

interface ExtractionQueueOptions {
  maxConcurrent: number;
  delayBetweenBatches?: number;
  onProgress?: (current: number, total: number) => void;
  onTaskComplete?: (url: string, result: ExtractionResult, index: number) => void;
}

export class ParallelExtractionQueue {
  private tasks: ExtractionTask[] = [];
  private running: number = 0;
  private completed: number = 0;
  private results: Map<string, ExtractionResult> = new Map();
  private options: ExtractionQueueOptions;

  constructor(options: ExtractionQueueOptions) {
    this.options = {
      delayBetweenBatches: 1000, // Default 1 second between batches
      ...options
    };
  }

  // Add URLs to the extraction queue
  addUrls(urls: string[]) {
    const apiKeyPool = getApiKeyPool();
    if (!apiKeyPool) {
      throw new Error('API key pool not initialized');
    }

    urls.forEach((url, index) => {
      const apiKey = apiKeyPool.getNextKey();
      if (!apiKey) {
        throw new Error('No available API keys');
      }

      this.tasks.push({
        url,
        apiKey,
        index: this.tasks.length + index
      });
    });
  }

  // Process all tasks with parallel execution
  async processAll(): Promise<Map<string, ExtractionResult>> {
    const batches = this.createBatches();
    console.log(`Processing ${this.tasks.length} URLs in ${batches.length} batches with max ${this.options.maxConcurrent} concurrent`);
    
    for (const batch of batches) {
      console.log(`Starting batch with ${batch.length} URLs`);
      await this.processBatch(batch);
      
      // Delay between batches to avoid rate limiting
      if (this.options.delayBetweenBatches && batch !== batches[batches.length - 1]) {
        console.log(`Waiting ${this.options.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenBatches));
      }
    }

    return this.results;
  }

  // Create batches based on max concurrent limit
  private createBatches(): ExtractionTask[][] {
    const batches: ExtractionTask[][] = [];
    const maxConcurrent = this.options.maxConcurrent;

    for (let i = 0; i < this.tasks.length; i += maxConcurrent) {
      batches.push(this.tasks.slice(i, i + maxConcurrent));
    }

    return batches;
  }

  // Process a batch of tasks in parallel
  private async processBatch(batch: ExtractionTask[]): Promise<void> {
    const promises = batch.map(task => this.processTask(task));
    await Promise.all(promises);
  }

  // Process individual task
  private async processTask(task: ExtractionTask): Promise<void> {
    this.running++;
    console.log(`Processing ${task.url} with API key ${task.apiKey.substring(0, 10)}...`);

    try {
      // Use the specific API key for this task
      const result = await extractContactWithWiza(task.url, task.apiKey);
      
      this.results.set(task.url, result);
      this.completed++;
      console.log(`Completed ${task.url}: ${result.success ? 'success' : 'failed'}`);

      // Report progress
      if (this.options.onProgress) {
        this.options.onProgress(this.completed, this.tasks.length);
      }

      // Report task completion
      if (this.options.onTaskComplete) {
        this.options.onTaskComplete(task.url, result, task.index);
      }

      // Update API key credits if extraction failed due to credits
      if (!result.success && result.error?.includes('credits')) {
        const apiKeyPool = getApiKeyPool();
        apiKeyPool?.markKeyUnavailable(task.apiKey);
      }

    } catch (error) {
      console.error(`Failed to process ${task.url}:`, error);
      this.results.set(task.url, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.completed++;

      if (this.options.onProgress) {
        this.options.onProgress(this.completed, this.tasks.length);
      }
    } finally {
      this.running--;
    }
  }

  // Get current status
  getStatus() {
    return {
      total: this.tasks.length,
      completed: this.completed,
      running: this.running,
      pending: this.tasks.length - this.completed - this.running
    };
  }
}

// Utility function for easy parallel extraction
export async function extractContactsInParallel(
  urls: string[],
  options?: Partial<ExtractionQueueOptions>
): Promise<ExtractionResult[]> {
  const apiKeyPool = getApiKeyPool();
  const availableKeys = apiKeyPool?.getAvailableKeysCount() || 1;
  console.log(`Starting parallel extraction with ${availableKeys} available API keys`);
  
  const queue = new ParallelExtractionQueue({
    maxConcurrent: availableKeys,
    ...options
  });

  queue.addUrls(urls);
  const resultsMap = await queue.processAll();

  // Return results in the same order as input URLs
  return urls.map(url => resultsMap.get(url) || {
    success: false,
    error: 'Failed to process URL'
  });
} 