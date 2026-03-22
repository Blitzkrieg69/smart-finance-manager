const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Investment = require('../models/Investment');
const Goal = require('../models/Goals');
const { requireAuth } = require('../middleware/authMiddleware');

// Helper: Convert to CSV
const toCSV = (data, headers) => {
  if (!data || data.length === 0) return headers.join(',');
  const headerLine = headers.join(',');
  const rows = data.map(row =>
    headers.map(header => {
      const val = row[header];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? '';
    }).join(',')
  );
  return [headerLine, ...rows].join('\n');
};

// Computes all enriched analytics from raw DB data
const computeAnalytics = (transactions, budgets, investments, goals) => {

  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalIncome = income.reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = expenses.reduce((s, t) => s + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  //1. HEALTH SCORE (0–100) 
  // Savings pillar (30pts): >=20% savings rate = full marks
  const savingsPillar = Math.min(30, (savingsRate / 20) * 30);

  // Budget pillar (30pts): avg % of categories under limit
  const categoryExpenses = {};
  expenses.forEach(t => {
    categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + parseFloat(t.amount);
  });
  let budgetPillar = 30; // full marks if no budgets set
  if (budgets.length > 0) {
    const adherenceScores = budgets.map(b => {
      const spent = categoryExpenses[b.category] || 0;
      return spent <= b.limit ? 1 : b.limit / spent; // ratio, capped at 1
    });
    budgetPillar = (adherenceScores.reduce((s, v) => s + v, 0) / adherenceScores.length) * 30;
  }

  // Goals pillar (20pts): avg progress across goals
  let goalsPillar = 20;
  if (goals.length > 0) {
    const avgProgress = goals.reduce((s, g) => s + Math.min(1, g.saved_amount / g.target_amount), 0) / goals.length;
    goalsPillar = avgProgress * 20;
  }

  // Investment pillar (20pts): having investments = good diversification signal
  const investmentPillar = investments.length > 0
    ? Math.min(20, (new Set(investments.map(i => i.category)).size / 3) * 20)
    : 0;

  const healthScore = Math.round(savingsPillar + budgetPillar + goalsPillar + investmentPillar);
  const healthGrade =
    healthScore >= 85 ? 'Excellent' :
    healthScore >= 70 ? 'Good' :
    healthScore >= 50 ? 'Fair' : 'Needs Attention';

  // 2. CASHFLOW (monthly income vs expense for last 6 months)
  const cashflow = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const monthIncome = income
      .filter(t => t.date && new Date(t.date).toISOString().slice(0, 7) === key)
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const monthExpense = expenses
      .filter(t => t.date && new Date(t.date).toISOString().slice(0, 7) === key)
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    cashflow.push({
      month: label,
      income: monthIncome.toFixed(2),
      expenses: monthExpense.toFixed(2),
      net: (monthIncome - monthExpense).toFixed(2),
      savings_rate: monthIncome > 0 ? (((monthIncome - monthExpense) / monthIncome) * 100).toFixed(1) + '%' : '0.0%'
    });
  }

  // 3. SPEND TREND (monthly expense per category)
  const spendTrendMap = {};
  expenses.forEach(t => {
    if (!t.date) return;
    const key = new Date(t.date).toISOString().slice(0, 7);
    const label = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!spendTrendMap[key]) spendTrendMap[key] = { month: label };
    const cat = t.category || 'Other';
    spendTrendMap[key][cat] = ((spendTrendMap[key][cat] || 0) + parseFloat(t.amount));
  });
  const spendTrend = Object.keys(spendTrendMap).sort().map(k => {
    const row = spendTrendMap[k];
    // Round all numeric values
    const rounded = { month: row.month };
    Object.keys(row).forEach(key => {
      if (key !== 'month') rounded[key] = parseFloat(row[key]).toFixed(2);
    });
    return rounded;
  });
  const spendTrendCategories = [...new Set(expenses.map(t => t.category || 'Other'))];

  // 4. BUDGET INTELLIGENCE
  const budgetIntelligence = budgets.map(b => {
    const spent = categoryExpenses[b.category] || 0;
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const status = pct >= 100 ? 'Over Budget' : pct >= 80 ? 'Warning' : 'On Track';
    const trend = (() => {
      // Compare last 2 months spend in this category
      const now = new Date();
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      const thisMonthSpend = expenses
        .filter(t => t.category === b.category && t.date && new Date(t.date).toISOString().slice(0, 7) === thisMonthKey)
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      const lastMonthSpend = expenses
        .filter(t => t.category === b.category && t.date && new Date(t.date).toISOString().slice(0, 7) === lastMonthKey)
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      if (lastMonthSpend === 0) return 'No Prior Data';
      const change = ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100;
      return change > 10 ? `Up ${change.toFixed(1)}%` : change < -10 ? `Down ${Math.abs(change).toFixed(1)}%` : 'Stable';
    })();
    return {
      category: b.category,
      budget_limit: b.limit.toFixed(2),
      total_spent: spent.toFixed(2),
      remaining: (b.limit - spent).toFixed(2),
      utilization: pct.toFixed(1) + '%',
      status,
      monthly_trend: trend
    };
  });

  // 5. SMART INSIGHTS
  const insights = [];

  // Savings rate insight
  if (savingsRate >= 20) insights.push(`Strong savings rate of ${savingsRate.toFixed(1)}% — above the recommended 20% threshold.`);
  else if (savingsRate > 0) insights.push(`Savings rate is ${savingsRate.toFixed(1)}% — consider targeting 20% for better financial health.`);
  else insights.push('Expenses exceed income in this period. Review spending to restore positive cashflow.');

  // Top spending category
  const topCat = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];
  if (topCat) insights.push(`Highest spend category: ${topCat[0]} at ${parseFloat(topCat[1]).toFixed(2)} (${totalExpenses > 0 ? ((topCat[1] / totalExpenses) * 100).toFixed(1) : 0}% of total expenses).`);

  // Over-budget categories
  const overBudget = budgetIntelligence.filter(b => b.status === 'Over Budget');
  if (overBudget.length > 0) insights.push(`${overBudget.length} category(s) over budget: ${overBudget.map(b => b.category).join(', ')}.`);
  else if (budgets.length > 0) insights.push('All budget categories are within limits.');

  // Goals on track
  const nearGoals = goals.filter(g => (g.saved_amount / g.target_amount) >= 0.8);
  if (nearGoals.length > 0) insights.push(`${nearGoals.length} goal(s) are 80%+ complete: ${nearGoals.map(g => g.name).join(', ')}.`);

  // Investment diversity
  if (investments.length === 0) insights.push('No investments recorded. Consider diversifying with stocks, mutual funds, or crypto.');
  else {
    const categories = [...new Set(investments.map(i => i.category))];
    insights.push(`Portfolio spans ${categories.length} asset class(es): ${categories.join(', ')}.`);
  }

  // Health score insight
  insights.push(`Overall financial health score: ${healthScore}/100 (${healthGrade}).`);

  return {
    healthScore, healthGrade, savingsRate,
    totalIncome, totalExpenses, balance,
    cashflow, spendTrend, spendTrendCategories,
    budgetIntelligence, insights,
    categoryExpenses
  };
};


