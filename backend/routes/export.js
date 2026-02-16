const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Investment = require('../models/Investment');
const Goal = require('../models/Goals');
const { requireAuth } = require('../middleware/authMiddleware');

// Helper: Convert to CSV (with empty data handling)
const toCSV = (data, headers) => {
  // If no data, return just headers
  if (!data || data.length === 0) {
    return headers.join(',');
  }
  
  const headerLine = headers.join(',');
  const rows = data.map(row => 
    headers.map(header => {
      const val = row[header];
      // Properly escape commas and quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  
  return [headerLine, ...rows].join('\n');
};

// 1. Export Transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { start_date, end_date } = req.query;

    let query = { userId };
    
    if (start_date && end_date) {
      query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    const data = transactions.map(t => ({
      date: new Date(t.date).toISOString().split('T')[0],
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description || ''
    }));

    const csv = toCSV(data, ['date', 'type', 'category', 'amount', 'description']);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export transactions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Export Budgets
router.get('/budgets', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const budgets = await Budget.find({ userId });
    const transactions = await Transaction.find({ userId, type: 'expense' });

    const categoryExpenses = {};
    transactions.forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + parseFloat(t.amount);
    });

    const data = budgets.map(b => ({
      category: b.category,
      limit: b.limit,
      spent: (categoryExpenses[b.category] || 0).toFixed(2),
      remaining: (b.limit - (categoryExpenses[b.category] || 0)).toFixed(2),
      percentage: ((categoryExpenses[b.category] || 0) / b.limit * 100).toFixed(1) + '%'
    }));

    const csv = toCSV(data, ['category', 'limit', 'spent', 'remaining', 'percentage']);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=budgets.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export budgets error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Export Investments
router.get('/investments', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const investments = await Investment.find({ userId });

    const data = investments.map(inv => {
      const invested = inv.quantity * inv.buy_price;
      const current = inv.quantity * inv.current_price;
      const profitLoss = current - invested;
      const roi = invested > 0 ? (profitLoss / invested * 100).toFixed(2) : '0.00';

      return {
        name: inv.name,
        category: inv.category,
        quantity: inv.quantity,
        buy_price: inv.buy_price,
        current_price: inv.current_price,
        currency: inv.currency,
        total_invested: invested.toFixed(2),
        current_value: current.toFixed(2),
        profit_loss: profitLoss.toFixed(2),
        roi: roi + '%'
      };
    });

    const csv = toCSV(data, ['name', 'category', 'quantity', 'buy_price', 'current_price', 'currency', 'total_invested', 'current_value', 'profit_loss', 'roi']);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=investments.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export investments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Export Goals
router.get('/goals', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const goals = await Goal.find({ userId });

    const data = goals.map(g => ({
      name: g.name,
      target_amount: g.target_amount,
      saved_amount: g.saved_amount,
      remaining: (g.target_amount - g.saved_amount).toFixed(2),
      progress: (g.saved_amount / g.target_amount * 100).toFixed(1) + '%',
      deadline: new Date(g.deadline).toISOString().split('T')[0]
    }));

    const csv = toCSV(data, ['name', 'target_amount', 'saved_amount', 'remaining', 'progress', 'deadline']);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=goals.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export goals error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Export Analytics (WITH DATE FILTER)
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { start_date, end_date } = req.query;

    let query = { userId };
    if (start_date && end_date) {
      query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    }

    const transactions = await Transaction.find(query);
    
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0.0';

    const data = [
      { metric: 'Date Range', value: start_date && end_date ? `${start_date} to ${end_date}` : 'All Time' },
      { metric: 'Total Income', value: totalIncome.toFixed(2) },
      { metric: 'Total Expenses', value: totalExpenses.toFixed(2) },
      { metric: 'Balance', value: balance.toFixed(2) },
      { metric: 'Savings Rate', value: savingsRate + '%' },
      { metric: 'Transaction Count', value: transactions.length },
      { metric: 'Income Count', value: income.length },
      { metric: 'Expense Count', value: expenses.length }
    ];

    const csv = toCSV(data, ['metric', 'value']);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Export Complete Data (CSV FORMAT - NOT JSON!)
router.get('/complete', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { start_date, end_date } = req.query;

    let query = { userId };
    if (start_date && end_date) {
      query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    const budgets = await Budget.find({ userId });
    const investments = await Investment.find({ userId });
    const goals = await Goal.find({ userId });

    let csvContent = '';

    // === TRANSACTIONS SECTION ===
    csvContent += '=== TRANSACTIONS ===\n';
    csvContent += 'Date,Type,Category,Amount,Description\n';
    if (transactions.length > 0) {
      transactions.forEach(t => {
        const desc = (t.description || '').replace(/"/g, '""');
        csvContent += `${new Date(t.date).toISOString().split('T')[0]},${t.type},${t.category},${t.amount},"${desc}"\n`;
      });
    }
    csvContent += '\n';

    // === BUDGETS SECTION ===
    csvContent += '=== BUDGETS ===\n';
    csvContent += 'Category,Limit,Spent,Remaining,Percentage\n';
    if (budgets.length > 0) {
      const categoryExpenses = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + parseFloat(t.amount);
      });
      budgets.forEach(b => {
        const spent = categoryExpenses[b.category] || 0;
        const remaining = b.limit - spent;
        const percentage = (spent / b.limit * 100).toFixed(1);
        csvContent += `${b.category},${b.limit},${spent.toFixed(2)},${remaining.toFixed(2)},${percentage}%\n`;
      });
    }
    csvContent += '\n';

    // === INVESTMENTS SECTION ===
    csvContent += '=== INVESTMENTS ===\n';
    csvContent += 'Name,Category,Quantity,Buy Price,Current Price,Currency,Invested,Current Value,Profit/Loss,ROI\n';
    if (investments.length > 0) {
      investments.forEach(inv => {
        const invested = inv.quantity * inv.buy_price;
        const current = inv.quantity * inv.current_price;
        const profitLoss = current - invested;
        const roi = invested > 0 ? (profitLoss / invested * 100).toFixed(2) : '0.00';
        csvContent += `${inv.name},${inv.category},${inv.quantity},${inv.buy_price},${inv.current_price},${inv.currency},${invested.toFixed(2)},${current.toFixed(2)},${profitLoss.toFixed(2)},${roi}%\n`;
      });
    }
    csvContent += '\n';

    // === GOALS SECTION ===
    csvContent += '=== GOALS ===\n';
    csvContent += 'Name,Target,Saved,Remaining,Progress,Deadline\n';
    if (goals.length > 0) {
      goals.forEach(g => {
        const remaining = g.target_amount - g.saved_amount;
        const progress = (g.saved_amount / g.target_amount * 100).toFixed(1);
        csvContent += `${g.name},${g.target_amount},${g.saved_amount},${remaining.toFixed(2)},${progress}%,${new Date(g.deadline).toISOString().split('T')[0]}\n`;
      });
    }
    csvContent += '\n';

    // === SUMMARY SECTION ===
    csvContent += '=== SUMMARY ===\n';
    csvContent += 'Metric,Value\n';
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    csvContent += `Date Range,"${start_date && end_date ? `${start_date} to ${end_date}` : 'All Time'}"\n`;
    csvContent += `Total Income,${totalIncome.toFixed(2)}\n`;
    csvContent += `Total Expenses,${totalExpenses.toFixed(2)}\n`;
    csvContent += `Net Balance,${balance.toFixed(2)}\n`;
    csvContent += `Transaction Count,${transactions.length}\n`;
    csvContent += `Budget Categories,${budgets.length}\n`;
    csvContent += `Investments,${investments.length}\n`;
    csvContent += `Goals,${goals.length}\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=complete_export.csv');
    res.send(csvContent);
  } catch (err) {
    console.error('Export complete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
