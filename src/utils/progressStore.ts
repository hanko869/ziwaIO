// Global progress store that persists across serverless function invocations
// This uses a singleton pattern to ensure the same instance is used

interface ProgressData {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  lastUpdate: number;
  status: 'in_progress' | 'completed' | 'failed' | 'pending';
}

class ProgressStore {
  private static instance: ProgressStore;
  private store: Map<string, ProgressData>;
  
  private constructor() {
    this.store = new Map();
  }
  
  static getInstance(): ProgressStore {
    if (!ProgressStore.instance) {
      ProgressStore.instance = new ProgressStore();
    }
    return ProgressStore.instance;
  }
  
  set(id: string, data: ProgressData): void {
    this.store.set(id, data);
  }
  
  get(id: string): ProgressData | undefined {
    return this.store.get(id);
  }
  
  delete(id: string): boolean {
    return this.store.delete(id);
  }
  
  entries(): IterableIterator<[string, ProgressData]> {
    return this.store.entries();
  }
  
  cleanupOld(maxAgeMs: number = 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, progress] of this.store.entries()) {
      if (progress.lastUpdate < cutoff) {
        this.store.delete(id);
      }
    }
  }
}

// Export a singleton instance
export const progressStore = ProgressStore.getInstance();

// Also export the type for use in other files
export type { ProgressData };