// 1. Export Transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { start_date, end_date } = req.query;
    let query = { userId };
    if (start_date && end_date) query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };

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
        name: inv.name, category: inv.category, quantity: inv.quantity,
        buy_price: inv.buy_price, current_price: inv.current_price, currency: inv.currency,
        total_invested: invested.toFixed(2), current_value: current.toFixed(2),
        profit_loss: profitLoss.toFixed(2), roi: roi + '%'
      };
    });

    const csv = toCSV(data, ['name', 'category', 'quantity', 'buy_price', 'current_price', 'currency', 'total_invested', 'current_value', 'profit_loss', 'roi']);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=investments.csv');
    res.send(csv);
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
});

// 5. Export Analytics
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { start_date, end_date } = req.query;

    let query = { userId };
    if (start_date && end_date) query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };

    const [transactions, budgets, investments, goals] = await Promise.all([
      Transaction.find(query),
      Budget.find({ userId }),
      Investment.find({ userId }),
      Goal.find({ userId })
    ]);

    const a = computeAnalytics(transactions, budgets, investments, goals);
    const dateRange = start_date && end_date ? `${start_date} to ${end_date}` : 'All Time';

    let csv = '';

    // ── Summary ──
    csv += '=== SUMMARY ===\n';
    csv += toCSV([
      { metric: 'Date Range', value: dateRange },
      { metric: 'Total Income', value: a.totalIncome.toFixed(2) },
      { metric: 'Total Expenses', value: a.totalExpenses.toFixed(2) },
      { metric: 'Net Balance', value: a.balance.toFixed(2) },
      { metric: 'Savings Rate', value: a.savingsRate.toFixed(1) + '%' },
      { metric: 'Transaction Count', value: transactions.length },
    ], ['metric', 'value']);
    csv += '\n\n';

    // ── Health Score ──
    csv += '=== FINANCIAL HEALTH SCORE ===\n';
    csv += toCSV([
      { metric: 'Health Score', value: `${a.healthScore}/100` },
      { metric: 'Grade', value: a.healthGrade },
      { metric: 'Savings Rate', value: a.savingsRate.toFixed(1) + '%' },
      { metric: 'Budget Categories Tracked', value: budgets.length },
      { metric: 'Goals Active', value: goals.length },
      { metric: 'Investment Asset Classes', value: [...new Set(investments.map(i => i.category))].length }
    ], ['metric', 'value']);
    csv += '\n\n';

    // ── Smart Insights ──
    csv += '=== SMART INSIGHTS ===\n';
    csv += toCSV(a.insights.map((insight, i) => ({ '#': i + 1, insight })), ['#', 'insight']);
    csv += '\n\n';

    // ── Cashflow ──
    csv += '=== CASHFLOW (LAST 6 MONTHS) ===\n';
    csv += toCSV(a.cashflow, ['month', 'income', 'expenses', 'net', 'savings_rate']);
    csv += '\n\n';

    // ── Budget Intelligence ──
    csv += '=== BUDGET INTELLIGENCE ===\n';
    if (a.budgetIntelligence.length > 0) {
      csv += toCSV(a.budgetIntelligence, ['category', 'budget_limit', 'total_spent', 'remaining', 'utilization', 'status', 'monthly_trend']);
    } else {
      csv += 'No budgets configured.\n';
    }
    csv += '\n\n';

    // ── Spend Trend ──
    csv += '=== SPEND TREND (BY CATEGORY & MONTH) ===\n';
    if (a.spendTrend.length > 0) {
      const trendHeaders = ['month', ...a.spendTrendCategories];
      csv += toCSV(a.spendTrend, trendHeaders);
    } else {
      csv += 'No expense data available.\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Export Complete — analytics sections appended after existing sections
router.get('/complete', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { start_date, end_date } = req.query;

    let query = { userId };
    if (start_date && end_date) query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };

    const [transactions, budgets, investments, goals] = await Promise.all([
      Transaction.find(query).sort({ date: -1 }),
      Budget.find({ userId }),
      Investment.find({ userId }),
      Goal.find({ userId })
    ]);

    const a = computeAnalytics(transactions, budgets, investments, goals);
    const dateRange = start_date && end_date ? `${start_date} to ${end_date}` : 'All Time';

    let csv = '';

    // === TRANSACTIONS ===
    csv += '=== TRANSACTIONS ===\n';
    csv += 'Date,Type,Category,Amount,Description\n';
    transactions.forEach(t => {
      const desc = (t.description || '').replace(/"/g, '""');
      csv += `${new Date(t.date).toISOString().split('T')[0]},${t.type},${t.category},${t.amount},"${desc}"\n`;
    });
    csv += '\n';

    // === BUDGETS ===
    csv += '=== BUDGETS ===\n';
    csv += 'Category,Limit,Spent,Remaining,Percentage\n';
    budgets.forEach(b => {
      const spent = a.categoryExpenses[b.category] || 0;
      csv += `${b.category},${b.limit},${spent.toFixed(2)},${(b.limit - spent).toFixed(2)},${(spent / b.limit * 100).toFixed(1)}%\n`;
    });
    csv += '\n';

    // === INVESTMENTS ===
    csv += '=== INVESTMENTS ===\n';
    csv += 'Name,Category,Quantity,Buy Price,Current Price,Currency,Invested,Current Value,Profit/Loss,ROI\n';
    investments.forEach(inv => {
      const invested = inv.quantity * inv.buy_price;
      const current = inv.quantity * inv.current_price;
      const pl = current - invested;
      const roi = invested > 0 ? (pl / invested * 100).toFixed(2) : '0.00';
      csv += `${inv.name},${inv.category},${inv.quantity},${inv.buy_price},${inv.current_price},${inv.currency},${invested.toFixed(2)},${current.toFixed(2)},${pl.toFixed(2)},${roi}%\n`;
    });
    csv += '\n';

    // === GOALS ===
    csv += '=== GOALS ===\n';
    csv += 'Name,Target,Saved,Remaining,Progress,Deadline\n';
    goals.forEach(g => {
      csv += `${g.name},${g.target_amount},${g.saved_amount},${(g.target_amount - g.saved_amount).toFixed(2)},${(g.saved_amount / g.target_amount * 100).toFixed(1)}%,${new Date(g.deadline).toISOString().split('T')[0]}\n`;
    });
    csv += '\n';

    // === FINANCIAL HEALTH SCORE ===
    csv += '=== FINANCIAL HEALTH SCORE ===\n';
    csv += `Health Score,${a.healthScore}/100\n`;
    csv += `Grade,${a.healthGrade}\n`;
    csv += `Savings Rate,${a.savingsRate.toFixed(1)}%\n`;
    csv += '\n';

    // === SMART INSIGHTS ===
    csv += '=== SMART INSIGHTS ===\n';
    csv += '#,Insight\n';
    a.insights.forEach((insight, i) => { csv += `${i + 1},"${insight.replace(/"/g, '""')}"\n`; });
    csv += '\n';

    // === CASHFLOW ===
    csv += '=== CASHFLOW (LAST 6 MONTHS) ===\n';
    csv += 'Month,Income,Expenses,Net,Savings Rate\n';
    a.cashflow.forEach(row => {
      csv += `${row.month},${row.income},${row.expenses},${row.net},${row.savings_rate}\n`;
    });
    csv += '\n';

    // === BUDGET INTELLIGENCE ===
    csv += '=== BUDGET INTELLIGENCE ===\n';
    if (a.budgetIntelligence.length > 0) {
      csv += 'Category,Limit,Spent,Remaining,Utilization,Status,Monthly Trend\n';
      a.budgetIntelligence.forEach(b => {
        csv += `${b.category},${b.budget_limit},${b.total_spent},${b.remaining},${b.utilization},${b.status},${b.monthly_trend}\n`;
      });
    } else {
      csv += 'No budgets configured.\n';
    }
    csv += '\n';

    // === SPEND TREND ===
    csv += '=== SPEND TREND (BY CATEGORY & MONTH) ===\n';
    if (a.spendTrend.length > 0) {
      const trendHeaders = ['month', ...a.spendTrendCategories];
      csv += trendHeaders.join(',') + '\n';
      a.spendTrend.forEach(row => {
        csv += trendHeaders.map(h => row[h] ?? '0.00').join(',') + '\n';
      });
    } else {
      csv += 'No expense data available.\n';
    }
    csv += '\n';

    // === SUMMARY ===
    csv += '=== SUMMARY ===\n';
    csv += `Date Range,"${dateRange}"\n`;
    csv += `Total Income,${a.totalIncome.toFixed(2)}\n`;
    csv += `Total Expenses,${a.totalExpenses.toFixed(2)}\n`;
    csv += `Net Balance,${a.balance.toFixed(2)}\n`;
    csv += `Transaction Count,${transactions.length}\n`;
    csv += `Budget Categories,${budgets.length}\n`;
    csv += `Investments,${investments.length}\n`;
    csv += `Goals,${goals.length}\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=complete_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export complete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
