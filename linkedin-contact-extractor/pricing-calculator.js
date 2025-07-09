#!/usr/bin/env node

// Pricing Calculator for LinkedIn Contact Extractor - Pay As You Go Model

const WIZA_COSTS = {
  emailCredits: 2,
  phoneCredits: 5,
  creditPrice: 0.0045
};

// Our pricing model
const OUR_PRICING = {
  creditsPerEmail: 1,
  creditsPerPhone: 2,
  creditsPerUsdt: 30,
  minDeposit: 10
};

const WIZA_COST_EMAIL = WIZA_COSTS.emailCredits * WIZA_COSTS.creditPrice;
const WIZA_COST_PHONE = WIZA_COSTS.phoneCredits * WIZA_COSTS.creditPrice;
const WIZA_COST_BOTH = WIZA_COST_EMAIL + WIZA_COST_PHONE;

const OUR_PRICE_EMAIL = OUR_PRICING.creditsPerEmail / OUR_PRICING.creditsPerUsdt;
const OUR_PRICE_PHONE = OUR_PRICING.creditsPerPhone / OUR_PRICING.creditsPerUsdt;
const OUR_PRICE_BOTH = OUR_PRICE_EMAIL + OUR_PRICE_PHONE;

console.log('LinkedIn Contact Extractor - Pay As You Go Pricing Calculator\n');

console.log('=== Wiza API Costs ===');
console.log(`Email extraction: ${WIZA_COSTS.emailCredits} credits × $${WIZA_COSTS.creditPrice} = $${WIZA_COST_EMAIL.toFixed(4)}`);
console.log(`Phone extraction: ${WIZA_COSTS.phoneCredits} credits × $${WIZA_COSTS.creditPrice} = $${WIZA_COST_PHONE.toFixed(4)}`);
console.log(`Both email + phone: $${WIZA_COST_BOTH.toFixed(4)}\n`);

console.log('=== Our Pricing (Pay Per Result) ===');
console.log(`Credits per USDT: ${OUR_PRICING.creditsPerUsdt}`);
console.log(`Email extraction: ${OUR_PRICING.creditsPerEmail} credit = $${OUR_PRICE_EMAIL.toFixed(4)} USDT`);
console.log(`Phone extraction: ${OUR_PRICING.creditsPerPhone} credits = $${OUR_PRICE_PHONE.toFixed(4)} USDT`);
console.log(`Both email + phone: ${OUR_PRICING.creditsPerEmail + OUR_PRICING.creditsPerPhone} credits = $${OUR_PRICE_BOTH.toFixed(4)} USDT\n`);

console.log('=== ROI Analysis ===');
console.log(`Email ROI: ${(OUR_PRICE_EMAIL / WIZA_COST_EMAIL).toFixed(2)}x (${((OUR_PRICE_EMAIL - WIZA_COST_EMAIL) / OUR_PRICE_EMAIL * 100).toFixed(1)}% margin)`);
console.log(`Phone ROI: ${(OUR_PRICE_PHONE / WIZA_COST_PHONE).toFixed(2)}x (${((OUR_PRICE_PHONE - WIZA_COST_PHONE) / OUR_PRICE_PHONE * 100).toFixed(1)}% margin)`);
console.log(`Combined ROI: ${(OUR_PRICE_BOTH / WIZA_COST_BOTH).toFixed(2)}x (${((OUR_PRICE_BOTH - WIZA_COST_BOTH) / OUR_PRICE_BOTH * 100).toFixed(1)}% margin)\n`);

console.log('=== Deposit Examples ===');
console.log('Deposit  | Credits | Min Extractions | Max Extractions');
console.log('---------|---------|-----------------|----------------');

[10, 20, 50, 100, 500, 1000].forEach(deposit => {
  const credits = deposit * OUR_PRICING.creditsPerUsdt;
  const minExtractions = Math.floor(credits / (OUR_PRICING.creditsPerEmail + OUR_PRICING.creditsPerPhone));
  const maxExtractions = Math.floor(credits / OUR_PRICING.creditsPerEmail);
  
  console.log(
    `$${deposit}`.padEnd(8) + ' | ' +
    `${credits}`.padEnd(7) + ' | ' +
    `${minExtractions}`.padEnd(15) + ' | ' +
    `${maxExtractions}`
  );
});

