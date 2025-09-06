// Global progress store that persists across serverless function invocations
// Uses global to ensure persistence in Next.js dev mode

interface ProgressData {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  started: number;
  lastUpdate: number;
  status: 'in_progress' | 'completed' | 'failed' | 'pending';
}

class ProgressStore {
  private store: Map<string, ProgressData>;
  
  constructor() {
    this.store = new Map();
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

// Use global to persist across module reloads in development
declare global {
  var _progressStore: ProgressStore | undefined;
}

// Create or reuse the global instance
if (!global._progressStore) {
  global._progressStore = new ProgressStore();
}

// Export the global instance
export const progressStore = global._progressStore;

// Also export the type for use in other files
export type { ProgressData };
