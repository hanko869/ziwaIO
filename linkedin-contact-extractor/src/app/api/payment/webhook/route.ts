// Payment webhook endpoint for processing TRC-20 transactions
import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@/lib/credits';
import crypto from 'crypto';

// Verify NOWPayments IPN signature
function verifyIPNSignature(payload: any, receivedSignature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET || '';
  if (!secret || !receivedSignature) return false;
  
  // Sort the payload keys
  const sortedKeys = Object.keys(payload).sort();
  const sortedPayload: any = {};
  sortedKeys.forEach(key => {
    if (payload[key] !== null && payload[key] !== undefined) {
      sortedPayload[key] = payload[key];
    }
  });
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(JSON.stringify(sortedPayload));
  const calculatedSignature = hmac.digest('hex');
  
  console.log('Webhook signature verification:', {
    received: receivedSignature,
    calculated: calculatedSignature,
    match: calculatedSignature === receivedSignature
  });
  
  return calculatedSignature === receivedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-nowpayments-sig');
    const rawBody = await request.text();
    let payload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse webhook body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    console.log('Webhook received:', {
      hasSignature: !!signature,
      paymentId: payload.payment_id,
      status: payload.payment_status,
      orderId: payload.order_id
    });
    
    // Verify signature
    if (signature && !verifyIPNSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const {
      payment_id,
      payment_status,
      pay_amount,
      actually_paid,
      order_id,
      pay_currency,
      price_amount,
      price_currency
    } = payload;
    
    // Extract userId from order_id (format: userId_timestamp)
    const [userId] = (order_id || '').split('_');
    
    if (!userId || !payment_id) {
      console.error('Missing required fields:', { userId, payment_id });
      return NextResponse.json(
        { error: 'Invalid payment data' },
        { status: 400 }
      );
    }
    
    console.log('Processing payment:', {
      userId,
      paymentId: payment_id,
      status: payment_status,
      amount: price_amount
    });
    
    // Update payment status based on NOWPayments status
    if (payment_status === 'finished' || payment_status === 'confirmed' || payment_status === 'sending') {
      // Payment confirmed
      try {
        await creditService.updatePaymentStatus(payment_id, 'confirmed');
        
        // Add credits to user
        const creditsToAdd = Math.floor(parseFloat(price_amount) * 30); // 30 credits per USDT
        
        // For testing, just log the credit addition
        console.log(`Adding ${creditsToAdd} credits to user ${userId}`);
        
        // In production, you would actually add credits to the user's balance
        // await creditService.addCredits(userId, creditsToAdd);
        
        return NextResponse.json({ 
          success: true,
          message: 'Payment processed successfully'
        });
      } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ 
          success: false,
          error: 'Failed to process payment'
        }, { status: 500 });
      }
    } else if (payment_status === 'failed' || payment_status === 'expired' || payment_status === 'refunded') {
      // Payment failed
      await creditService.updatePaymentStatus(payment_id, 'failed');
      return NextResponse.json({ success: true });
    } else {
      // Payment still pending or waiting
      console.log('Payment still pending:', payment_status);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 