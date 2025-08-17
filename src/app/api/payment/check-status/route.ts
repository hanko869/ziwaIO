import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@/lib/credits';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_SANDBOX === 'true' 
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1';

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    // Get payment status from NOWPayments
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }

    const payment = await response.json();
    console.log('Payment status check:', payment);

    // Check if payment is completed or partially paid
    if (payment.payment_status === 'finished' || 
        payment.payment_status === 'confirmed' || 
        payment.payment_status === 'partially_paid') {
      // Extract userId from order_id
      const [userId] = (payment.order_id || '').split('_');
      
      if (!userId) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
      }

      // Calculate the original amount (remove the 20% fee markup we added)
      let amountToCredit = parseFloat(payment.price_amount) / 1.20;
      if (payment.payment_status === 'partially_paid' && payment.actually_paid) {
        amountToCredit = parseFloat(payment.actually_paid) / 1.20;
        console.log(`Partially paid: expected ${payment.price_amount}, received ${payment.actually_paid}`);
      }
      console.log(`Payment amount: ${payment.price_amount}, Original amount for credits: ${amountToCredit}`);
      
      // Round to 2 decimal places
      amountToCredit = Math.round(amountToCredit * 100) / 100;

      // Add credits to user
      const success = await creditService.addCreditsFromPayment(
        userId,
        amountToCredit,
        payment.payment_id,
        payment.payment_id
      );

      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: `Credits added successfully${payment.payment_status === 'partially_paid' ? ' (partial payment)' : ''}`,
          payment: payment,
          creditsAdded: Math.floor(amountToCredit * 30)
        });
      } else {
        return NextResponse.json({ 
          error: 'Failed to add credits',
          payment: payment
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        success: false,
        message: `Payment status: ${payment.payment_status}`,
        payment: payment
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check payment status' },
      { status: 500 }
    );
  }
} 