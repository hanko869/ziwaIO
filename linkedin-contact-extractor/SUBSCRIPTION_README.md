# LinkedIn Contact Extractor - Subscription Version

A credit-based subscription version of the LinkedIn Contact Extractor with TRC-20 (USDT) payment integration.

## Features

### Core Features
- ✅ Extract contact information from LinkedIn profiles
- ✅ Bulk extraction from .txt files (up to 500 URLs)
- ✅ Bilingual support (English/Chinese)
- ✅ Export contacts to CSV
- ✅ Location information display

### Subscription Features
- 💳 Credit-based system
- 💰 TRC-20 USDT payments
- 🔐 User authentication with JWT
- 📊 Credit balance tracking
- 💵 Multiple subscription plans
- 📈 Payment history
- 🌐 TronLink wallet integration

## Quick Start

1. **Run setup script:**
   ```bash
   node setup-subscription.js
   ```

2. **Set up database:**
   - For Supabase: Run `subscription-schema.sql` in SQL Editor
   - For PostgreSQL: `psql -d your_db -f subscription-schema.sql`

3. **Start development:**
   ```bash
   npm install
   npm run dev
   ```

## How It Works

### Credit System
- Users purchase credits using USDT (TRC-20)
- Each extraction consumes credits (default: 1 credit)
- Bulk extractions check credit balance before processing
- Real-time credit balance display

### Payment Flow
1. User selects a subscription plan
2. Pays with TronLink wallet or manual transfer
3. System verifies transaction on TRON blockchain
4. Credits are added after 19 confirmations
5. User can immediately use credits for extractions

## Subscription Plans

| Plan | Credits | Bonus | Total Credits | Price (USDT) | Cost per Extraction |
|------|---------|-------|---------------|--------------|---------------------|
| Starter | 100 | 0 | 100 | $10 | $0.10 |
| Basic | 500 | 50 (10%) | 550 | $45 | $0.082 |
| Professional | 1000 | 200 (20%) | 1,200 | $80 | $0.067 |
| Enterprise | 5000 | 1500 (30%) | 6,500 | $350 | $0.054 |

**Pricing Model**: 
- Base cost: 1 credit = $0.10 USDT
- Wiza API cost: $0.0315 per extraction
- ROI: 3x markup on API costs
- Volume discounts available through bonus credits

## Technology Stack

- **Frontend:** Next.js 15.3, React 19, TypeScript
- **Payment:** TronWeb, TRC-20 USDT
- **Database:** Supabase/PostgreSQL
- **Authentication:** JWT
- **Styling:** Tailwind CSS
- **API:** Wiza API for LinkedIn data

## File Structure

```
linkedin-contact-extractor/
├── src/
│   ├── components/
│   │   ├── ContactExtractorSubscription.tsx  # Main component with credits
│   │   └── PricingPlans.tsx                  # Subscription plans UI
│   ├── lib/
│   │   └── credits.ts                        # Credit management service
│   ├── utils/
│   │   └── tronweb.ts                        # TRC-20 payment utilities
│   ├── types/
│   │   └── subscription.ts                   # TypeScript types
│   └── app/
│       └── api/
│           ├── payment/webhook/              # Payment verification
│           └── contacts/                     # Contact management
├── subscription-schema.sql                    # Database schema
├── .env.subscription.example                  # Environment template
├── setup-subscription.js                      # Setup script
└── SUBSCRIPTION_DEPLOYMENT.md                 # Deployment guide
```

## Environment Variables

```env
# Core Configuration
WIZA_API_KEY=                    # Required: Wiza API key

# Database
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=       # Service role key

# TRON/Payment
NEXT_PUBLIC_TRON_NETWORK=        # mainnet or testnet
NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS= # Your TRON wallet
NEXT_PUBLIC_USDT_CONTRACT_ADDRESS=  # USDT contract

# Pricing
NEXT_PUBLIC_CREDITS_PER_USDT=10  # Credits per 1 USDT (1 credit = $0.10)
NEXT_PUBLIC_CREDITS_PER_EXTRACTION=1 # Credits per extraction
```

## Testing

### Testnet Testing
1. Set `NEXT_PUBLIC_TRON_NETWORK=testnet`
2. Get test TRX from [Shasta Faucet](https://www.trongrid.io/shasta)
3. Get test USDT from testnet faucet
4. Test complete payment flow

### Production Testing
1. Start with small amounts
2. Verify transactions on [Tronscan](https://tronscan.org/)
3. Monitor credit additions
4. Check payment history

## Security

- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ Environment variable protection
- ✅ Transaction verification
- ✅ Webhook authentication (optional)
- ✅ HTTPS only in production

## Deployment

See [SUBSCRIPTION_DEPLOYMENT.md](./SUBSCRIPTION_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Flinkedin-contact-extractor&env=WIZA_API_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS)

## API Endpoints

### Public Endpoints
- `POST /api/extract` - Extract LinkedIn contact (requires credits)
- `POST /api/payment/webhook` - Payment verification webhook

### Protected Endpoints
- `GET /api/contacts` - Get user's extracted contacts
- `POST /api/contacts` - Save extracted contact

## Troubleshooting

### Common Issues

**Credits not deducting:**
- Check database connection
- Verify user_credits table exists
- Check API error logs

**Payment not confirming:**
- Verify wallet addresses match
- Check transaction on Tronscan
- Ensure 19+ confirmations
- Review webhook logs

**TronLink not connecting:**
- User must have TronLink installed
- Check network matches (mainnet/testnet)
- Try manual payment option

## Support

- **Bugs:** Open an issue on GitHub
- **Questions:** Check deployment guide
- **Payment issues:** Verify on Tronscan first

## License

This is a commercial application. Please ensure you have:
- Valid Wiza API subscription
- Rights to extract LinkedIn data
- Compliance with LinkedIn ToS
- Proper data protection measures

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## Changelog

### Version 1.0.0
- Initial subscription version
- TRC-20 USDT payment integration
- Credit-based system
- Multi-language support
- Bulk extraction with credits 