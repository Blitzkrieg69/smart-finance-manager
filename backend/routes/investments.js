const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
let yahooFinance;

try {
  yahooFinance = require('yahoo-finance2').default;
} catch (err) {
  console.log("Yahoo Finance not installed");
}

// --- 1. SEARCH ROUTE (MUST BE FIRST) ---
router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  console.log("Backend received search for:", query); // <--- DEBUG LOG

  if (yahooFinance) {
    try {
      const results = await yahooFinance.search(query);
      if (results.quotes.length > 0) {
        return res.json(results.quotes.filter(q => q.isYahooFinance).map(q => ({
          name: q.shortname || q.symbol,
          symbol: q.symbol,
          category: 'Stock', // Simplified for testing
          exchange: q.exchDisp
        })));
      }
    } catch (e) { console.log("Yahoo failed, using backup"); }
  }

  // Backup Data
  const backup = [
    { name: 'Apple', symbol: 'AAPL', category: 'Stock' },
    { name: 'Tesla', symbol: 'TSLA', category: 'Stock' },
    { name: 'Bitcoin', symbol: 'BTC-USD', category: 'Crypto' }
  ];
  res.json(backup.filter(a => a.name.toLowerCase().includes(query.toLowerCase())));
});

// --- 2. GET ALL ROUTE ---
router.get('/', async (req, res) => {
  const investments = await Investment.find();
  res.json({ rate: 84, investments });
});

// --- 3. ADD ROUTE ---
router.post('/', async (req, res) => {
  try {
    const newInv = new Investment(req.body);
    await newInv.save();
    res.status(201).json(newInv);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// --- 4. UPDATE & DELETE ROUTES ---
router.put('/:id', async (req, res) => {
  await Investment.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Updated" });
});

router.delete('/:id', async (req, res) => {
  await Investment.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;