const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateTransaction } = require('../middleware/validation');

// HELPER: Calculate next date
const getNextDate = (date, recurrence) => {
    const newDate = new Date(date);
    if (recurrence === 'Daily') newDate.setDate(newDate.getDate() + 1);
    if (recurrence === 'Weekly') newDate.setDate(newDate.getDate() + 7);
    if (recurrence === 'Monthly') newDate.setMonth(newDate.getMonth() + 1);
    if (recurrence === 'Yearly') newDate.setFullYear(newDate.getFullYear() + 1);
    return newDate;
};

// GET ALL (Scoped to User)
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // 1. Process Recurring Transactions for THIS USER
        const overdue = await Transaction.find({
            userId,
            recurrence: { $ne: 'None' },
            nextDate: { $lte: new Date() }
        });

        for (const txn of overdue) {
            const newDate = txn.nextDate || new Date();
            
            // Create Child
            await Transaction.create({
                userId,
                title: txn.title,
                amount: txn.amount,
                type: txn.type,
                category: txn.category,
                description: txn.description,
                recurrence: txn.recurrence,
                date: newDate,
                nextDate: getNextDate(newDate, txn.recurrence)
            });

            // Stop Parent
            txn.recurrence = 'None';
            txn.nextDate = null;
            await txn.save();
        }

        // 2. Fetch All
        const transactions = await Transaction.find({ userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE (Validated & Authenticated)
router.post('/', requireAuth, validateTransaction, async (req, res) => {
    try {
        const { date, recurrence } = req.body;
        let nextDate = null;
        
        if (recurrence && recurrence !== 'None') {
            nextDate = getNextDate(new Date(date || Date.now()), recurrence);
        }

        const newTxn = new Transaction({
            ...req.body,
            userId: req.session.userId, // Link to User
            nextDate
        });

        await newTxn.save();
        res.status(201).json(newTxn);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE
router.put('/:id', requireAuth, validateTransaction, async (req, res) => {
    try {
        const updated = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId }, // Ensure ownership
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
        const deleted = await Transaction.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        if (!deleted) return res.status(404).json({ error: "Not Found" });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
