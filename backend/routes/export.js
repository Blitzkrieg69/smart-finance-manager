const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateExport } = require('../middleware/validation');

router.post('/', requireAuth, validateExport, async (req, res) => {
    try {
        const { type, start_date, end_date } = req.body;
        const userId = req.session.userId;
        
        // Build Query
        let query = { userId }; // STRICTLY SCOPED TO USER
        
        if (type && type !== 'all') {
            query.type = type;
        }
        
        if (start_date || end_date) {
            query.date = {};
            if (start_date) query.date.$gte = new Date(start_date);
            if (end_date) query.date.$lte = new Date(end_date);
        }
        
        const data = await Transaction.find(query).sort({ date: -1 });
        
        // Generate CSV
        let csv = "Date,Type,Category,Description,Amount\n";
        data.forEach(t => { 
            // Handle commas in description to prevent broken CSVs
            const safeDesc = (t.description || '').replace(/,/g, ' ');
            const dateStr = t.date ? new Date(t.date).toISOString().split('T')[0] : '';
            csv += `${dateStr},${t.type},${t.category},"${safeDesc}",${t.amount}\n`; 
        });
        
        res.header('Content-Type', 'text/csv');
        res.attachment('finance_data.csv');
        res.send(csv);
        
    } catch (err) {
        console.error("Export Error:", err);
        res.status(500).json({ error: "Failed to generate export" });
    }
});

module.exports = router;
