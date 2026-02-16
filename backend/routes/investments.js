const express = require('express');
const router = express.Router();

const Investment = require('../models/Investment');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateInvestment } = require('../middleware/validation');

const market = require('../market');

// SEARCH (Public/Authenticated)
router.get('/search', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const type = String(req.query.type || '').trim(); // 'crypto' | 'in' | 'us' | ''
        const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 50);

        if (!q) return res.json([]);

        const results = await market.search({ q, type, limit });
        return res.json(results);
    } catch (err) {
        console.error('Search error:', err.message);
        return res.status(500).json({ error: 'Search failed' });
    }
});

// GET ALL (User Scoped)
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const investments = await Investment.find({ userId });
        res.json({ investments, rate: 84 }); // rate hardcoded for now
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REFRESH LIVE PRICES (User Scoped)
// POST /api/investments/refresh
router.post('/refresh', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const investments = await Investment.find({ userId });

        if (!investments.length) {
            return res.json({ success: true, investments: [], rate: 84 });
        }

        // Each investment must store provider + providerId (from /search selection)
        const updates = [];
        for (const inv of investments) {
            const quote = await market.getQuote(inv);
            updates.push({
                ...inv.toObject(),
                current_price: quote.price,
                exchange: quote.exchange || ''
            });
        }

        // Persist updates
        const ops = updates.map(u => ({
            updateOne: {
                filter: { _id: u._id, userId },
                update: { $set: { current_price: u.current_price, exchange: u.exchange || '' } }
            }
        }));

        if (ops.length) await Investment.bulkWrite(ops);

        const updated = await Investment.find({ userId });
        res.json({ success: true, investments: updated, rate: 84 });
    } catch (err) {
        console.error('Refresh error:', err.message);
        res.status(500).json({ error: 'Failed to refresh prices' });
    }
});

// CREATE
router.post('/', requireAuth, validateInvestment, async (req, res) => {
    try {
        // Frontend should send provider + providerId from /search result
        console.log('📥 Received investment data:', req.body);
        const newInv = new Investment({
            ...req.body,
            exchange: req.body.category === 'Crypto' ? '' : (req.body.exchange || ''),
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
        const payload = {
            ...req.body,
            exchange: req.body.category === 'Crypto' ? '' : (req.body.exchange || '')
        };

        const updated = await Investment.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            payload,
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Not Found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await Investment.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
