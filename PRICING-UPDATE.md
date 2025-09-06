# 💰 Updated Pricing Structure

## 🎯 **New Pricing (Effective Immediately)**

### 📱 **Phone Number Cost:**
- **Target Price:** $0.0246 per phone number  
- **Credits Required:** 2 credits per phone
- **Actual Cost:** $0.0247 per phone

### 📧 **Email Cost:**
- **Price:** FREE (0 credits charged)  
- **Credits Required:** 1 credit per email (but currently 0 charged)

## 🏦 **Credit System:**

### 💳 **Purchase Rates:**
- **81 credits = 1 USDT**
- **Minimum deposit:** 10 USDT = 810 credits

### 🧮 **Calculation:**
```
1 USDT ÷ 81 credits = $0.01235 per credit
1 phone = 2 credits = $0.0247
```

## 📊 **Cost Examples:**

| Extraction Result | Credits | Cost (USDT) | Cost (USD) |
|-------------------|---------|-------------|------------|
| 1 phone only | 2 credits | $0.0247 | ~2.47¢ |
| 2 phones | 4 credits | $0.0494 | ~4.94¢ |
| 1 email + 1 phone | 2 credits | $0.0247 | ~2.47¢ |
| 10 phones | 20 credits | $0.247 | ~24.7¢ |

## 💰 **Deposit Examples:**

| Deposit Amount | Credits Received | Phone Extractions |
|----------------|------------------|-------------------|
| $10 USDT | 810 credits | 405 phones |
| $20 USDT | 1620 credits | 810 phones |
| $50 USDT | 4050 credits | 2025 phones |
| $100 USDT | 8100 credits | 4050 phones |

## 🎉 **Benefits:**
- ✅ **63% cheaper** than before ($0.067 → $0.0247)
- ✅ **More competitive** pricing  
- ✅ **Better value** for customers
- ✅ **Email extraction still FREE**

## ⚙️ **Environment Variables:**
```
NEXT_PUBLIC_CREDITS_PER_EMAIL=1
NEXT_PUBLIC_CREDITS_PER_PHONE=2
NEXT_PUBLIC_CREDITS_PER_USDT=81
NEXT_PUBLIC_MIN_DEPOSIT_USDT=10
```

## 🚀 **Deployment:**
Update these environment variables in Vercel and redeploy to activate the new pricing.