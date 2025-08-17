# Parallel Extraction with Multiple API Keys

This feature allows you to use multiple Wiza API keys to extract contacts in parallel, significantly speeding up bulk extraction operations.

## How It Works

When you upload a file with multiple LinkedIn URLs, the system will:
1. Distribute the URLs across all available API keys
2. Process multiple extractions simultaneously
3. Automatically handle API key rotation and load balancing
4. Fall back to sequential processing if needed

## Configuration

### Adding API Keys

In your `.env.local` or environment variables, add your API keys:

```env
# Primary API Key
WIZA_API_KEY=your-first-api-key

# Additional API Keys
WIZA_API_KEY_2=your-second-api-key
WIZA_API_KEY_3=your-third-api-key
WIZA_API_KEY_4=your-fourth-api-key
# ... up to WIZA_API_KEY_10
```

### Performance Improvements

- **1 API Key**: Process URLs sequentially (baseline speed)
- **2 API Keys**: Up to 2x faster extraction
- **3 API Keys**: Up to 3x faster extraction
- **4+ API Keys**: Diminishing returns due to rate limits

## Admin Dashboard

Admins can monitor API key status in the dashboard:
1. Navigate to Admin Dashboard
2. Click on "API Keys" tab
3. View credits and availability for each key
4. Click "Refresh Status" to update

## Best Practices

1. **API Key Rotation**: The system automatically rotates between keys using round-robin
2. **Credit Management**: Keys with 0 credits are automatically marked unavailable
3. **Error Handling**: If a key fails, the system continues with other available keys
4. **Rate Limiting**: Built-in delays prevent hitting API rate limits

## Example Speed Improvements

For 500 LinkedIn URLs:
- **Single API Key**: ~17 minutes (2 seconds per URL)
- **Two API Keys**: ~8.5 minutes (2x faster)
- **Three API Keys**: ~6 minutes (3x faster)

## Troubleshooting

### API Keys Not Working
- Check that keys are valid in Wiza dashboard
- Ensure keys have sufficient credits
- Verify environment variables are loaded correctly

### Slow Performance
- Check API key status in admin dashboard
- Some keys may be out of credits
- Network latency can affect performance

### Fallback to Sequential
If parallel extraction fails, the system automatically falls back to sequential processing with the primary API key. 