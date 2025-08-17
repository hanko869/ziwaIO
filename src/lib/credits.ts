// Credit management service
import { createClient } from '@supabase/supabase-js';
import { 
  UserCredits, 
  CreditTransaction, 
  PaymentTransaction 
} from '@/types/subscription';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only create client if credentials are provided
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  if (!supabase) {
    console.warn('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    return false;
  }
  return true;
};

export class CreditService {
  // Get pricing configuration
  async getPricingConfig() {
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Return defaults if no config found
      return {
        credits_per_email: parseInt(process.env.NEXT_PUBLIC_CREDITS_PER_EMAIL || '1'),
        credits_per_phone: parseInt(process.env.NEXT_PUBLIC_CREDITS_PER_PHONE || '2'),
        credits_per_usdt: parseInt(process.env.NEXT_PUBLIC_CREDITS_PER_USDT || '30'),
        min_deposit_usdt: parseFloat(process.env.NEXT_PUBLIC_MIN_DEPOSIT_USDT || '10')
      };
    }

    return data;
  }

  // Calculate credits needed based on extraction results
  calculateCreditsForResults(emailCount: number, phoneCount: number): { 
    emailCredits: number, 
    phoneCredits: number, 
    totalCredits: number 
  } {
    const emailCredits = emailCount * parseInt(process.env.NEXT_PUBLIC_CREDITS_PER_EMAIL || '1');
    const phoneCredits = phoneCount * parseInt(process.env.NEXT_PUBLIC_CREDITS_PER_PHONE || '2');
    
    return {
      emailCredits,
      phoneCredits,
      totalCredits: emailCredits + phoneCredits
    };
  }

  // Get user's credit balance
  async getUserCredits(walletAddress: string): Promise<UserCredits | null> {
    if (!isSupabaseConfigured()) {
      // Return mock data for development
      return {
        id: '1',
        userId: walletAddress,
        balance: 100,
        totalPurchased: 100,
        totalUsed: 0,
        lastUpdated: new Date()
      };
    }

    try {
      const { data, error } = await supabase!
        .from('user_credits')
        .select('*')
        .eq('user_id', walletAddress)
        .single();

      if (error) {
        console.error('Error fetching user credits:', error);
        // Try to initialize credits if they don't exist
        if (error.code === 'PGRST116') { // No rows found
          const initialized = await this.initializeUserCredits(walletAddress);
          return initialized;
        }
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        balance: data.balance || 0,
        totalPurchased: data.total_purchased || 0,
        totalUsed: data.total_used || 0,
        lastUpdated: new Date(data.last_updated)
      };
    } catch (error) {
      console.error('Error fetching user credits:', error);
      return null;
    }
  }

  // Initialize credits for new user
  async initializeUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: 0,
          total_purchased: 0,
          total_used: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing user credits:', error);
      return null;
    }
  }

  // Check if user has enough credits
  async hasEnoughCredits(userId: string, required: number): Promise<boolean> {
    const credits = await this.getUserCredits(userId);
    return credits ? credits.balance >= required : false;
  }

  // Deduct credits based on extraction results
  async deductCreditsForResults(
    userId: string, 
    emailCount: number,
    phoneCount: number,
    linkedinUrl: string,
    metadata?: any
  ): Promise<{ success: boolean; creditsUsed: number; emailCredits: number; phoneCredits: number }> {
    const client = supabase;
    
    try {
      // Calculate credits needed
      const { emailCredits, phoneCredits, totalCredits } = this.calculateCreditsForResults(emailCount, phoneCount);
      
      // If no results found, don't charge
      if (totalCredits === 0) {
        return { success: true, creditsUsed: 0, emailCredits: 0, phoneCredits: 0 };
      }

      // Get current credits
      const credits = await this.getUserCredits(userId);
      if (!credits || credits.balance < totalCredits) {
        return { success: false, creditsUsed: 0, emailCredits: 0, phoneCredits: 0 };
      }

      const newBalance = credits.balance - totalCredits;
      const newTotalUsed = credits.totalUsed + totalCredits;

      // Update credits
      const { error: updateError } = await client
        .from('user_credits')
        .update({
          balance: newBalance,
          total_used: newTotalUsed,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Record transaction
      const description = `Extraction from ${linkedinUrl}: ${emailCount} email(s) (${emailCredits} credits), ${phoneCount} phone(s) (${phoneCredits} credits)`;
      
      const { error: transactionError } = await client
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type: 'usage',
          amount: -totalCredits,
          balance_after: newBalance,
          description,
          metadata: {
            ...metadata,
            linkedinUrl,
            emailCount,
            phoneCount,
            emailCredits,
            phoneCredits
          }
        });

      if (transactionError) throw transactionError;

      return { success: true, creditsUsed: totalCredits, emailCredits, phoneCredits };
    } catch (error) {
      console.error('Error deducting credits:', error);
      return { success: false, creditsUsed: 0, emailCredits: 0, phoneCredits: 0 };
    }
  }

  // Add credits after payment (pay-as-you-go)
  async addCreditsFromPayment(
    userId: string,
    amountUsdt: number,
    paymentId: string,
    transactionHash: string
  ): Promise<boolean> {
    const client = supabase;
    
    try {
      // Get pricing config
      const pricing = await this.getPricingConfig();
      const creditsToAdd = Math.floor(amountUsdt * pricing.credits_per_usdt);

      const credits = await this.getUserCredits(userId);
      if (!credits) {
        await this.initializeUserCredits(userId);
        const newCredits = await this.getUserCredits(userId);
        if (!newCredits) return false;
      }

      const currentCredits = credits || { balance: 0, totalPurchased: 0 };
      const newBalance = currentCredits.balance + creditsToAdd;
      const newTotalPurchased = currentCredits.totalPurchased + creditsToAdd;

      // Update credits
      const { error: updateError } = await client
        .from('user_credits')
        .update({
          balance: newBalance,
          total_purchased: newTotalPurchased,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Record transaction
      const description = `Deposited ${amountUsdt} USDT - ${creditsToAdd} credits added`;
      
      const { error: transactionError } = await client
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type: 'purchase',
          amount: creditsToAdd,
          balance_after: newBalance,
          description,
          related_payment_id: paymentId,
          metadata: {
            amountUsdt,
            creditsPerUsdt: pricing.credits_per_usdt,
            transactionHash
          }
        });

      if (transactionError) throw transactionError;

      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  }

  // Get credit transaction history
  async getCreditHistory(userId: string, limit = 50): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting credit history:', error);
      return [];
    }
  }

  // Record payment transaction
  async recordPayment(payment: Omit<PaymentTransaction, 'id' | 'createdAt'>): Promise<PaymentTransaction | null> {
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Supabase not configured');
      return null;
    }

    try {
      // Convert camelCase to snake_case for database
      const dbPayment = {
        user_id: payment.userId,
        transaction_hash: payment.transactionHash,
        from_address: payment.fromAddress,
        to_address: payment.toAddress,
        amountusdt: payment.amountUsdt, // PostgreSQL converts to lowercase
        credits_purchased: payment.creditsPurchased,
        credits_per_usdt: payment.creditsPerUsdt,
        status: payment.status,
        confirmations: payment.confirmations,
        metadata: payment.metadata
      };

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert(dbPayment)
        .select()
        .single();

      if (error) throw error;
      
      // Convert back to camelCase for TypeScript
      return {
        id: data.id,
        userId: data.user_id,
        transactionHash: data.transaction_hash,
        fromAddress: data.from_address,
        toAddress: data.to_address,
        amountUsdt: data.amountusdt,
        creditsPurchased: data.credits_purchased,
        creditsPerUsdt: data.credits_per_usdt,
        status: data.status,
        confirmations: data.confirmations,
        createdAt: new Date(data.created_at),
        confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      return null;
    }
  }

  // Update payment status
  async updatePaymentStatus(
    transactionHash: string, 
    status: 'confirmed' | 'failed',
    confirmations?: number
  ): Promise<boolean> {
    try {
      const update: any = { status };
      if (status === 'confirmed') {
        update.confirmed_at = new Date().toISOString();
      }
      if (confirmations !== undefined) {
        update.confirmations = confirmations;
      }

      const { error } = await supabase
        .from('payment_transactions')
        .update(update)
        .eq('transaction_hash', transactionHash);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  // Get user's payment history
  async getPaymentHistory(userId: string): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  // Calculate estimated cost for URLs (for display purposes)
  async estimateCostForUrls(urlCount: number): Promise<{
    minCredits: number;
    maxCredits: number;
    minCost: number;
    maxCost: number;
  }> {
    const pricing = await this.getPricingConfig();
    
    // Minimum: only emails found
    const minCredits = urlCount * pricing.credits_per_email;
    // Maximum: both email and phone found
    const maxCredits = urlCount * (pricing.credits_per_email + pricing.credits_per_phone);
    
    const minCost = minCredits / pricing.credits_per_usdt;
    const maxCost = maxCredits / pricing.credits_per_usdt;
    
    return { minCredits, maxCredits, minCost, maxCost };
  }
}

// Export singleton instance
export const creditService = new CreditService(); 