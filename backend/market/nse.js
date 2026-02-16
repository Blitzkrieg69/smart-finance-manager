const axios = require('axios');

// NSE requires headers to prevent blocking
const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.nseindia.com/'
};

// --- INDIAN STOCK SEARCH ---
async function searchIndianStock(query) {
  try {
    const searchQuery = query.toUpperCase().trim();
    
    // NSE search API
    const res = await axios.get('https://www.nseindia.com/api/search/autocomplete', {
      params: { q: searchQuery },
      headers: NSE_HEADERS,
      timeout: 5000
    });

    const symbols = res.data?.symbols || [];
    
    const results = symbols
      .filter(item => item.symbol) // Has a symbol
      .map(item => ({
        name: item.symbol_info || item.symbol,
        symbol: `${item.symbol}.NS`, // Add .NS for NSE
        category: 'Stock',
        exchange: 'NSE',
        provider: 'nse',
        providerId: `${item.symbol}.NS`,
        currency: 'INR'
      }));

    console.log(`✅ NSE found ${results.length} stocks for "${query}"`);
    return results.slice(0, 20);
    
  } catch (err) {
    console.error('❌ NSE search error:', err.message);
    
    // Fallback: Return hardcoded popular stocks
    console.log('📋 Using fallback popular stocks');
    const popularStocks = [
      { name: 'Reliance Industries', symbol: 'RELIANCE.NS' },
      { name: 'TCS', symbol: 'TCS.NS' },
      { name: 'HDFC Bank', symbol: 'HDFCBANK.NS' },
      { name: 'Infosys', symbol: 'INFY.NS' },
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS' },
      { name: 'Bharti Airtel', symbol: 'BHARTIARTL.NS' },
      { name: 'ITC', symbol: 'ITC.NS' },
      { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK.NS' },
      { name: 'Hindustan Unilever', symbol: 'HINDUNILVR.NS' },
      { name: 'State Bank of India', symbol: 'SBIN.NS' }
    ].filter(stock => 
      stock.name.toLowerCase().includes(query.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(query.toLowerCase())
    ).map(stock => ({
      name: stock.name,
      symbol: stock.symbol,
      category: 'Stock',
      exchange: 'NSE',
      provider: 'nse',
      providerId: stock.symbol,
      currency: 'INR'
    }));
    
    return popularStocks;
  }
}

// --- INDIAN STOCK QUOTE ---
async function getIndianStockQuote(symbol) {
  try {
    // Remove .NS or .BO suffix for NSE API
    const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
    
    // NSE quote API
    const res = await axios.get(`https://www.nseindia.com/api/quote-equity?symbol=${cleanSymbol}`, {
      headers: NSE_HEADERS,
      timeout: 5000
    });

    const price = parseFloat(res.data?.priceInfo?.lastPrice || 0);
    console.log(`✅ NSE quote for ${symbol}: ₹${price}`);
    
    return {
      symbol,
      price,
      timestamp: Date.now()
    };
    
  } catch (err) {
    console.error(`❌ NSE quote error (${symbol}):`, err.message);
    return { symbol, price: 0, timestamp: Date.now() };
  }
}

module.exports = {
  searchIndianStock,
  getIndianStockQuote
};
