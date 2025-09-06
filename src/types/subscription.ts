// Types for the subscription-based system

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  walletAddress?: string;
  language: 'en' | 'zh';
}

export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastUpdated: Date;
}

export interface PricingConfig {
  id: string;
  name: string;
  creditsPerEmail: number;
  creditsPerPhone: number;
  creditsPerUsdt: number;
  minDepositUsdt: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amountUsdt: number;
  creditsPurchased: number;
  creditsPerUsdt: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  createdAt: Date;
  confirmedAt?: Date;
  metadata?: Record<string, any>;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number; // positive for credits added, negative for used
  balanceAfter: number;
  description: string;
  relatedPaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ExtractedContact {
  id: string;
  userId: string;
  linkedinUrl: string;
  name?: string;
  emails: string[];
  phones: string[];
  jobTitle?: string;
  company?: string;
  location?: string;
  education?: string;
  creditsUsed: number;
  emailCredits: number;
  phoneCredits: number;
  extractedAt: Date;
  rawData?: any;
}

export interface TronTransaction {
  txID: string;
  raw_data: {
    contract: Array<{
      parameter: {
        value: {
          data?: string;
          owner_address: string;
          to_address?: string;
          amount?: number;
          contract_address?: string;
        };
      };
      type: string;
    }>;
    timestamp: number;
  };
  ret: Array<{
    contractRet: string;
  }>;
}

export interface PaymentRequest {
  userId: string;
  amountUsdt: number;
  fromAddress: string;
}

export interface PaymentVerification {
  transactionHash: string;
  userId: string;
} 