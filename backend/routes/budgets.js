const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateBudget } = require('../middleware/validation');

// Helper: Get date range for budget period
const getDateRangeForPeriod = (period) => {
    const now = new Date();
    let startDate;

    if (period === 'Weekly') {
        // Start of current week (Monday)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'Yearly') {
        // Start of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
    } else {
        // Default: Monthly - Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
    }

    return {
        startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
        endDate: now.toISOString().split('T')[0]
    };
};

// GET ALL (User Scoped + Period-Aware Spent Calculation)
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const budgets = await Budget.find({ userId });
        
        // Calculate "spent" amount dynamically for CURRENT period only
        const budgetData = await Promise.all(budgets.map(async (b) => {
            const period = b.period || 'Monthly';
            const { startDate, endDate } = getDateRangeForPeriod(period);
            
            const expenses = await Transaction.find({
                userId,
                type: 'expense',
                category: b.category,
                date: { $gte: startDate, $lte: endDate } // ✅ Filter by current period
            });
            
            const spent = expenses.reduce((sum, txn) => sum + txn.amount, 0);
            return { ...b._doc, spent };
        }));

        res.json(budgetData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE
router.post('/', requireAuth, validateBudget, async (req, res) => {
    try {
        const newBudget = new Budget({
            ...req.body,
            userId: req.session.userId
        });
        await newBudget.save();
        res.status(201).json(newBudget);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE
router.put('/:id', requireAuth, validateBudget, async (req, res) => {
    try {
        const updated = await Budget.findOneAndUpdate(
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
        const deleted = await Budget.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        if (!deleted) return res.status(404).json({ error: "Not Found" });
        res.json({ message: 'Budget Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
