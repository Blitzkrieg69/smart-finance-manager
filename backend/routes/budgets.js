const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction'); // Needed to calculate 'spent'
const { requireAuth } = require('../middleware/authMiddleware');
const { validateBudget } = require('../middleware/validation');

// GET ALL (User Scoped + Calculated Spent)
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const budgets = await Budget.find({ userId });
        
        // Calculate "spent" amount dynamically from transactions
        // (This ensures your progress bars are always accurate)
        const budgetData = await Promise.all(budgets.map(async (b) => {
            const expenses = await Transaction.find({
                userId,
                type: 'expense',
                category: b.category
                // Optional: Add date filtering here if budgets are monthly
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
