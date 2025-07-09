# LinkedIn Contact Extractor - Subscription Version Deployment Guide

This guide will help you deploy the credit-based subscription version with TRC-20 payment integration.

## Prerequisites

1. Node.js 18+ installed
2. Vercel account (or other hosting provider)
3. Supabase account (or PostgreSQL database)
4. TRON wallet for receiving payments
5. TronGrid API key (optional, for better performance)
6. Domain/subdomain for your deployment

## Step 1: Database Setup

### Using Supabase:

1. Create a new Supabase project
2. Go to SQL Editor and run the schema from `subscription-schema.sql`
3. Copy your project URL and API keys

### Using PostgreSQL:

1. Create a new database
2. Run the schema from `subscription-schema.sql`
3. Update connection strings in your environment variables

## Step 2: Configure TRON Wallet

1. **Create/Use a TRON wallet address** for receiving USDT payments
   - You can use TronLink: https://www.tronlink.org/
   - Or any other TRON wallet that supports TRC-20 tokens

2. **Get TronGrid API Key** (optional but recommended):
   - Sign up at https://www.trongrid.io/
   - Create a new project and get your API key
   - This provides better performance and higher rate limits

## Step 3: Environment Configuration

1. Copy `.env.subscription.example` to `.env.local`
2. Fill in all required values:

```env
# Wiza API Configuration
WIZA_API_KEY=your_wiza_api_key_here
WIZA_BASE_URL=https://wiza.co

# Database Configuration
DATABASE_URL=your_database_url_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# TRON/TRC-20 Configuration
NEXT_PUBLIC_TRON_NETWORK=mainnet # Use 'testnet' for testing
NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS=your_tron_wallet_address_here
TRON_API_KEY=your_trongrid_api_key_here # Optional
NEXT_PUBLIC_USDT_CONTRACT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t # USDT on mainnet

# Payment Configuration
NEXT_PUBLIC_CREDITS_PER_USDT=10 # 1 credit = $0.10 USDT
NEXT_PUBLIC_MIN_PURCHASE_USDT=10
NEXT_PUBLIC_CREDITS_PER_EXTRACTION=1

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_here

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here

# Application Settings
NEXT_PUBLIC_USE_SIMULATION=false
NEXT_PUBLIC_SUBSCRIPTION_MODE=true

# Webhook Configuration (optional)
WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 4: Update Application Code

1. **Replace ContactExtractor component** in your pages:
   ```typescript
   // In your page component
   import ContactExtractorSubscription from '@/components/ContactExtractorSubscription';
   
   // Use the subscription version
   <ContactExtractorSubscription userId={user.id} />
   ```

2. **Update authentication** to return user IDs:
   ```typescript
   // Ensure your auth system provides user.id
   ```

## Step 5: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Step 6: Configure Custom Domain

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain/subdomain
3. Update DNS records as instructed

## Step 7: Test Payment Flow

### Testing on Testnet:

1. Set `NEXT_PUBLIC_TRON_NETWORK=testnet` in environment
2. Use Shasta testnet faucet for test TRX: https://www.trongrid.io/shasta
3. Get test USDT from testnet faucet
4. Test complete payment flow

### Production Checklist:

- [ ] Switch to `NEXT_PUBLIC_TRON_NETWORK=mainnet`
- [ ] Verify payment wallet address is correct
- [ ] Test with small amount first
- [ ] Monitor first few transactions

## Step 8: Payment Monitoring

### Manual Verification:

1. Check transactions on Tronscan: https://tronscan.org/
2. Monitor your wallet for incoming USDT payments
3. Verify credits are added after confirmations

### Automated Webhook (Optional):

You can set up a monitoring service to call your webhook endpoint:
```
POST /api/payment/webhook
{
  "transactionHash": "xxx"
}
```

## Security Considerations

1. **Never expose private keys** in your code or environment variables
2. **Use HTTPS only** for production
3. **Implement rate limiting** on API endpoints
4. **Monitor for suspicious activity**
5. **Regular backups** of your database
6. **Consider implementing 2FA** for admin accounts

## Pricing & ROI Model

### Cost Breakdown:
- **Wiza API Cost**: $0.0315 per extraction (7 credits at $0.0045 each)
- **Our Price**: $0.10 per extraction (1 credit)
- **ROI**: 3x markup (~217% profit margin)

### Subscription Plans:
| Plan | Total Credits | Price | Effective Cost/Credit |
|------|---------------|-------|----------------------|
| Starter | 100 | $10 | $0.10 |
| Basic | 550 | $45 | $0.082 (18% discount) |
| Professional | 1,200 | $80 | $0.067 (33% discount) |
| Enterprise | 6,500 | $350 | $0.054 (46% discount) |

To adjust pricing:
- `NEXT_PUBLIC_CREDITS_PER_USDT`: Default is 10 (1 credit = $0.10)
- Modify subscription plans in the database for different packages

### Profit Calculation Example:
- User purchases Professional plan: $80 for 1,200 credits
- Your cost: 1,200 × $0.0315 = $37.80
- Your profit: $80 - $37.80 = $42.20 (52.75% profit margin)

## Troubleshooting

### Payment not confirming:
- Check transaction on Tronscan
- Verify wallet addresses match
- Ensure minimum confirmations (19) are reached
- Check webhook logs in database

### Credits not adding:
- Verify payment status in database
- Check credit_transactions table
- Review API logs for errors

### TronLink connection issues:
- Ensure user has TronLink installed
- Check network matches (mainnet/testnet)
- Try manual payment option

## Support

For issues specific to:
- **Wiza API**: Contact Wiza support
- **TRON/TRC-20**: Check TRON documentation
- **Deployment**: Check Vercel documentation
- **Database**: Check Supabase/PostgreSQL documentation

## Next Steps

1. Set up monitoring and analytics
2. Implement admin dashboard for managing users/credits
3. Add more payment options (other cryptocurrencies)
4. Implement referral system
5. Add usage analytics and reporting 