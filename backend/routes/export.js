const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

router.post('/', async (req, res) => {
  try {
    const { start_date, end_date, type } = req.body;

    const start = new Date(start_date);
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);

    let query = { date: { $gte: start, $lte: end } };
    if (type !== 'all') query.type = type;

    const transactions = await Transaction.find(query).sort({ date: -1 });

    const headers = ["Date", "Title", "Amount", "Type", "Category", "Description"];
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      `"${t.title.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
    res.status(200).send(csvContent);

  } catch (err) {
    res.status(500).json({ message: "Export failed" });
  }
});

module.exports = router;
