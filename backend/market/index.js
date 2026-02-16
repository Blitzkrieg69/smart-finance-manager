const finnhub = require('./finnhub');
const nse = require('./nse'); // Changed from yahoo

module.exports = {
  search: async ({ q, type = '' }) => {
    console.log('🔍 SEARCH REQUEST:', { query: q, type });
    
    if (type === 'crypto') {
      console.log('➡️  Calling Finnhub Crypto API');
      return finnhub.searchCrypto(q);
    }
    
    if (type === 'in') {
      console.log('➡️  Calling NSE India API');
      return nse.searchIndianStock(q);
    }
    
    if (type === 'us') {
      console.log('➡️  Calling Finnhub Stock (USA) API');
      return finnhub.searchStock(q);
    }
    
    console.log('⚠️  No type specified, returning empty');
    return [];
  },
  
  getQuote: async (investment) => {
    if (investment.category === 'Crypto') {
      console.log('📊 Quote: Using Finnhub Crypto');
      return finnhub.getCryptoQuote(investment.providerId);
    }
    if (investment.provider === 'nse' || investment.currency === 'INR') {
      console.log('📊 Quote: Using NSE India');
      return nse.getIndianStockQuote(investment.providerId);
    }
    console.log('📊 Quote: Using Finnhub Stock');
    return finnhub.getStockQuote(investment.providerId);
  }
};
