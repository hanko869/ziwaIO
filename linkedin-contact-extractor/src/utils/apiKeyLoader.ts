import { initializeApiKeyPool } from './apiKeyPool';

// Load API keys from environment variables
export function loadApiKeys(): string[] {
  const keys: string[] = [];
  
  // Primary API key
  if (process.env.WIZA_API_KEY) {
    keys.push(process.env.WIZA_API_KEY);
  }
  
  // Additional API keys (support up to 10 keys)
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`WIZA_API_KEY_${i}`];
    if (key && key !== 'your-second-wiza-api-key' && key !== 'your-third-wiza-api-key') {
      keys.push(key);
    }
  }
  
  // If no keys found, use the default hardcoded one (for backward compatibility)
  if (keys.length === 0) {
    keys.push('c951d1f0b91ab7e5afe187fa747f3668524ad5e2eba2c68a912654b43682cab8');
  }
  
  console.log(`Loaded ${keys.length} Wiza API key(s)`);
  return keys;
}

// Initialize the API key pool with loaded keys
export function initializeApiKeys() {
  const keys = loadApiKeys();
  return initializeApiKeyPool(keys);
} 