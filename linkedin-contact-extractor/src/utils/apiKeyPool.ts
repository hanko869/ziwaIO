// API Key Pool Manager for load balancing multiple Wiza API keys
export class ApiKeyPool {
  private keys: string[];
  private currentIndex: number = 0;
  private keyUsage: Map<string, { count: number; lastUsed: number }>;
  private keyStatus: Map<string, { available: boolean; credits: any }>;

  constructor(keys: string[]) {
    this.keys = keys;
    this.keyUsage = new Map();
    this.keyStatus = new Map();
    
    // Initialize usage tracking
    keys.forEach(key => {
      this.keyUsage.set(key, { count: 0, lastUsed: 0 });
      this.keyStatus.set(key, { available: true, credits: null });
    });
  }

  // Get next available API key using round-robin
  getNextKey(): string | null {
    const startIndex = this.currentIndex;
    
    do {
      const key = this.keys[this.currentIndex];
      const status = this.keyStatus.get(key);
      
      if (status?.available) {
        // Update usage
        const usage = this.keyUsage.get(key)!;
        usage.count++;
        usage.lastUsed = Date.now();
        
        // Move to next index for next call
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        
        return key;
      }
      
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    } while (this.currentIndex !== startIndex);
    
    // No available keys
    return null;
  }

  // Get least recently used key
  getLeastUsedKey(): string | null {
    let selectedKey: string | null = null;
    let minUsage = Infinity;
    
    for (const [key, status] of this.keyStatus.entries()) {
      if (status.available) {
        const usage = this.keyUsage.get(key)!;
        if (usage.count < minUsage) {
          minUsage = usage.count;
          selectedKey = key;
        }
      }
    }
    
    if (selectedKey) {
      const usage = this.keyUsage.get(selectedKey)!;
      usage.count++;
      usage.lastUsed = Date.now();
    }
    
    return selectedKey;
  }

  // Mark a key as unavailable (e.g., out of credits)
  markKeyUnavailable(key: string) {
    const status = this.keyStatus.get(key);
    if (status) {
      status.available = false;
    }
  }

  // Update key credits information
  updateKeyCredits(key: string, credits: any) {
    const status = this.keyStatus.get(key);
    if (status) {
      status.credits = credits;
      
      // Check if key should be marked unavailable based on credits
      if (credits?.credits?.api_credits === 0) {
        status.available = false;
      }
    }
  }

  // Get all keys with their status
  getAllKeysStatus() {
    return Array.from(this.keyStatus.entries()).map(([key, status]) => ({
      key: key.substring(0, 10) + '...', // Show partial key for security
      available: status.available,
      credits: status.credits,
      usage: this.keyUsage.get(key)
    }));
  }

  // Get number of available keys
  getAvailableKeysCount(): number {
    return Array.from(this.keyStatus.values()).filter(s => s.available).length;
  }
}

// Singleton instance of API key pool
let apiKeyPoolInstance: ApiKeyPool | null = null;

export function initializeApiKeyPool(keys: string[]): ApiKeyPool {
  if (!apiKeyPoolInstance) {
    apiKeyPoolInstance = new ApiKeyPool(keys);
  }
  return apiKeyPoolInstance;
}

export function getApiKeyPool(): ApiKeyPool | null {
  return apiKeyPoolInstance;
} 