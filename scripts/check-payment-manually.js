// Script to manually check payment status and add credits if needed
const paymentId = '5211671678';

async function checkPayment() {
  try {
    // Call the check-status endpoint
    const response = await fetch('http://localhost:3000/api/payment/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPayment();
