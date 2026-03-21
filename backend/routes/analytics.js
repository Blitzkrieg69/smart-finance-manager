const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goals');
const Investment = require('../models/Investment');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getDateRanges,
    calculateIncome,
    calculateExpenses,
    getExpensesByCategory,
    getPercentageChange,
    getSavingsRate,
    findAnomalies,
    calculateBudgetHealthTimeBased,
    calculateGoalScoreTimeBased,
    calculateInvestmentScore
} = require('../utils/calculations');



router.get('/health-score', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const {
            currentMonthStart,
            currentMonthEnd,
            daysElapsedInMonth,
            totalDaysInMonth
        } = getDateRanges();

        const transactions = await Transaction.find({ userId });
        const budgets = await Budget.find({ userId });
        const goals = await Goal.find({ userId });
        const investments = await Investment.find({ userId });

        const income = calculateIncome(transactions, currentMonthStart, currentMonthEnd);
        const expenses = calculateExpenses(transactions, currentMonthStart, currentMonthEnd);
        const savingsRate = getSavingsRate(income, expenses);

        const savingsScore = Math.min(25, (savingsRate / 30) * 25);
        const categoryExpenses = getExpensesByCategory(transactions, currentMonthStart, currentMonthEnd);
        const budgetScore = (calculateBudgetHealthTimeBased(budgets, categoryExpenses, daysElapsedInMonth, totalDaysInMonth) / 100) * 25;
        const goalScore = (calculateGoalScoreTimeBased(goals) / 100) * 25;
        const investmentData = calculateInvestmentScore(investments);
        const investmentScore = investmentData.score;

        const totalScore = Math.round(savingsScore + budgetScore + goalScore + investmentScore);

        res.json({
            score: totalScore,
            breakdown: {
                savings: Math.round(savingsScore),
                budget: Math.round(budgetScore),
                goals: Math.round(goalScore),
                investments: Math.round(investmentScore)
            },
            metrics: {
                savingsRate: savingsRate.toFixed(1),
                monthlyIncome: income.toFixed(2),
                monthlyExpenses: expenses.toFixed(2),
                monthlySavings: (income - expenses).toFixed(2),
                daysElapsed: daysElapsedInMonth,
                daysRemaining: totalDaysInMonth - daysElapsedInMonth
            },
            investmentMetrics: {
                roi: investmentData.roi,
                roiScore: investmentData.roiScore,
                diversificationScore: investmentData.diversificationScore,
                types: investmentData.types,
                typesList: investmentData.typesList,
                totalInvested: investmentData.totalInvested,
                totalCurrentValue: investmentData.totalCurrentValue
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.get('/insights', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const {
            currentMonthStart,
            currentMonthEnd,
            lastMonthStart,
            lastMonthEnd,
            daysRemainingInMonth,
            daysElapsedInMonth,
            totalDaysInMonth
        } = getDateRanges();

        const transactions = await Transaction.find({ userId });
        const budgets = await Budget.find({ userId });
        const investments = await Investment.find({ userId });

        const insights = [];


        // 1. SPENDING COMPARISON
        const currentExpenses = calculateExpenses(transactions, currentMonthStart, currentMonthEnd);
        const lastExpenses = calculateExpenses(transactions, lastMonthStart, lastMonthEnd);
        const expenseChange = getPercentageChange(currentExpenses, lastExpenses);

        if (Math.abs(expenseChange) > 10) {
            const diff = Math.abs(currentExpenses - lastExpenses).toFixed(0);
            insights.push({
                type: expenseChange > 0 ? 'warning' : 'success',
                category: 'spending',
                action: 'transactions',
                icon: expenseChange > 0 ? '⚠️' : '✅',
                message: expenseChange > 0
                    ? `You've spent ₹${diff} more than last month — ${Math.abs(expenseChange).toFixed(0)}% increase. Review your recent transactions.`
                    : `Great! You've spent ₹${diff} less than last month — ${Math.abs(expenseChange).toFixed(0)}% decrease.`
            });
        }


        // 2. INCOME COMPARISON
        const currentIncome = calculateIncome(transactions, currentMonthStart, currentMonthEnd);
        const lastIncome = calculateIncome(transactions, lastMonthStart, lastMonthEnd);
        const incomeChange = getPercentageChange(currentIncome, lastIncome);

        if (Math.abs(incomeChange) > 10) {
            insights.push({
                type: incomeChange > 0 ? 'success' : 'warning',
                category: 'income',
                action: 'transactions',
                icon: incomeChange > 0 ? '🎉' : '⚠️',
                message: incomeChange > 0
                    ? `Income increased by ${Math.abs(incomeChange).toFixed(0)}% vs last month — ₹${Math.abs(currentIncome - lastIncome).toFixed(0)} more earned!`
                    : `Income dropped by ${Math.abs(incomeChange).toFixed(0)}% vs last month — ₹${Math.abs(currentIncome - lastIncome).toFixed(0)} less than usual.`
            });
        }


        // 3. TIME-BASED BUDGET ALERTS
        const categoryExpenses = getExpensesByCategory(transactions, currentMonthStart, currentMonthEnd);

        budgets.forEach(budget => {
            const spent = categoryExpenses[budget.category] || 0;
            const limit = parseFloat(budget.limit);
            const remaining = limit - spent;
            const percentage = (spent / limit) * 100;
            const expectedSpend = (limit / totalDaysInMonth) * daysElapsedInMonth;
            const performance = expectedSpend > 0 ? ((expectedSpend - spent) / expectedSpend) * 100 : 0;
            const dailyRate = daysElapsedInMonth > 0 ? spent / daysElapsedInMonth : 0;
            const projectedTotal = dailyRate * totalDaysInMonth;
            const recommendedDaily = daysRemainingInMonth > 0 ? remaining / daysRemainingInMonth : 0;

            if (percentage >= 100) {
                insights.push({
                    type: 'danger',
                    category: 'budget',
                    action: 'budgets',
                    icon: '🔥',
                    message: `${budget.category} budget exceeded by ₹${(spent - limit).toFixed(0)}! You've spent ₹${spent.toFixed(0)} of ₹${limit.toFixed(0)} limit.`
                });
            } else if (performance < -20) {
                insights.push({
                    type: 'danger',
                    category: 'budget',
                    action: 'budgets',
                    icon: '⚠️',
                    message: `${budget.category} is burning too fast! Projected ₹${projectedTotal.toFixed(0)} by month-end (${((projectedTotal / limit) * 100).toFixed(0)}% of budget). Limit to ₹${recommendedDaily.toFixed(0)}/day.`
                });
            } else if (performance < -10) {
                insights.push({
                    type: 'warning',
                    category: 'budget',
                    action: 'budgets',
                    icon: '⚠️',
                    message: `${budget.category} is ${percentage.toFixed(0)}% used with ${daysRemainingInMonth} days left. Stay under ₹${recommendedDaily.toFixed(0)}/day to finish on budget.`
                });
            } else if (performance > 30 && daysElapsedInMonth > 10) {
                insights.push({
                    type: 'success',
                    category: 'budget',
                    action: 'budgets',
                    icon: '✅',
                    message: `${budget.category} is well under control — only ${percentage.toFixed(0)}% used, ₹${remaining.toFixed(0)} remaining with ${daysRemainingInMonth} days left.`
                });
            }
        });


        // 4. SAVINGS RATE
        const savingsRate = getSavingsRate(currentIncome, currentExpenses);
        const monthlySavings = currentIncome - currentExpenses;
        const savingsNeededFor20 = currentIncome * 0.2 - monthlySavings;

        if (savingsRate >= 20) {
            insights.push({
                type: 'success',
                category: 'savings',
                action: 'goals',
                icon: '💰',
                message: `Excellent! You're saving ${savingsRate.toFixed(0)}% of income this month — ₹${monthlySavings.toFixed(0)} saved so far.`
            });
        } else if (savingsRate < 10 && savingsRate > 0) {
            insights.push({
                type: 'warning',
                category: 'savings',
                action: 'goals',
                icon: '💡',
                message: `Savings rate is only ${savingsRate.toFixed(0)}%. Save ₹${savingsNeededFor20.toFixed(0)} more this month to hit the 20% target.`
            });
        } else if (savingsRate <= 0) {
            insights.push({
                type: 'danger',
                category: 'savings',
                action: 'transactions',
                icon: '🚨',
                message: `You're spending more than you earn! Down ₹${Math.abs(monthlySavings).toFixed(0)} this month. Review your expenses immediately.`
            });
        }


        // 5. INVESTMENT INSIGHTS

        if (investments.length > 0) {
            const investmentData = calculateInvestmentScore(investments);
            const gainLoss = investmentData.totalCurrentValue - investmentData.totalInvested;

            if (investmentData.roi >= 20) {
                insights.push({
                    type: 'success',
                    category: 'investments',
                    action: 'investments',
                    icon: '📈',
                    message: `Outstanding portfolio! ${investmentData.roi}% ROI — ₹${gainLoss.toFixed(0)} gained on ₹${investmentData.totalInvested.toFixed(0)} invested.`
                });
            } else if (investmentData.roi >= 5) {
                insights.push({
                    type: 'success',
                    category: 'investments',
                    action: 'investments',
                    icon: '📈',
                    message: `Portfolio is up ${investmentData.roi}% — ₹${gainLoss.toFixed(0)} gained. Consider diversifying further to grow returns.`
                });
            } else if (investmentData.roi < 0) {
                insights.push({
                    type: 'warning',
                    category: 'investments',
                    action: 'investments',
                    icon: '📉',
                    message: `Portfolio is down ${Math.abs(investmentData.roi)}% — ₹${Math.abs(gainLoss).toFixed(0)} unrealised loss. Consider reviewing your strategy.`
                });
            }

            if (investmentData.types === 1) {
                insights.push({
                    type: 'warning',
                    category: 'investments',
                    action: 'investments',
                    icon: '⚠️',
                    message: `All investments are in ${investmentData.typesList[0]} only. Diversify into other asset types to reduce risk.`
                });
            } else if (investmentData.types >= 3) {
                insights.push({
                    type: 'success',
                    category: 'investments',
                    action: 'investments',
                    icon: '🏆',
                    message: `Perfect diversification across ${investmentData.typesList.join(', ')}! Your portfolio is well-balanced.`
                });
            }
        } else {
            insights.push({
                type: 'info',
                category: 'investments',
                action: 'investments',
                icon: '💡',
                message: `You have no investments yet. Starting early with stocks, crypto, or mutual funds can significantly grow your wealth.`
            });
        }


        // 6. ANOMALY DETECTION
        const anomalies = findAnomalies(transactions, currentMonthStart, currentMonthEnd);
        if (anomalies.length > 0) {
            const largest = anomalies.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0];
            insights.push({
                type: 'info',
                category: 'anomaly',
                action: 'transactions',
                icon: '📊',
                message: `Unusual expense: ₹${parseFloat(largest.amount).toFixed(0)} on ${largest.category} — that's 3× your average spend in this category.`
            });
        }


        // 7. CATEGORY-SPECIFIC SPIKES

        const currentCategoryExpenses = getExpensesByCategory(transactions, currentMonthStart, currentMonthEnd);
        const lastCategoryExpenses = getExpensesByCategory(transactions, lastMonthStart, lastMonthEnd);

        Object.keys(currentCategoryExpenses).forEach(category => {
            const current = currentCategoryExpenses[category];
            const last = lastCategoryExpenses[category] || 0;
            const change = getPercentageChange(current, last);
            const diff = (current - last).toFixed(0);

            if (change > 50 && current > 1000) {
                insights.push({
                    type: 'warning',
                    category: 'spending',
                    action: 'transactions',
                    icon: '📈',
                    message: `${category} expenses jumped ${change.toFixed(0)}% vs last month — ₹${diff} more spent. Consider reviewing this category.`
                });
            }
        });



        // FIX 1 — SMART PRIORITY SLICING
        // Guarantees 1 insight per category in top 6      
        const pick = (cat, type) => insights.find(i => i.category === cat && (!type || i.type === type));

        const prioritized = [
            insights.find(i => i.type === 'danger'),                  // Most urgent danger first
            pick('budget', 'danger') || pick('budget', 'warning'),    // Budget alert
            pick('savings'),                                           // Savings
            pick('investments'),                                       // Investments
            pick('anomaly') || pick('spending', 'warning'),           // Anomaly or spike
            insights.find(i => i.type === 'success'),                 // At least 1 positive
        ].filter(Boolean).filter((item, index, self) =>
            self.indexOf(item) === index                               // Remove duplicates
        );

        // Fill remaining slots up to 6 with unseen insights
        const seen = new Set(prioritized);
        const remaining = insights.filter(i => !seen.has(i));
        const topInsights = [...prioritized, ...remaining].slice(0, 6);


        // FIX 4 — Return ALL insights + prioritized top 6
        res.json({
            insights: topInsights,          // Top 6 (smart prioritized)
            allInsights: insights,          // All insights for "Show All"
            totalInsights: insights.length
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.get('/patterns', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const {
            currentMonthStart,
            currentMonthEnd,
            lastMonthStart,
            lastMonthEnd,
            threeMonthsAgo
        } = getDateRanges();

        const transactions = await Transaction.find({ userId });

        const currentCategoryExpenses = getExpensesByCategory(transactions, currentMonthStart, currentMonthEnd);
        const lastCategoryExpenses = getExpensesByCategory(transactions, lastMonthStart, lastMonthEnd);
        const threeMonthExpenses = getExpensesByCategory(transactions, threeMonthsAgo, currentMonthEnd);

        const monthCount = 3;
        const averageCategoryExpenses = {};
        Object.keys(threeMonthExpenses).forEach(cat => {
            averageCategoryExpenses[cat] = threeMonthExpenses[cat] / monthCount;
        });

        const categoryComparison = Object.keys(currentCategoryExpenses).map(category => {
            const current = currentCategoryExpenses[category] || 0;
            const last = lastCategoryExpenses[category] || 0;
            const average = averageCategoryExpenses[category] || 0;

            return {
                category,
                currentMonth: parseFloat(current.toFixed(2)),
                lastMonth: parseFloat(last.toFixed(2)),
                threeMonthAvg: parseFloat(average.toFixed(2)),
                changeVsLast: getPercentageChange(current, last),
                changeVsAvg: getPercentageChange(current, average)
            };
        });

        categoryComparison.sort((a, b) => b.currentMonth - a.currentMonth);

        const currentTotal = calculateExpenses(transactions, currentMonthStart, currentMonthEnd);
        const lastTotal = calculateExpenses(transactions, lastMonthStart, lastMonthEnd);
        const threeMonthTotal = calculateExpenses(transactions, threeMonthsAgo, currentMonthEnd);

        res.json({
            categoryComparison,
            totals: {
                currentMonth: parseFloat(currentTotal.toFixed(2)),
                lastMonth: parseFloat(lastTotal.toFixed(2)),
                threeMonthAverage: parseFloat((threeMonthTotal / 3).toFixed(2))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
