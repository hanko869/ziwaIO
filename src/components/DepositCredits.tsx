'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { creditService } from '@/lib/credits';

export default function DepositCredits({ 
  userId, 
  onDepositComplete 
}: { 
  userId: string;
  onDepositComplete?: () => void;
}) {
  const { t } = useLanguage();
  const [depositAmount, setDepositAmount] = useState('30');
  const [creditsToReceive, setCreditsToReceive] = useState(900);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pricingConfig, setPricingConfig] = useState<any>(null);

  useEffect(() => {
    loadPricingConfig();
  }, []);

  useEffect(() => {
    // Calculate credits when amount changes
    if (pricingConfig && depositAmount) {
      const amount = parseFloat(depositAmount) || 0;
      setCreditsToReceive(Math.floor(amount * pricingConfig.credits_per_usdt));
    }
  }, [depositAmount, pricingConfig]);

  const loadPricingConfig = async () => {
    const config = await creditService.getPricingConfig();
    setPricingConfig(config);
  };

  const handlePaymentSubmit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 20) {
      setError('Minimum deposit is 20 USDT');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
          currency: 'usdttrc20'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (data.paymentUrl) {
        // Redirect to NOWPayments invoice page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!pricingConfig) {
    return <div className="text-center py-8">{t.subscription.loading}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">{t.payAsYouGo.depositCredits}</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{t.payAsYouGo.howItWorks}</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• {t.payAsYouGo.payAsYouGo}</li>
            <li>• Email: {pricingConfig.credits_per_email} credits ($0.{String(pricingConfig.credits_per_email / pricingConfig.credits_per_usdt * 1000).padStart(3, '0')})</li>
            <li>• Phone: {pricingConfig.credits_per_phone} credits ($0.{String(pricingConfig.credits_per_phone / pricingConfig.credits_per_usdt * 1000).padStart(3, '0')})</li>
            <li>• {t.payAsYouGo.noResultsNoCharge}</li>
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {t.payAsYouGo.depositAmount} (USDT)
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min="20"
            step="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum deposit: 20 USDT
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t.payAsYouGo.youWillReceive}:</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {creditsToReceive} {t.subscription.credits}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Estimated: {Math.floor(creditsToReceive / (pricingConfig.credits_per_email + pricingConfig.credits_per_phone))}-{creditsToReceive / pricingConfig.credits_per_email} extractions
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handlePaymentSubmit}
          disabled={loading || !depositAmount || parseFloat(depositAmount) < 20}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          Pay as you go - only charged for successful extractions<br/>
          Powered by NOWPayments
        </p>
      </div>
    </div>
  );
} 