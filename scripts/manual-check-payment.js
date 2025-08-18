// Script to manually check and process payment 5591298191

async function checkAndProcessPayment() {
  const paymentId = '5591298191';
  
  try {
    console.log(`Checking payment status for ID: ${paymentId}`);
    
    // Call your local API to check payment status
    const response = await fetch('http://localhost:3000/api/payment/check-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId })
    });
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('Payment processed successfully!');
      console.log(`Credits added: ${result.creditsAdded}`);
    } else {
      console.error('Failed to process payment:', result.error || result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkAndProcessPayment();
