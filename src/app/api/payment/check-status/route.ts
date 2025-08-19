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
    // Accept payments that are within a reasonable tolerance
    let shouldProcessPayment = false;
    let paymentAcceptanceReason = '';
    
    if (payment.payment_status === 'finished' || payment.payment_status === 'confirmed') {
      shouldProcessPayment = true;
      paymentAcceptanceReason = 'Payment fully confirmed';
    } else if (payment.payment_status === 'partially_paid' && payment.actually_paid) {
      const requestedAmount = parseFloat(payment.price_amount);
      const actuallyPaid = parseFloat(payment.actually_paid);
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
      const [userId] = (payment.order_id || '').split('_');
      
      console.log('Extracted userId from order_id:', { order_id: payment.order_id, userId });
      
      if (!userId) {
        console.error('Invalid user ID:', userId);
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
      }
      
      // Handle anonymous payments - log them but don't add credits
      if (userId === 'anonymous') {
        console.warn('Anonymous payment detected:', payment);
        return NextResponse.json({ 
          success: false,
          message: 'Payment was made anonymously. Please contact support with payment ID: ' + payment.payment_id,
          payment: payment
        });
      }

      // Always use the invoice amount for credits when payment is accepted
      // This ensures users get what they paid for, even with rounding issues
      let amountToCredit = parseFloat(payment.price_amount);
      
      if (payment.payment_status === 'partially_paid') {
        console.log(`Partially paid but accepted: expected ${payment.price_amount}, received ${payment.actually_paid}`);
        console.log(`Crediting full invoice amount: ${amountToCredit} USDT`);
      }
      console.log(`Payment amount: ${payment.price_amount}, Credits will be based on: ${amountToCredit}`);
      
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