# Deployment Guide

This guide covers deploying the LinkedIn Contact Extractor to production using Vercel and Supabase.

## Prerequisites

- GitHub account with repository access
- Vercel account
- Supabase account
- NOWPayments account (for payment processing)
- Wiza API account with active API keys

## Step 1: Supabase Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Save your project URL and service role key

2. **Run database migrations**
   ```sql
   -- Run all SQL commands from README.md Database Setup section
   ```

3. **Configure Row Level Security (optional but recommended)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
   ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE extracted_contacts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
   ```

## Step 2: NOWPayments Setup

1. **Create NOWPayments account**
   - Sign up at [nowpayments.io](https://nowpayments.io)
   - Complete KYC verification for production use

2. **Configure payment settings**
   - Add USDT (TRC20) as accepted currency
   - Set up IPN (Instant Payment Notification) webhook
   - Generate API key and IPN secret

3. **Important settings**
   - Minimum payment amount: $10
   - Enable partial payments
   - Set callback URLs to your domain

## Step 3: Vercel Deployment

1. **Import repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub: `https://github.com/hanko869/ziwapro2`

2. **Configure environment variables in Vercel**
   ```
   # Wiza API Keys
   WIZA_API_KEY=your_primary_key
   WIZA_API_KEY_2=your_second_key
   WIZA_API_KEY_3=your_third_key

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # NOWPayments
   NOWPAYMENTS_API_KEY=your_api_key
   NOWPAYMENTS_IPN_SECRET=your_ipn_secret
   NOWPAYMENTS_SANDBOX=false

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_secure_jwt_secret

   # Credit System
   NEXT_PUBLIC_CREDITS_PER_EMAIL=1
   NEXT_PUBLIC_CREDITS_PER_PHONE=2
   NEXT_PUBLIC_CREDITS_PER_USDT=30
   NEXT_PUBLIC_MIN_DEPOSIT_USDT=10

   # Admin Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Note your deployment URL

## Step 4: Post-Deployment Configuration

1. **Update NOWPayments webhooks**
   - Set IPN callback URL to: `https://your-domain.vercel.app/api/payment/webhook`
   - Set success URL to: `https://your-domain.vercel.app/?payment=success`
   - Set cancel URL to: `https://your-domain.vercel.app/?payment=cancelled`

2. **Create admin user**
   - Navigate to `https://your-domain.vercel.app/login`
   - Login with ADMIN_USERNAME and ADMIN_PASSWORD
   - Access admin panel at `https://your-domain.vercel.app/admin`

3. **Test the system**
   - Create a test user account
   - Make a small test deposit
   - Try extracting a LinkedIn profile
   - Verify credits are deducted correctly

## Step 5: Custom Domain (Optional)

1. **Add custom domain in Vercel**
   - Go to project settings
   - Add your domain
   - Update DNS records as instructed

2. **Update environment variables**
   - Update any URLs that reference your domain

## Monitoring & Maintenance

### Daily Checks
- Monitor Wiza API credit balance
- Check NOWPayments for any stuck transactions
- Review admin activity logs

### Weekly Tasks
- Backup Supabase database
- Review user credit balances
- Check for any failed extractions

### Monthly Tasks
- Analyze usage patterns
- Review and optimize API key usage
- Update pricing if needed

## Troubleshooting

### Common Issues

1. **Payments not crediting**
   - Check NOWPayments dashboard for payment status
   - Verify webhook is receiving requests
   - Check payment_transactions table in Supabase
   - Look for "partially_paid" status issues

2. **Extraction failures**
   - Verify Wiza API keys are active
   - Check API credit balance
   - Review error logs in browser console
   - Ensure LinkedIn URLs are valid

3. **Login issues**
   - Verify JWT_SECRET is set correctly
   - Check users table in Supabase
   - Clear browser cookies and try again

### Debug Mode

Add these to your .env for enhanced debugging:
```
NODE_ENV=development
DEBUG=true
```

### Support Contacts

- **Wiza API Support**: support@wiza.co
- **NOWPayments Support**: support@nowpayments.io
- **Supabase Support**: support@supabase.io

## Security Considerations

1. **API Keys**
   - Rotate API keys regularly
   - Never commit keys to version control
   - Use different keys for development/production

2. **Database**
   - Enable Row Level Security
   - Regular backups
   - Monitor for unusual activity

3. **Payments**
   - Verify all webhook requests
   - Log all payment attempts
   - Monitor for fraud patterns

## Scaling Considerations

### When to scale
- Extraction queue regularly exceeds 100 URLs
- API rate limits being hit frequently
- Database queries becoming slow

### How to scale
1. **Add more Wiza API keys** (up to 3 supported currently)
2. **Upgrade Supabase plan** for better performance
3. **Implement caching** for frequently accessed data
4. **Use Vercel Edge Functions** for global performance

## Backup & Recovery

### Database Backup
```bash
# Manual backup via Supabase dashboard
# Or use Supabase CLI
supabase db dump > backup.sql
```

### Recovery Process
1. Restore database from backup
2. Verify all tables are intact
3. Check credit balances match last known state
4. Resume operations

## Cost Optimization

### Reduce costs by:
1. **Batch processing** - Encourage users to upload bulk files
2. **Caching results** - Avoid re-extracting same profiles
3. **Off-peak processing** - Schedule large jobs during off-peak hours
4. **Monitor API usage** - Set alerts for unusual spikes

Remember to regularly review logs and user feedback to maintain optimal performance!
