import { NextRequest, NextResponse } from 'next/server';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
// Use sandbox for testing, production for real payments
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_SANDBOX === 'true' 
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1';

export async function POST(request: NextRequest) {
  // Add no-cache headers
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  try {
    const { userId, amount, currency } = await request.json();

    console.log('Payment request:', { userId, amount, currency });
    console.log('API Key available:', !!NOWPAYMENTS_API_KEY);
    console.log('Using API URL:', NOWPAYMENTS_API_URL);

    // Validate amount
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Minimum deposit is 10 USDT' },
        { status: 400, headers }
      );
    }

    // TEST MODE: For local development, simulate successful payment
    if (process.env.NODE_ENV === 'development' && process.env.NOWPAYMENTS_SANDBOX === 'true') {
      console.log('TEST MODE: Simulating successful payment');
      
      // In test mode, return a special response that the frontend will handle
      return NextResponse.json({
        success: true,
        testMode: true,
        paymentId: `test_${Date.now()}`,
        amount: amount,
        credits: amount * 30,
        message: 'Test payment - credits will be added automatically'
      }, { headers });
    }

    // Check if API key is configured
    if (!NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500, headers }
      );
    }

    // Create payment with NOWPayments
    const paymentData = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: currency || 'usdttrc20',
      order_id: `${userId || 'user'}_${Date.now()}`,
      order_description: `Deposit ${amount} USDT for ${amount * 30} credits`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=cancelled`,
      is_fixed_rate: true,
      is_fee_paid_by_user: true  // Changed to true - users should pay the fees
    };

    console.log('Creating payment with NOWPayments:', paymentData);

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
    console.log('NOWPayments response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('NOWPayments error:', data);
      throw new Error(data.message || data.error || 'Payment API error');
    }

    // Payment API response handling
    if (data.payment_id) {
      console.log('Payment created successfully, payment ID:', data.payment_id);
      
      // Now create an invoice for this payment to get a hosted payment page
      try {
        const invoiceResponse = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
          method: 'POST',
          headers: {
            'x-api-key': NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price_amount: amount,
            price_currency: 'usd',
            order_id: data.order_id,
            order_description: `Deposit ${amount} USDT for ${amount * 30} credits`,
            ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=cancelled`
          })
        });

        const invoiceData = await invoiceResponse.json();
        console.log('Invoice response:', JSON.stringify(invoiceData, null, 2));

        if (invoiceData.invoice_url) {
          return NextResponse.json({
            success: true,
            paymentId: data.payment_id,
            paymentUrl: invoiceData.invoice_url,
            payAddress: data.pay_address,
            payAmount: data.pay_amount,
            payCurrency: data.pay_currency
          }, { headers });
        }
      } catch (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
      }
      
      // If invoice creation fails, return payment details for manual payment
      return NextResponse.json({
        success: true,
        paymentId: data.payment_id,
        paymentStatus: data.payment_status,
        payAddress: data.pay_address,
        payAmount: data.pay_amount,
        payCurrency: data.pay_currency,
        createdAt: data.created_at,
        // Return all data for debugging
        paymentData: data
      }, { headers });
    } else {
      throw new Error('Invalid payment response - no payment ID');
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500, headers }
    );
  }
} 