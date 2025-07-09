import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@/lib/credits';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
// Use sandbox for testing, production for real payments
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_SANDBOX === 'true' 
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, currency } = await request.json();

    console.log('Payment request:', { userId, amount, currency });
    console.log('API Key available:', !!NOWPAYMENTS_API_KEY);
    console.log('Using API URL:', NOWPAYMENTS_API_URL);

    // Validate amount
    if (!amount || amount < 20) {
      return NextResponse.json(
        { error: 'Minimum deposit is 20 USDT' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Create payment with NOWPayments
    const paymentData = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: currency || 'usdttrc20',
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      order_id: `${userId}_${Date.now()}`,
      order_description: `Deposit ${amount} USDT for ${amount * 30} credits`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=cancelled`,
      is_fixed_rate: true,
      is_fee_paid_by_user: false
    };

    console.log('Sending to NOWPayments:', paymentData);

    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log('NOWPayments response status:', response.status);
    console.log('NOWPayments response:', data);

    if (!response.ok) {
      console.error('NOWPayments error:', data);
      throw new Error(data.message || data.error || 'Payment API error');
    }

    if (data.payment_id) {
      // Store payment info in database
      try {
        await creditService.recordPayment({
          userId,
          transactionHash: data.payment_id,
          fromAddress: data.pay_address || '',
          toAddress: data.pay_address || '',
          amountUsdt: amount,
          creditsPurchased: amount * 30,
          creditsPerUsdt: 30,
          status: 'pending',
          confirmations: 0,
          metadata: {
            nowpayments_id: data.payment_id,
            invoice_url: data.invoice_url,
            payment_status: data.payment_status
          }
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue anyway - payment was created
      }

      return NextResponse.json({
        success: true,
        paymentId: data.payment_id,
        paymentUrl: data.invoice_url,
        payAddress: data.pay_address,
        payAmount: data.pay_amount,
        payCurrency: data.pay_currency
      });
    } else {
      throw new Error('Invalid payment response - no payment ID');
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
} 