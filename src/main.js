const form = document.querySelector('#calculatorForm');
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const fields = [
  'address',
  'askingPrice',
  'marketPrice',
  'compsAverage',
  'confidence',
  'downPayment',
  'interestRate',
  'loanYears',
  'extraCosts',
  'monthlyRent',
  'monthlyExpenses',
  'salePrice',
  'sellingCosts',
];

function money(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function percent(value) {
  return percentFormatter.format(Number.isFinite(value) ? value : 0);
}

function numberValue(id) {
  const value = Number(document.querySelector(`#${id}`).value);
  return Number.isFinite(value) ? value : 0;
}

function getInputs() {
  return {
    address: document.querySelector('#address').value.trim(),
    askingPrice: numberValue('askingPrice'),
    marketPrice: numberValue('marketPrice'),
    compsAverage: numberValue('compsAverage'),
    confidence: numberValue('confidence') / 100,
    downPayment: numberValue('downPayment'),
    interestRate: numberValue('interestRate') / 100,
    loanYears: numberValue('loanYears'),
    extraCosts: numberValue('extraCosts'),
    monthlyRent: numberValue('monthlyRent'),
    monthlyExpenses: numberValue('monthlyExpenses'),
    salePrice: numberValue('salePrice'),
    sellingCosts: numberValue('sellingCosts') / 100,
  };
}

function calculateLoanPayment(principal, annualRate, years) {
  const months = years * 12;
  if (principal <= 0 || months <= 0) {
    return 0;
  }
  if (annualRate === 0) {
    return principal / months;
  }

  const monthlyRate = annualRate / 12;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

function calculateAnalysis(inputs) {
  const blendedValue = inputs.marketPrice * (1 - inputs.confidence) + inputs.compsAverage * inputs.confidence;
  const loanPrincipal = Math.max(inputs.askingPrice - inputs.downPayment, 0);
  const loanPayment = calculateLoanPayment(loanPrincipal, inputs.interestRate, inputs.loanYears);
  const investedCash = inputs.downPayment + inputs.extraCosts;
  const monthlyCashFlow = inputs.monthlyRent - inputs.monthlyExpenses - loanPayment;
  const annualNetOperatingIncome = Math.max((inputs.monthlyRent - inputs.monthlyExpenses) * 12, 0);
  const capRate = inputs.askingPrice > 0 ? annualNetOperatingIncome / inputs.askingPrice : 0;
  const equityPosition = blendedValue - inputs.askingPrice;
  const netSaleProceeds = inputs.salePrice * (1 - inputs.sellingCosts);
  const saleProfit = netSaleProceeds - loanPrincipal - investedCash;
  const saleRoi = investedCash > 0 ? saleProfit / investedCash : 0;
  const discountToValue = blendedValue - inputs.askingPrice;
  const rentAnnualReturn = investedCash > 0 ? (monthlyCashFlow * 12) / investedCash : 0;

  return {
    blendedValue,
    loanPrincipal,
    loanPayment,
    monthlyCashFlow,
    capRate,
    equityPosition,
    saleProfit,
    saleRoi,
    discountToValue,
    rentAnnualReturn,
  };
}

function setStatus(elementId, value, positiveText, negativeText) {
  const element = document.querySelector(`#${elementId}`);
  element.textContent = value >= 0 ? positiveText : negativeText;
  element.className = value >= 0 ? 'positive' : 'negative';
}

function updateRecommendation(analysis) {
  const badge = document.querySelector('#dealBadge');
  const recommendation = document.querySelector('#recommendationText');

  if (analysis.monthlyCashFlow > 0 && analysis.saleProfit > 0) {
    badge.textContent = 'Strong deal';
    badge.className = 'badge badge-positive';
    recommendation.textContent =
      analysis.rentAnnualReturn >= analysis.saleRoi
        ? 'Rent looks stronger because it produces positive monthly cash flow and a competitive cash-on-cash return.'
        : 'Selling looks stronger because the projected resale profit beats the rental return on invested cash.';
    return;
  }

  if (analysis.monthlyCashFlow > 0) {
    badge.textContent = 'Rent option';
    badge.className = 'badge badge-positive';
    recommendation.textContent = 'Renting is the cleaner option because the sale scenario does not yet show a profit.';
    return;
  }

  if (analysis.saleProfit > 0) {
    badge.textContent = 'Sale option';
    badge.className = 'badge badge-warning';
    recommendation.textContent = 'Selling may work, but rental cash flow is negative at the current financing assumptions.';
    return;
  }

  badge.textContent = 'Needs review';
  badge.className = 'badge badge-negative';
  recommendation.textContent = 'Both rent and sale scenarios are weak. Try a lower purchase price, higher rent, or different financing.';
}

function render() {
  const inputs = getInputs();
  const analysis = calculateAnalysis(inputs);

  document.querySelector('#confidenceValue').textContent = Math.round(inputs.confidence * 100);
  document.querySelector('#resultAddress').textContent = inputs.address || 'No address entered';
  document.querySelector('#heroMarketValue').textContent = money(analysis.blendedValue);
  document.querySelector('#blendedValue').textContent = money(analysis.blendedValue);
  document.querySelector('#equityPosition').textContent = `Equity position: ${money(analysis.equityPosition)}`;
  document.querySelector('#loanPayment').textContent = money(analysis.loanPayment);
  document.querySelector('#loanAmount').textContent = `Loan amount: ${money(analysis.loanPrincipal)}`;
  document.querySelector('#cashFlow').textContent = money(analysis.monthlyCashFlow);
  document.querySelector('#capRate').textContent = `Cap rate: ${percent(analysis.capRate)}`;
  document.querySelector('#saleProfit').textContent = money(analysis.saleProfit);
  document.querySelector('#saleRoi').textContent = `ROI: ${percent(analysis.saleRoi)}`;
  document.querySelector('#discountResult').textContent = money(analysis.discountToValue);
  document.querySelector('#rentResult').textContent = `${money(analysis.monthlyCashFlow)} / mo`;
  document.querySelector('#saleResult').textContent = money(analysis.saleProfit);

  setStatus('discountStatus', analysis.discountToValue, 'Below value', 'Above value');
  setStatus('rentStatus', analysis.monthlyCashFlow, 'Positive cash flow', 'Negative cash flow');
  setStatus('saleStatus', analysis.saleProfit, 'Profitable', 'Loss risk');
  updateRecommendation(analysis);
}

async function lookupAddressPrice(address) {
  // Replace this with a server-side call to your property-data provider.
  // Keep API keys off the browser and return normalized fields such as
  // marketPrice, comparableSalesAverage, rentEstimate, and confidence.
  return { address };
}

fields.forEach((fieldId) => {
  document.querySelector(`#${fieldId}`).addEventListener('input', render);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  lookupAddressPrice(getInputs().address).then(render);
});

render();
