'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SubscriptionPlan } from '@/types/subscription';
import { creditService } from '@/lib/credits';
import { tronPaymentService } from '@/utils/tronweb';

export default function PricingPlans({ 
  userId, 
  onPaymentComplete 
}: { 
  userId: string;
  onPaymentComplete?: () => void;
}) {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'confirming'>('select');
  const [transactionHash, setTransactionHash] = useState('');
  const [userWallet, setUserWallet] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const subscriptionPlans = await creditService.getSubscriptionPlans();
      setPlans(subscriptionPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentStep('payment');
  };

  const handleTronLinkPayment = async () => {
    if (!selectedPlan) return;

    try {
      // Connect TronLink wallet
      const address = await tronPaymentService.connectTronLink();
      if (!address) {
        alert(t('connectWalletFailed'));
        return;
      }
      setUserWallet(address);

      // Send payment
      const txHash = await tronPaymentService.sendPaymentViaTronLink(selectedPlan.priceUsdt);
      if (txHash) {
        setTransactionHash(txHash);
        setPaymentStep('confirming');
        
        // Record pending payment
        await creditService.recordPayment({
          userId,
          transactionHash: txHash,
          fromAddress: address,
          toAddress: process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS || '',
          amountUsdt: selectedPlan.priceUsdt,
          creditsPurchased: selectedPlan.totalCredits,
          planId: selectedPlan.id,
          status: 'pending',
          confirmations: 0
        });

        // Start verification
        verifyPayment(txHash);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(t('paymentFailed'));
    }
  };

  const verifyPayment = async (txHash: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    const checkTransaction = async () => {
      try {
        const result = await tronPaymentService.verifyTransaction(txHash);
        
        if (result.valid && result.amount === selectedPlan?.priceUsdt) {
          // Payment confirmed
          await creditService.updatePaymentStatus(txHash, 'confirmed');
          
          // Add credits to user
          await creditService.addCredits(
            userId,
            selectedPlan.totalCredits,
            txHash,
            `Purchased ${selectedPlan.name} plan`
          );

          alert(t('paymentSuccess'));
          onPaymentComplete?.();
          resetPayment();
        } else if (attempts >= maxAttempts) {
          // Timeout
          await creditService.updatePaymentStatus(txHash, 'failed');
          alert(t('paymentTimeout'));
          resetPayment();
        } else {
          // Keep checking
          attempts++;
          setTimeout(checkTransaction, 5000); // Check every 5 seconds
        }
      } catch (error) {
        console.error('Verification error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkTransaction, 5000);
        }
      }
    };

    checkTransaction();
  };

  const resetPayment = () => {
    setSelectedPlan(null);
    setPaymentStep('select');
    setTransactionHash('');
    setUserWallet('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t('copiedToClipboard'));
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {paymentStep === 'select' && (
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">{t('choosePlan')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleSelectPlan(plan)}
              >
                <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
                <div className="text-3xl font-bold mb-2">${plan.priceUsdt}</div>
                <div className="text-gray-600 dark:text-gray-400 mb-4">USDT</div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span>{t('credits')}:</span>
                    <span className="font-semibold">{plan.credits}</span>
                  </div>
                  {plan.bonusCredits > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('bonus')}:</span>
                      <span className="font-semibold">+{plan.bonusCredits}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span>{t('total')}:</span>
                    <span className="font-bold">{plan.totalCredits}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                  {t('selectPlan')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {paymentStep === 'payment' && selectedPlan && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6">{t('completePayment')}</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">{t('orderSummary')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('plan')}:</span>
                <span>{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('credits')}:</span>
                <span>{selectedPlan.totalCredits}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t('total')}:</span>
                <span>${selectedPlan.priceUsdt} USDT</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleTronLinkPayment}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              <span>{t('payWithTronLink')}</span>
            </button>

            <div className="text-center text-gray-600 dark:text-gray-400">
              {t('or')}
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm mb-2">{t('sendManually')}</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS || ''}
                  readOnly
                  className="flex-1 bg-white dark:bg-gray-600 px-3 py-2 rounded text-sm"
                />
                <button
                  onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS || '')}
                  className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700"
                >
                  {t('copy')}
                </button>
              </div>
              <p className="text-xs mt-2 text-gray-500">{t('sendExactAmount')}</p>
            </div>

            <button
              onClick={resetPayment}
              className="w-full text-gray-600 hover:text-gray-800 py-2"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {paymentStep === 'confirming' && (
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold mb-4">{t('confirmingPayment')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('waitingConfirmation')}
          </p>
          {transactionHash && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm mb-2">{t('transactionHash')}:</p>
              <p className="text-xs break-all font-mono">{transactionHash}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 