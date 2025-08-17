// TronWeb utility for TRC-20 payment handling
import { TronTransaction } from '@/types/subscription';

// Dynamic import for TronWeb to avoid SSR issues
let TronWeb: any;
if (typeof window !== 'undefined') {
  TronWeb = require('tronweb');
}

// Initialize TronWeb instance
const getTronWeb = () => {
  if (!TronWeb) return null;
  
  return new TronWeb({
    fullHost: process.env.NEXT_PUBLIC_TRON_NETWORK === 'mainnet' 
      ? 'https://api.trongrid.io' 
      : 'https://api.shasta.trongrid.io',
    headers: process.env.TRON_API_KEY 
      ? { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY }
      : undefined,
  });
};

// USDT TRC-20 contract ABI (minimal required functions)
const USDT_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export class TronPaymentService {
  private usdtContract: any;
  private paymentWalletAddress: string;
  private usdtContractAddress: string;

  constructor() {
    this.paymentWalletAddress = process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS || '';
    this.usdtContractAddress = process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS || '';
    
    if (this.usdtContractAddress && typeof window !== 'undefined') {
      this.initializeContract();
    }
  }

  private async initializeContract() {
    try {
      const tronWeb = getTronWeb();
      if (!tronWeb) return;
      this.usdtContract = await tronWeb.contract(USDT_ABI, this.usdtContractAddress);
    } catch (error) {
      console.error('Error initializing USDT contract:', error);
    }
  }

  // Convert USDT amount to smallest unit (6 decimals for USDT)
  public toSun(amount: number): string {
    return (amount * 1e6).toString();
  }

  // Convert from smallest unit to USDT
  public fromSun(amount: string): number {
    return parseInt(amount) / 1e6;
  }

  // Validate TRON address
  public isValidAddress(address: string): boolean {
    try {
      const tronWeb = getTronWeb();
      if (!tronWeb) return false;
      return tronWeb.isAddress(address);
    } catch {
      return false;
    }
  }

  // Get USDT balance of an address
  public async getUsdtBalance(address: string): Promise<number> {
    try {
      if (!this.usdtContract) {
        await this.initializeContract();
      }
      const balance = await this.usdtContract.balanceOf(address).call();
      return this.fromSun(balance.toString());
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      return 0;
    }
  }

  // Verify a transaction
  public async verifyTransaction(txHash: string): Promise<{
    valid: boolean;
    amount?: number;
    fromAddress?: string;
    toAddress?: string;
    timestamp?: number;
  }> {
    try {
      const tronWeb = getTronWeb();
      if (!tronWeb) return { valid: false };
      const transaction = await tronWeb.trx.getTransaction(txHash) as TronTransaction;
      
      if (!transaction || !transaction.ret || transaction.ret[0].contractRet !== 'SUCCESS') {
        return { valid: false };
      }

      // Check if it's a TRC-20 transfer
      const contract = transaction.raw_data.contract[0];
      if (contract.type !== 'TriggerSmartContract') {
        return { valid: false };
      }

      const contractAddress = tronWeb.address.fromHex(contract.parameter.value.contract_address || '');
      if (contractAddress !== this.usdtContractAddress) {
        return { valid: false };
      }

      // Decode the transfer data
      const data = contract.parameter.value.data;
      if (!data || !data.startsWith('a9059cbb')) { // transfer method signature
        return { valid: false };
      }

      // Extract to address and amount from data
      const toAddressHex = '41' + data.substring(32, 72);
      const toAddress = tronWeb.address.fromHex(toAddressHex);
      const amountHex = data.substring(72, 136);
      const amount = this.fromSun(parseInt(amountHex, 16).toString());

      // Verify it's sent to our payment wallet
      if (toAddress !== this.paymentWalletAddress) {
        return { valid: false };
      }

      const fromAddress = tronWeb.address.fromHex(contract.parameter.value.owner_address);

      return {
        valid: true,
        amount,
        fromAddress,
        toAddress,
        timestamp: transaction.raw_data.timestamp
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { valid: false };
    }
  }

  // Get transaction confirmations
  public async getConfirmations(txHash: string): Promise<number> {
    try {
      const tronWeb = getTronWeb();
      if (!tronWeb) return 0;
      
      const transaction = await tronWeb.trx.getTransaction(txHash);
      if (!transaction || !transaction.raw_data) return 0;

      const txBlock = await tronWeb.trx.getBlockByNumber(transaction.blockNumber);
      const currentBlock = await tronWeb.trx.getCurrentBlock();
      
      return currentBlock.block_header.raw_data.number - txBlock.block_header.raw_data.number;
    } catch (error) {
      console.error('Error getting confirmations:', error);
      return 0;
    }
  }

  // Generate payment QR code data
  public generatePaymentQR(amount: number): string {
    const paymentData = {
      to: this.paymentWalletAddress,
      amount: this.toSun(amount),
      token: this.usdtContractAddress,
      network: 'tron'
    };
    return JSON.stringify(paymentData);
  }

  // Check if TronLink is available
  public isTronLinkAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).tronWeb;
  }

  // Request TronLink connection
  public async connectTronLink(): Promise<string | null> {
    try {
      if (!this.isTronLinkAvailable()) {
        throw new Error('TronLink not found');
      }

      const tronLink = (window as any).tronWeb;
      
      // Request accounts
      const accounts = await tronLink.request({ method: 'tron_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting TronLink:', error);
      return null;
    }
  }

  // Send USDT payment via TronLink
  public async sendPaymentViaTronLink(amount: number): Promise<string | null> {
    try {
      if (!this.isTronLinkAvailable()) {
        throw new Error('TronLink not found');
      }

      const tronLink = (window as any).tronWeb;
      const contract = await tronLink.contract(USDT_ABI, this.usdtContractAddress);
      
      const result = await contract.transfer(
        this.paymentWalletAddress,
        this.toSun(amount)
      ).send();

      return result;
    } catch (error) {
      console.error('Error sending payment:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tronPaymentService = new TronPaymentService(); 