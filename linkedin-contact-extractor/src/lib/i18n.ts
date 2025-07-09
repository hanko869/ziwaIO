import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Main UI
      title: 'LinkedIn Contact Extractor',
      description: 'Extract contact information from LinkedIn profiles',
      placeholder: 'https://www.linkedin.com/in/username',
      extract: 'Extract',
      extracting: 'Extracting...',
      results: 'Results',
      
      // Contact fields
      name: 'Name',
      email: 'Email',
      emails: 'Emails',
      phone: 'Phone',
      phones: 'Phones',
      company: 'Company',
      location: 'Location',
      
      // Subscription
      subscription: {
        walletInfo: 'Wallet Information',
        address: 'Address',
        connectWallet: 'Connect Wallet',
        connectWalletPrompt: 'Connect your TronLink wallet to get started',
        connectWalletFailed: 'Failed to connect wallet',
        creditBalance: 'Credit Balance',
        credits: 'credits',
        credit: 'credit',
        depositCredits: 'Deposit Credits',
        creditsUsed: 'Credits Used',
        pricing: {
          email: 'Email',
          phone: 'Phone Number',
          noResults: 'No charge if no results found'
        },
        loading: 'Loading...',
        copiedToClipboard: 'Copied to clipboard',
        completePayment: 'Complete Payment',
        orderSummary: 'Order Summary',
        payWithTronLink: 'Pay with TronLink',
        or: 'or',
        sendManually: 'Send USDT manually to:',
        copy: 'Copy',
        sendExactAmount: 'Send exact amount',
        cancel: 'Cancel',
        confirmingPayment: 'Confirming Payment',
        waitingConfirmation: 'Waiting for blockchain confirmation...',
        transactionHash: 'Transaction Hash',
        paymentSuccess: 'Payment successful!',
        paymentTimeout: 'Payment timeout. Please check your transaction.',
        paymentFailed: 'Payment failed'
      },
      
      // Pay as you go
      payAsYouGo: {
        depositCredits: 'Deposit Credits',
        howItWorks: 'How It Works',
        payAsYouGo: 'Pay as you go - only charged for successful extractions',
        emailCost: '{{credits}} credit per email found (${{cost}} USDT)',
        phoneCost: '{{credits}} credits per phone found (${{cost}} USDT)',
        noResultsNoCharge: 'No results = No charge',
        depositAmount: 'Deposit Amount',
        minimumDeposit: 'Minimum deposit: {{min}} USDT',
        minDepositRequired: 'Minimum deposit is {{min}} USDT',
        youWillReceive: 'You will receive',
        estimatedExtractions: 'Estimated {{min}}-{{max}} extractions',
        proceedToPayment: 'Proceed to Payment',
        amount: 'Amount',
        rate: 'Rate'
      },
      
      // Errors
      errors: {
        enterUrl: 'Please enter a LinkedIn URL',
        connectWallet: 'Please connect your wallet first',
        extractionFailed: 'Extraction failed',
        noResultsFound: 'No contact information found',
        unknownError: 'An unknown error occurred',
        walletConnection: 'Failed to connect wallet',
        insufficientCredits: 'Insufficient credits. Please deposit more credits.'
      },
      
      // Feedback messages
      feedback: {
        enterUrl: 'Please enter a LinkedIn URL',
        invalidUrl: 'Please enter a valid LinkedIn profile URL',
        apiNotConfigured: 'API is not configured. Please check your settings.',
        extracting: 'Extracting contact information...',
        successExtract: 'Contact information extracted successfully!',
        failedExtract: 'Failed to extract contact information',
        and: 'and',
        email_one: '{{count}} email',
        email_other: '{{count}} emails',
        phone_one: '{{count}} phone',
        phone_other: '{{count}} phones',
        foundDetails: 'Found {{details}}',
        limitedInfo: 'Limited information available'
      },
      
      // Extraction section
      extraction: {
        title: 'Extract LinkedIn Contact',
        subtitle: 'Enter a LinkedIn profile URL to extract contact information'
      }
    }
  },
  zh: {
    translation: {
      // Main UI
      title: 'LinkedIn 联系人提取器',
      description: '从 LinkedIn 个人资料中提取联系信息',
      placeholder: 'https://www.linkedin.com/in/username',
      extract: '提取',
      extracting: '提取中...',
      results: '结果',
      
      // Contact fields
      name: '姓名',
      email: '电子邮件',
      emails: '电子邮件',
      phone: '电话',
      phones: '电话',
      company: '公司',
      location: '位置',
      
      // Subscription
      subscription: {
        walletInfo: '钱包信息',
        address: '地址',
        connectWallet: '连接钱包',
        connectWalletPrompt: '连接您的 TronLink 钱包以开始使用',
        connectWalletFailed: '连接钱包失败',
        creditBalance: '信用余额',
        credits: '积分',
        credit: '积分',
        depositCredits: '充值积分',
        creditsUsed: '使用的积分',
        pricing: {
          email: '电子邮件',
          phone: '电话号码',
          noResults: '如果没有找到结果，不收费'
        },
        loading: '加载中...',
        copiedToClipboard: '已复制到剪贴板',
        completePayment: '完成支付',
        orderSummary: '订单摘要',
        payWithTronLink: '使用 TronLink 支付',
        or: '或',
        sendManually: '手动发送 USDT 到：',
        copy: '复制',
        sendExactAmount: '发送准确金额',
        cancel: '取消',
        confirmingPayment: '确认支付',
        waitingConfirmation: '等待区块链确认...',
        transactionHash: '交易哈希',
        paymentSuccess: '支付成功！',
        paymentTimeout: '支付超时。请检查您的交易。',
        paymentFailed: '支付失败'
      },
      
      // Pay as you go
      payAsYouGo: {
        depositCredits: '充值积分',
        howItWorks: '工作原理',
        payAsYouGo: '按使用付费 - 仅对成功提取收费',
        emailCost: '每个找到的电子邮件 {{credits}} 积分（${{cost}} USDT）',
        phoneCost: '每个找到的电话 {{credits}} 积分（${{cost}} USDT）',
        noResultsNoCharge: '无结果 = 不收费',
        depositAmount: '充值金额',
        minimumDeposit: '最低充值：{{min}} USDT',
        minDepositRequired: '最低充值金额为 {{min}} USDT',
        youWillReceive: '您将获得',
        estimatedExtractions: '预计 {{min}}-{{max}} 次提取',
        proceedToPayment: '继续支付',
        amount: '金额',
        rate: '费率'
      },
      
      // Errors
      errors: {
        enterUrl: '请输入 LinkedIn URL',
        connectWallet: '请先连接您的钱包',
        extractionFailed: '提取失败',
        noResultsFound: '未找到联系信息',
        unknownError: '发生未知错误',
        walletConnection: '连接钱包失败'
      },
      
      // Feedback messages
      feedback: {
        enterUrl: '请输入 LinkedIn URL',
        invalidUrl: '请输入有效的 LinkedIn 个人资料 URL',
        apiNotConfigured: 'API 未配置。请检查您的设置。',
        extracting: '正在提取联系信息...',
        successExtract: '联系信息提取成功！',
        failedExtract: '联系信息提取失败',
        and: '和',
        email_one: '{{count}} 封电子邮件',
        email_other: '{{count}} 封电子邮件',
        phone_one: '{{count}} 个电话',
        phone_other: '{{count}} 个电话',
        foundDetails: '找到 {{details}}',
        limitedInfo: '可用信息有限'
      },
      
      // Extraction section
      extraction: {
        title: '提取 LinkedIn 联系人',
        subtitle: '输入 LinkedIn 个人资料 URL 以提取联系信息'
      }
    }
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n; 