console.log('\n=== Usage Scenarios ===');
console.log('Scenario              | Results Found           | Credits Used | Cost    | Your Profit');
console.log('----------------------|-------------------------|--------------|---------|------------');

const scenarios = [
  { name: '100% Success', emails: 100, phones: 100 },
  { name: 'Email Only', emails: 100, phones: 0 },
  { name: 'Phone Only', emails: 0, phones: 100 },
  { name: '50% Email, 100% Phone', emails: 50, phones: 100 },
  { name: '100% Email, 50% Phone', emails: 100, phones: 50 },
  { name: 'No Results', emails: 0, phones: 0 }
];

scenarios.forEach(scenario => {
  const creditsUsed = (scenario.emails * OUR_PRICING.creditsPerEmail) + (scenario.phones * OUR_PRICING.creditsPerPhone);
  const revenue = creditsUsed / OUR_PRICING.creditsPerUsdt;
  const wizaCost = (scenario.emails * WIZA_COST_EMAIL) + (scenario.phones * WIZA_COST_PHONE);
  const profit = revenue - wizaCost;
  
  console.log(
    `${scenario.name.padEnd(21)} | ` +
    `${scenario.emails}E, ${scenario.phones}P`.padEnd(23) + ' | ' +
    `${creditsUsed}`.padEnd(12) + ' | ' +
    `$${revenue.toFixed(2)}`.padEnd(7) + ' | ' +
    `$${profit.toFixed(2)}`
  );
});

console.log('\n=== Key Benefits of Pay-As-You-Go ===');
console.log('1. Users only pay for successful extractions');
console.log('2. No charge for profiles without contact info');
console.log('3. Transparent pricing based on actual results');
console.log('4. Lower barrier to entry ($10 minimum vs fixed packages)');
console.log('5. Better for users with varying extraction success rates');

console.log('\n=== Monthly Revenue Projections ===');
console.log('Extractions/Month | Avg Results | Revenue  | Costs   | Profit');
console.log('------------------|-------------|----------|---------|--------');

const projections = [
  { monthly: 1000, emailRate: 0.7, phoneRate: 0.5 },
  { monthly: 5000, emailRate: 0.7, phoneRate: 0.5 },
  { monthly: 10000, emailRate: 0.7, phoneRate: 0.5 },
  { monthly: 50000, emailRate: 0.7, phoneRate: 0.5 }
];

projections.forEach(proj => {
  const emails = Math.floor(proj.monthly * proj.emailRate);
  const phones = Math.floor(proj.monthly * proj.phoneRate);
  const revenue = (emails * OUR_PRICE_EMAIL) + (phones * OUR_PRICE_PHONE);
  const costs = (emails * WIZA_COST_EMAIL) + (phones * WIZA_COST_PHONE);
  const profit = revenue - costs;
  
  console.log(
    `${proj.monthly}`.padEnd(17) + ' | ' +
    `${(proj.emailRate * 100).toFixed(0)}%E, ${(proj.phoneRate * 100).toFixed(0)}%P`.padEnd(11) + ' | ' +
    `$${revenue.toFixed(0)}`.padEnd(8) + ' | ' +
    `$${costs.toFixed(0)}`.padEnd(7) + ' | ' +
    `$${profit.toFixed(0)}`
  );
});

console.log('\n=== Quick Reference ===');
console.log(`- Minimum deposit: $${OUR_PRICING.minDeposit} USDT = ${OUR_PRICING.minDeposit * OUR_PRICING.creditsPerUsdt} credits`);
console.log(`- Cost per email found: $${OUR_PRICE_EMAIL.toFixed(3)} (ROI: ${(OUR_PRICE_EMAIL / WIZA_COST_EMAIL).toFixed(1)}x)`);
console.log(`- Cost per phone found: $${OUR_PRICE_PHONE.toFixed(3)} (ROI: ${(OUR_PRICE_PHONE / WIZA_COST_PHONE).toFixed(1)}x)`);
console.log(`- Average cost per full extraction: $${OUR_PRICE_BOTH.toFixed(3)} (ROI: ${(OUR_PRICE_BOTH / WIZA_COST_BOTH).toFixed(1)}x)`);
console.log(`- No results = No charge (0 credits used)`); 