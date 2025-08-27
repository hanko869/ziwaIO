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
  private taskQueue: ExtractionTask[] = [];
  private activePromises: Set<Promise<void>> = new Set();

  constructor(options: ExtractionQueueOptions) {
    this.options = {
      delayBetweenBatches: 0, // No delay by default for faster processing
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

  // Process all tasks with continuous queue execution
  async processAll(): Promise<Map<string, ExtractionResult>> {
    console.log(`🚀 Processing ${this.tasks.length} URLs with continuous queue (max ${this.options.maxConcurrent} concurrent)`);
    
    // Log API key distribution
    const keyDistribution = new Map<string, number>();
    this.tasks.forEach(task => {
      const keyId = task.apiKey.substring(0, 10) + '...';
      keyDistribution.set(keyId, (keyDistribution.get(keyId) || 0) + 1);
    });
    console.log('API Key Distribution:', Array.from(keyDistribution.entries()));
    
    // Initialize task queue
    this.taskQueue = [...this.tasks];
    const startTime = Date.now();
    
    // Start initial concurrent tasks
    while (this.running < this.options.maxConcurrent && this.taskQueue.length > 0) {
      this.startNextTask();
    }
    
    // Wait for all tasks to complete
    while (this.activePromises.size > 0) {
      await Promise.race(this.activePromises);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Completed all ${this.tasks.length} URLs in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`📊 Average time per URL: ${(totalTime / this.tasks.length).toFixed(0)}ms`);
    console.log(`📈 Processing rate: ${(this.tasks.length / (totalTime / 1000)).toFixed(2)} URLs/second`);

    return this.results;
  }
  
  // Start the next task from the queue
  private startNextTask() {
    if (this.taskQueue.length === 0 || this.running >= this.options.maxConcurrent) {
      return;
    }
    
    const task = this.taskQueue.shift()!;
    const promise = this.processTaskContinuous(task);
    this.activePromises.add(promise);
    
    promise.finally(() => {
      this.activePromises.delete(promise);
      // Start next task when one completes
      this.startNextTask();
    });
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
    console.log(`\n=== STARTING NEW BATCH ===`);
    console.log(`Processing batch of ${batch.length} tasks in parallel`);
    console.log(`All tasks will start simultaneously using different API keys`);
    const startTime = Date.now();
    const promises = batch.map(task => this.processTask(task));
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    console.log(`Batch completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  }

  // Process individual task for continuous queue
  private async processTaskContinuous(task: ExtractionTask): Promise<void> {
    this.running++;
    const startTime = Date.now();

    try {
      // Use the specific API key for this task
      let result = await extractContactWithWiza(task.url, task.apiKey);
      
      // If failed due to billing/credits, try with another API key
      if (!result.success && (result.error?.includes('credits') || result.error?.includes('billing') || result.error?.includes('Service temporarily unavailable'))) {
        const apiKeyPool = getApiKeyPool();
        apiKeyPool?.markKeyUnavailable(task.apiKey);
        
        // Try multiple times with different API keys
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries && !result.success) {
          const newApiKey = apiKeyPool?.getNextKey();
          if (!newApiKey || newApiKey === task.apiKey) {
            break; // No more keys available
          }
          
          console.log(`Retry ${retryCount + 1} with different API key for ${task.url}`);
          result = await extractContactWithWiza(task.url, newApiKey);
          
          // If this also fails with billing, mark it too
          if (!result.success && (result.error?.includes('credits') || result.error?.includes('billing') || result.error?.includes('Service temporarily unavailable'))) {
            apiKeyPool?.markKeyUnavailable(newApiKey);
          }
          
          retryCount++;
        }
      }
      
      this.results.set(task.url, result);
      this.completed++;
      
      const duration = Date.now() - startTime;
      if (this.completed % 10 === 0) { // Log every 10 completions
        console.log(`📊 Progress: ${this.completed}/${this.tasks.length} (${((this.completed / this.tasks.length) * 100).toFixed(1)}%) - Last 10 avg: ${duration}ms`);
      }

      // Report progress
      if (this.options.onProgress) {
        this.options.onProgress(this.completed, this.tasks.length);
      }

      // Report task completion
      if (this.options.onTaskComplete) {
        this.options.onTaskComplete(task.url, result, task.index);
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
  
  // Reset all keys availability at the start of each batch extraction
  // This ensures keys that were temporarily marked unavailable get another chance
  apiKeyPool?.resetAllKeysAvailability();
  
  const availableKeys = apiKeyPool?.getAvailableKeysCount() || 1;
  console.log(`🔑 Starting parallel extraction with ${availableKeys} available API keys`);
  
  // Log current API key usage stats
  const keyStats = apiKeyPool?.getAllKeysStatus();
  console.log('API Key Usage Before Extraction:', keyStats);
  
  // Optimize concurrency based on number of API keys and environment
  // Production environments may have different limits than local
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const baseMultiplier = isProduction ? 5 : 10; // More conservative in production
  const maxConcurrent = isProduction ? 50 : 100; // Lower cap for production stability
  
  const optimalConcurrency = Math.min(availableKeys * baseMultiplier, maxConcurrent);
  console.log(`⚡ Parallel Extraction Configuration:`);
  console.log(`  - Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  - VERCEL_ENV: ${process.env.VERCEL_ENV || 'not set'}`);
  console.log(`  - Available API Keys: ${availableKeys}`);
  console.log(`  - Base Multiplier: ${baseMultiplier}x per key`);
  console.log(`  - Max Concurrent Limit: ${maxConcurrent}`);
  console.log(`  - Calculated Concurrency: ${optimalConcurrency} parallel requests`);
  
  const queue = new ParallelExtractionQueue({
    maxConcurrent: optimalConcurrency,
    ...options
  });

  queue.addUrls(urls);
  const resultsMap = await queue.processAll();
  
  // Log API key usage after extraction
  const keyStatsAfter = apiKeyPool?.getAllKeysStatus();
  console.log('API Key Usage After Extraction:', keyStatsAfter);

  // Return results in the same order as input URLs
  return urls.map(url => resultsMap.get(url) || {
    success: false,
    error: 'Failed to process URL'
  });
} 