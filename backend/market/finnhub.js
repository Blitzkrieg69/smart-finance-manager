const axios = require('axios');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

// --- STOCK SEARCH ---
async function searchStock(query) {
  try {
    const res = await axios.get(`${BASE_URL}/search`, {
      params: { q: query, token: FINNHUB_API_KEY }
    });

    const results = (res.data?.result || [])
      .map(item => ({
        name: item.description || item.displaySymbol,
        symbol: item.symbol,
        category: 'Stock',
        exchange: item.displaySymbol?.includes('.') ? item.displaySymbol.split('.')[1] : 'US',
        provider: 'finnhub',
        providerId: item.symbol,
        currency: 'USD'
      }));

    return results.slice(0, 20);
  } catch (err) {
    console.error('❌ Finnhub stock search error:', err.message);
    return [];
  }
}

// --- CRYPTO SEARCH ---
async function searchCrypto(query) {
  try {
    const res = await axios.get(`${BASE_URL}/crypto/symbol`, {
      params: { exchange: 'binance', token: FINNHUB_API_KEY }
    });

    const q = query.toLowerCase();
    const results = (res.data || [])
      .filter(item => {
        const desc = (item.description || '').toLowerCase();
        const sym = (item.baseSymbol || item.symbol || '').toLowerCase();
        return desc.includes(q) || sym.includes(q);
      })
      .map(item => {
        const rawSymbol = item.symbol || item.baseSymbol || 'UNKNOWN'
        // Avoid double-prefixing if Finnhub already returns "BINANCE:BTCUSDC"
        const providerId = rawSymbol.startsWith('BINANCE:')
          ? rawSymbol
          : `BINANCE:${rawSymbol}`
        return {
          name: item.description || item.baseSymbol || 'Unknown',
          symbol: item.symbol || item.baseSymbol || 'UNKNOWN',
          category: 'Crypto',
          exchange: 'Binance',
          provider: 'finnhub',
          providerId,
          currency: 'USD'
        }
      });

    return results.slice(0, 20);
  } catch (err) {
    console.error('❌ Finnhub crypto search error:', err.message);
    return [];
  }
}


// --- STOCK QUOTE ---
async function getStockQuote(symbol) {
  try {
    const res = await axios.get(`${BASE_URL}/quote`, {
      params: { symbol, token: FINNHUB_API_KEY }
    });

    return {
      symbol,
      price: res.data?.c || 0,
      timestamp: Date.now()
    };
  } catch (err) {
    console.error(`❌ Finnhub stock quote error (${symbol}):`, err.message);
    return { symbol, price: 0, timestamp: Date.now() };
  }
}

// --- CRYPTO QUOTE (Binance public API — no key needed) ---
async function getCryptoQuote(providerId) {
  try {
    if (!providerId) return { symbol: providerId, price: 0, timestamp: Date.now() }

    // providerId = "BINANCE:BTCUSDC" → extract "BTCUSDC"
    const rawSymbol = providerId.startsWith('BINANCE:')
      ? providerId.replace('BINANCE:', '')
      : providerId

    const res = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: { symbol: rawSymbol }   // e.g. BTCUSDC
    })

    const price = parseFloat(res.data?.price)
    if (price && price > 0) {
      console.log(`✅ Crypto quote via Binance (${rawSymbol}): $${price}`)
      return { symbol: providerId, price, timestamp: Date.now() }
    }

    console.warn(`⚠️ Binance returned no price for ${rawSymbol}`)
    return { symbol: providerId, price: 0, timestamp: Date.now() }

  } catch (err) {
    console.error(`❌ Binance crypto price error (${providerId}):`, err.message)
    return { symbol: providerId, price: 0, timestamp: Date.now() }
  }
}


module.exports = {
  searchStock,
  searchCrypto,
  getStockQuote,
  getCryptoQuote
};
