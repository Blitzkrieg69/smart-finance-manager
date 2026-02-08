const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateInvestment } = require('../middleware/validation');

// Try to load Yahoo Finance
let yahooFinance;
try {
    yahooFinance = require('yahoo-finance2').default;
} catch (err) {
    console.warn("⚠️ Yahoo Finance not installed. Live prices disabled.");
}

// SEARCH (Public/Authenticated)
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    // 1. Try Real API
    if (yahooFinance) {
        try {
            const results = await yahooFinance.search(query);
            if (results.quotes.length > 0) {
                return res.json(results.quotes
                    .filter(q => q.isYahooFinance)
                    .map(q => ({
                        name: q.shortname || q.longname || q.symbol,
                        symbol: q.symbol,
                        category: q.quoteType === 'CRYPTOCURRENCY' ? 'Crypto' : 'Stock',
                        exchange: q.exchDisp
                    }))
                );
            }
        } catch (e) {
            console.error("Yahoo Search Failed:", e.message);
        }
    }

    // 2. Fallback Data
    const backup = [
        { name: 'Apple Inc.', symbol: 'AAPL', category: 'Stock' },
        { name: 'Microsoft', symbol: 'MSFT', category: 'Stock' },
        { name: 'Bitcoin', symbol: 'BTC-USD', category: 'Crypto' },
        { name: 'Ethereum', symbol: 'ETH-USD', category: 'Crypto' },
        { name: 'Reliance', symbol: 'RELIANCE.NS', category: 'Stock' },
        { name: 'Tata Consultancy', symbol: 'TCS.NS', category: 'Stock' }
    ];
    res.json(backup.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.symbol.toLowerCase().includes(query.toLowerCase())
    ));
});

// GET ALL (User Scoped + Live Prices)
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const investments = await Investment.find({ userId });
        
        // Fetch Live Prices for owned assets
        if (yahooFinance && investments.length > 0) {
            const tickers = [...new Set(investments.map(i => i.ticker))];
            try {
                const quotes = await yahooFinance.quote(tickers);
                // Map results. If single result, it's an object; if multiple, an array.
                const priceMap = {};
                const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
                
                quoteArray.forEach(q => {
                    if(q) priceMap[q.symbol] = q.regularMarketPrice;
                });

                // Update in memory (or DB if you prefer persistence)
                investments.forEach(inv => {
                    if (priceMap[inv.ticker]) {
                        inv.current_price = priceMap[inv.ticker];
                    }
                });
            } catch (e) {
                console.error("Price Fetch Error:", e.message);
            }
        }

        res.json({ investments, rate: 84 }); // Rate hardcoded for now (USD -> INR)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE
router.post('/', requireAuth, validateInvestment, async (req, res) => {
    try {
        const newInv = new Investment({
            ...req.body,
            userId: req.session.userId
        });
        await newInv.save();
        res.status(201).json(newInv);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE
router.put('/:id', requireAuth, validateInvestment, async (req, res) => {
    try {
        const updated = await Investment.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Not Found" });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await Investment.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
