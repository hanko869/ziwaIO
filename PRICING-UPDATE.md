# 💰 Updated Pricing Structure

## 🎯 **New Pricing (Effective Immediately)**

### 📱 **Phone Number Cost:**
- **Target Price:** $0.0245 per phone number  
- **Credits Required:** 1 credit per phone
- **Actual Cost:** $0.0244 per phone (rounded)

### 📧 **Email Cost:**
- **Price:** FREE (0 credits charged)  
- **Credits Required:** 1 credit per email (but currently 0 charged)

## 🏦 **Credit System:**

### 💳 **Purchase Rates:**
- **41 credits = 1 USDT**
- **Minimum deposit:** 10 USDT = 410 credits

### 🧮 **Calculation:**
```
1 USDT ÷ 41 credits = $0.0244 per credit
1 phone = 1 credit = $0.0244
```

## 📊 **Cost Examples:**

| Extraction Result | Credits | Cost (USDT) | Cost (USD) |
|-------------------|---------|-------------|------------|
| 1 phone only | 1 credit | $0.0244 | ~2.4¢ |
| 2 phones | 2 credits | $0.0488 | ~4.9¢ |
| 1 email + 1 phone | 1 credit | $0.0244 | ~2.4¢ |
| 10 phones | 10 credits | $0.244 | ~24¢ |

## 🎉 **Benefits:**
- ✅ **63% cheaper** than before ($0.067 → $0.0244)
- ✅ **More competitive** pricing  
- ✅ **Better value** for customers
- ✅ **Email extraction still FREE**

## ⚙️ **Environment Variables:**
```
NEXT_PUBLIC_CREDITS_PER_EMAIL=1
NEXT_PUBLIC_CREDITS_PER_PHONE=1
NEXT_PUBLIC_CREDITS_PER_USDT=41
NEXT_PUBLIC_MIN_DEPOSIT_USDT=10
```

## 🚀 **Deployment:**
Update these environment variables in Vercel and redeploy to activate the new pricing.