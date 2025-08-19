# Email to NOWPayments Support

**To:** support@nowpayments.io  
**Subject:** Critical Issue: Merchant Paying Transaction Fees Despite Configuration - Multiple Failed Attempts to Fix

Dear NOWPayments Support Team,

I am experiencing a critical issue with the payment integration where I (the merchant) am being charged transaction fees instead of my customers, despite multiple attempts to configure the system correctly. This is causing significant financial losses for my business.

## Account Details
- **API Environment:** Production (live payments with real funds)
- **API Key:** G9052FJ-3QSMPJX-MQK4T07-9DQ246W
- **Integration Type:** API-based payment and invoice creation

## The Problem

When customers make payments, the transaction fees are being deducted from the merchant payout instead of being added to the customer's payment amount. 

**Example Transaction:**
- Payment ID: 5392565820
- Customer was supposed to pay: 15 USD
- Customer actually paid: 16.478 USDT
- Outcome (what I receive): 12.699089 USDT
- Network fee: 3.715096 USDT
- Service fee: 0.063815 USDT

As you can see, the customer only paid ~1 USD extra while I'm absorbing ~3.78 USD in fees.

## Steps We've Tried (All Failed)

### 1. Initial Implementation with `/payment` API
```json
{
  "price_amount": 15,
  "price_currency": "usd",
  "pay_currency": "usdttrc20",
  "is_fee_paid_by_user": true
}
```
**Result:** Error - "is_fee_paid_by_user is not allowed"

### 2. Tried `/invoice` API with fee configuration
```json
{
  "price_amount": 15,
  "price_currency": "usd",
  "is_fee_paid_by_user": true,
  "fixed_rate": true
}
```
**Result:** Error - "fixed_rate is not allowed"

### 3. Switched to `/invoice-payment` API
```json
{
  "iid": "invoice_id",
  "pay_currency": "usdttrc20",
  "is_fee_paid_by_user": true
}
```
**Result:** Error - "iid is required" (even though it was provided)

### 4. Tried manual fee calculation (20% markup)
- Added 20% to the invoice amount to cover fees
- Customer would pay 18 USD instead of 15 USD
**Result:** This worked partially but:
  - Confused customers with the markup
  - Still resulted in "partially_paid" status due to USD/USDT conversion rates
  - Not a sustainable solution

### 5. Current Implementation (Two-step process)
- First create payment with `/payment` endpoint
- Then create invoice with `/invoice` endpoint to get hosted checkout URL
**Result:** Works for payment flow but fees still charged to merchant

## Additional Issues

1. **Partially Paid Status:** Even when customers pay the correct amount, payments often show as "partially_paid" due to minor USD/USDT conversion differences
2. **Inconsistent API behavior:** The same parameters work differently across different endpoints
3. **Documentation mismatch:** The documented parameters like `is_fee_paid_by_user` don't work as described

## What We Need

1. **Clear guidance on how to configure payments so customers pay all fees**
2. **Explanation of why `is_fee_paid_by_user` parameter doesn't work**
3. **Solution for the "partially_paid" issue when amounts are within reasonable tolerance (e.g., 95-105%)**
4. **Consistent API behavior across all endpoints**

## Business Impact

This issue is causing significant financial losses as we're absorbing 20-25% in transaction fees on every payment. For a 15 USD payment, we're only receiving ~12.70 USD, making our business model unsustainable.

Please provide urgent assistance as this is blocking our payment processing and causing customer confusion.

Thank you for your immediate attention to this matter.

Best regards,
[Your Name]
[Your Company]
[Contact Information]

## Attachments
- Full API request/response logs for all attempted configurations
- Transaction details showing fee deductions
- Screenshots of payment details showing the fee structure
