'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentDetailsModalProps {
  paymentData: {
    paymentId: string;
    payAddress: string;
    payAmount: string;
    payCurrency: string;
    createdAt?: string;
    expiresAt?: string;
  };
  onClose: () => void;
  onPaymentComplete?: () => void;
}

export default function PaymentDetailsModal({ 
  paymentData, 
  onClose, 
  onPaymentComplete 
}: PaymentDetailsModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [checking, setChecking] = useState(false);

  // Calculate expiry time (NOWPayments payments expire after 20 minutes)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdTime = paymentData.createdAt ? new Date(paymentData.createdAt).getTime() : Date.now();
      const expiryTime = createdTime + (20 * 60 * 1000); // 20 minutes
      const now = Date.now();
      const difference = expiryTime - now;

      if (difference > 0) {
        const minutes = Math.floor(difference / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('Expired');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [paymentData.createdAt]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const checkPaymentStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/payment/check-status?paymentId=${paymentData.paymentId}`);
      const data = await response.json();
      
      if (data.status === 'finished' || data.status === 'partially_paid') {
        if (onPaymentComplete) {
          onPaymentComplete();
        }
        onClose();
      } else if (data.status === 'waiting') {
        alert('Payment is still waiting. Please complete the payment.');
      } else if (data.status === 'expired') {
        alert('Payment has expired. Please create a new payment.');
        onClose();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Payment</h2>
        
        {/* Payment Timer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-amber-800 font-medium">Time remaining:</span>
            <span className={`text-xl font-bold ${timeLeft === 'Expired' ? 'text-red-600' : 'text-amber-600'}`}>
              {timeLeft || 'Loading...'}
            </span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment ID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paymentData.paymentId}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={() => copyToClipboard(paymentData.paymentId)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Send
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`${paymentData.payAmount} ${paymentData.payCurrency.toUpperCase()}`}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-semibold"
              />
              <button
                onClick={() => copyToClipboard(paymentData.payAmount)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Send EXACTLY this amount. Any other amount will result in payment failure.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Send to Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paymentData.payAddress}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm break-all"
              />
              <button
                onClick={() => copyToClipboard(paymentData.payAddress)}
                className="p-2 text-purple-600 hover:text-purple-700 bg-purple-50 rounded-lg"
                title="Copy address"
              >
                {copied ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code (optional - you can add a QR code generator library) */}
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-gray-100 rounded-xl">
            <p className="text-sm text-gray-600">QR Code for address</p>
            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mt-2">
              <span className="text-xs text-gray-500">QR Placeholder</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Copy the wallet address above</li>
            <li>Send EXACTLY {paymentData.payAmount} {paymentData.payCurrency.toUpperCase()}</li>
            <li>Use {paymentData.payCurrency.includes('trc20') ? 'TRC20 (Tron)' : paymentData.payCurrency.toUpperCase()} network</li>
            <li>Wait for blockchain confirmation</li>
            <li>Click "I've Sent Payment" below</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={checkPaymentStatus}
            disabled={checking}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {checking ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </span>
            ) : (
              "I've Sent Payment"
            )}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          Powered by NOWPayments • Network fees apply
        </p>
      </div>
    </div>
  );
} 