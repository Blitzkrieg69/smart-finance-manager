const express = require('express');
const router = express.Router();
const Goal = require('../models/Goals'); // Note: Your file might be named 'Goals.js' or 'Goal.js' check exact name
const { requireAuth } = require('../middleware/authMiddleware');
const { validateGoal } = require('../middleware/validation');

// GET ALL
router.get('/', requireAuth, async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.session.userId });
        res.json(goals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE
router.post('/', requireAuth, validateGoal, async (req, res) => {
    try {
        const newGoal = new Goal({
            ...req.body,
            userId: req.session.userId
        });
        await newGoal.save();
        res.status(201).json(newGoal);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE
router.put('/:id', requireAuth, validateGoal, async (req, res) => {
    try {
        const updated = await Goal.findOneAndUpdate(
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
        await Goal.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
