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
    if (data.payment_status === 'finished' || 
        data.payment_status === 'confirmed' || 
        data.payment_status === 'partially_paid') {
      
      // Extract userId from order_id
      const [userId] = (data.order_id || '').split('_');
      
      if (!userId) {
        console.error('Invalid order ID in webhook:', data.order_id);
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
      }
      
      // Use the actual amount paid
      let amountToCredit = parseFloat(data.price_amount);
      if (data.payment_status === 'partially_paid' && data.actually_paid) {
        amountToCredit = parseFloat(data.actually_paid);
        console.log(`Partially paid: expected ${data.price_amount}, received ${data.actually_paid}`);
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