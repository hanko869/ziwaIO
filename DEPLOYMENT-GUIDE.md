# Production Deployment Guide for ziwa.club

## Pre-deployment Checklist

### 1. NOWPayments Configuration
Before deploying, you need to configure NOWPayments for production:

1. **Login to NOWPayments Production Dashboard:**
   - Go to https://account.nowpayments.io/
   - Login with your production account

2. **Configure Webhook URL:**
   - Navigate to Settings > IPN Callbacks
   - Set webhook URL to: `https://ziwa.club/api/payment/webhook`
   - Enable IPN callbacks

3. **Get Production API Key:**
   - Go to API Keys section
   - Copy your production API key (replace in environment variables)

### 2. Vercel Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin master
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Set custom domain: `ziwa.club`

3. **Configure Environment Variables in Vercel:**
   Copy all variables from `.env.production.template` to Vercel:

   **Navigate to:** Project Settings > Environment Variables

   **Add these variables:**
   ```
   WIZA_API_KEY=4249c7c993b20a9e408907a2d4919b1a306421db0003e7c2e2396636260a8d37
   WIZA_API_KEY_2=d6a95e0de384f41d255cdb61f660e5dfb95b3a5d8c2f5b043330add34a563e22
   WIZA_API_KEY_3=c53e9aa809ad8fa3bcbb339c60a56a277c66a077c7e067cab37bde5727718ee3
   WIZA_API_KEY_4=83802863c67d0923b08cd7fb50368c17607ee2babb01f10243c4174690f979a6
   WIZA_API_KEY_5=2b22f92b298d87be04e790ee5f9516b7852502069dea43deb0377fa5c298f56e
   WIZA_API_KEY_6=a5dc435a546d22dfbf0f911d4085d310c33624a24393b405ed9eb14151fbfd8e
   WIZA_API_KEY_7=ff54410056891a99b7400dc3eaba31095d4a82d88e3ca5ad47c39b62263f4133
   WIZA_API_KEY_8=bc0d7260e3bafd8016d0a4710730ea2f2a523ee5611dbafa0945bfc158abb05f
   WIZA_API_KEY_9=0bde3d4c075aa64cf702baeccdf27653fa464b896af61f2aef066301d114aa92
   WIZA_API_KEY_10=0d562201f2a64b5b0a3099656fa8e4616139de746f8a830044c30cbb5dbe1fb7
   
   NEXT_PUBLIC_SUPABASE_URL=https://sibbtfeuyodfgymttdaq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmJ0ZmV1eW9kZmd5bXR0ZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc2MzYsImV4cCI6MjA3MjcwMzYzNn0.KOnNHM6t34LYQEPDRU1-6n9x3pI4LX9xNJE74zmiY6w
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmJ0ZmV1eW9kZmd5bXR0ZGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEyNzYzNiwiZXhwIjoyMDcyNzAzNjM2fQ.aaMWPZy4DSLUa6eiGXfSO3h_m-hoJj2bBz_LE3Ol1WE
   
   NOWPAYMENTS_API_KEY=G9052FJ-3QSMPJX-MQK4T07-9DQ246W
   NOWPAYMENTS_IPN_SECRET=nONfOfcuYhZ4K0sjf0azTgKzdOiLTjaZ
   NOWPAYMENTS_SANDBOX=false
   
   NODE_ENV=production
   JWT_SECRET=supersecretjwtkey123456789abcdefghijklmnopqrstuvwxyz
   
   NEXT_PUBLIC_CREDITS_PER_EMAIL=1
   NEXT_PUBLIC_CREDITS_PER_PHONE=2
   NEXT_PUBLIC_CREDITS_PER_USDT=81
   NEXT_PUBLIC_MIN_DEPOSIT_USDT=10
   
   ADMIN_USERNAME=rag26
   ADMIN_PASSWORD=Qq221122?@
   ```

## Testing the Payment System

### 1. Test User Flow
1. Create a test user account on ziwa.club
2. Login and navigate to the dashboard
3. Click "Deposit Credits"
4. Try a small amount first (10 USDT minimum)

### 2. Payment Testing Steps
1. **Initiate Payment:**
   - Enter amount (e.g., 10 USDT)
   - Click "Proceed to Payment"
   - Should redirect to NOWPayments or show payment details

2. **Complete Payment:**
   - Send the exact amount to the provided address
   - Wait for blockchain confirmation (usually 5-15 minutes for USDT TRC-20)

3. **Verify Webhook:**
   - Check Vercel function logs for webhook calls
   - Verify credits are added to user account
   - Test contact extraction with new credits

### 3. Monitoring and Logs

**Vercel Function Logs:**
- Go to Vercel Dashboard > Functions tab
- Monitor `/api/payment/webhook` function for incoming webhooks
- Check for any errors in payment processing

**NOWPayments Dashboard:**
- Monitor payments in real-time
- Check webhook delivery status
- Verify payment statuses

### 4. Common Issues and Solutions

**Webhook Not Received:**
- Check NOWPayments webhook URL configuration
- Verify Vercel function is deployed and accessible
- Check webhook signature validation

**Credits Not Added:**
- Check Supabase connection
- Verify user ID in payment order
- Check webhook payload processing

**Payment Stuck:**
- Check blockchain confirmation status
- Verify correct network (TRC-20 for USDT)
- Check NOWPayments payment status

## Security Considerations

1. **Environment Variables:**
   - Never commit production keys to git
   - Use Vercel environment variables for sensitive data

2. **Webhook Security:**
   - IPN signature validation is implemented
   - Webhook endpoint validates payment amounts

3. **Database Security:**
   - Supabase RLS policies are in place
   - Service role key is used server-side only

## Post-Deployment Checklist

- [ ] Domain configured and SSL active
- [ ] All environment variables set
- [ ] NOWPayments webhook URL configured
- [ ] Test payment completed successfully
- [ ] Webhook processing verified
- [ ] Credits added to test account
- [ ] Contact extraction working with credits
- [ ] Admin dashboard accessible