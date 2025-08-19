import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { creditService } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    
    // Get IPN secret from environment
    const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
    
    // Verify the signature if provided
    const signature = request.headers.get('x-nowpayments-sig');
    if (signature && IPN_SECRET) {
      const hmac = crypto.createHmac('sha512', IPN_SECRET);
      hmac.update(rawBody);
      const expectedSignature = hmac.digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Parse the webhook data
    const data = JSON.parse(rawBody);
    console.log('Webhook received:', data);
    
    // Check if payment is completed or partially paid
    // Accept payments that are within a reasonable tolerance
    let shouldProcessPayment = false;
    let paymentAcceptanceReason = '';
    
    if (data.payment_status === 'finished' || data.payment_status === 'confirmed') {
      shouldProcessPayment = true;
      paymentAcceptanceReason = 'Payment fully confirmed';
    } else if (data.payment_status === 'partially_paid' && data.actually_paid) {
      const requestedAmount = parseFloat(data.price_amount);
      const actuallyPaid = parseFloat(data.actually_paid);
      const difference = Math.abs(requestedAmount - actuallyPaid);
      const percentagePaid = (actuallyPaid / requestedAmount) * 100;
      
      // Accept if:
      // 1. Paid at least 99% of requested amount
      // 2. Difference is less than 0.01 USDT (rounding errors)
      // 3. Paid more than requested (overpayment)
      if (percentagePaid >= 99 || difference < 0.01 || actuallyPaid > requestedAmount) {
        shouldProcessPayment = true;
        paymentAcceptanceReason = `Partial payment accepted: paid ${actuallyPaid.toFixed(6)} of ${requestedAmount.toFixed(6)} (${percentagePaid.toFixed(2)}%)`;
        console.log(paymentAcceptanceReason);
      } else {
        console.log(`Partial payment rejected: paid ${actuallyPaid.toFixed(6)} of ${requestedAmount.toFixed(6)} (${percentagePaid.toFixed(2)}%)`);
      }
    }
    
    if (shouldProcessPayment) {
      
      // Extract userId from order_id
      const [userId] = (data.order_id || '').split('_');
      
      if (!userId) {
        console.error('Invalid order ID in webhook:', data.order_id);
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
      }
      
      // Always use the invoice amount for credits when payment is accepted
      // This ensures users get what they paid for, even with rounding issues
      let amountToCredit = parseFloat(data.price_amount);
      
      if (data.payment_status === 'partially_paid') {
        console.log(`Partially paid but accepted: expected ${data.price_amount}, received ${data.actually_paid}`);
        console.log(`Crediting full invoice amount: ${amountToCredit} USDT`);
      }
      
      // Round to 2 decimal places
      amountToCredit = Math.round(amountToCredit * 100) / 100;
      console.log(`Adding credits for user ${userId}: ${amountToCredit} USDT = ${amountToCredit * 30} credits`);
      
      // Add credits to user
      const success = await creditService.addCreditsFromPayment(
        userId,
        amountToCredit,
        data.payment_id,
        data.payment_id
      );
      
      if (success) {
        console.log('Credits added successfully via webhook');
        return NextResponse.json({ 
          success: true, 
          message: 'Credits added successfully',
          creditsAdded: Math.floor(amountToCredit * 30)
        });
      } else {
        console.error('Failed to add credits via webhook');
        return NextResponse.json({ 
          error: 'Failed to add credits'
        }, { status: 500 });
      }
    }
    
    // For other statuses, just acknowledge
    return NextResponse.json({ 
      success: true,
      message: `Payment status: ${data.payment_status}`
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}