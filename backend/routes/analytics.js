const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goals');
const Investment = require('../models/Investment');  // NEW
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
    calculateInvestmentScore  // NEW
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

        // Fetch data
        const transactions = await Transaction.find({ userId });
        const budgets = await Budget.find({ userId });
        const goals = await Goal.find({ userId });
        const investments = await Investment.find({ userId });  // NEW

        // Calculate metrics
        const income = calculateIncome(transactions, currentMonthStart, currentMonthEnd);
        const expenses = calculateExpenses(transactions, currentMonthStart, currentMonthEnd);
        const savingsRate = getSavingsRate(income, expenses);
        
        // Calculate component scores
        const savingsScore = Math.min(25, (savingsRate / 30) * 25);
        
        const categoryExpenses = getExpensesByCategory(transactions, currentMonthStart, currentMonthEnd);
        
        // Time-based budget scoring
        const budgetScore = (calculateBudgetHealthTimeBased(budgets, categoryExpenses, daysElapsedInMonth, totalDaysInMonth) / 100) * 25;
        
        // Time-based goal scoring
        const goalScore = (calculateGoalScoreTimeBased(goals) / 100) * 25;
        
        // NEW: Investment scoring (replaces debt)
        const investmentData = calculateInvestmentScore(investments);
        const investmentScore = investmentData.score;
        
        const totalScore = Math.round(savingsScore + budgetScore + goalScore + investmentScore);

        res.json({
            score: totalScore,
            breakdown: {
                savings: Math.round(savingsScore),
                budget: Math.round(budgetScore),
                goals: Math.round(goalScore),
                investments: Math.round(investmentScore)  // CHANGED from 'debt'
            },
            metrics: {
                savingsRate: savingsRate.toFixed(1),
                monthlyIncome: income.toFixed(2),
                monthlyExpenses: expenses.toFixed(2),
                monthlySavings: (income - expenses).toFixed(2),
                daysElapsed: daysElapsedInMonth,
                daysRemaining: totalDaysInMonth - daysElapsedInMonth
            },
            investmentMetrics: {  // NEW
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
        const investments = await Investment.find({ userId });  // NEW

        const insights = [];

        // 1. SPENDING COMPARISON
        const currentExpenses = calculateExpenses(transactions, currentMonthStart, currentMonthEnd);
        const lastExpenses = calculateExpenses(transactions, lastMonthStart, lastMonthEnd);
        const expenseChange = getPercentageChange(currentExpenses, lastExpenses);

        if (Math.abs(expenseChange) > 10) {
            const icon = expenseChange > 0 ? '⚠️' : '✅';
            const direction = expenseChange > 0 ? 'more' : 'less';
            insights.push({
                type: expenseChange > 0 ? 'warning' : 'success',
                icon,
                message: `You've spent ₹${Math.abs(currentExpenses - lastExpenses).toFixed(0)} ${direction} than last month (${Math.abs(expenseChange).toFixed(0)}% ${expenseChange > 0 ? 'increase' : 'decrease'})`
            });
        }

        // 2. INCOME COMPARISON
        const currentIncome = calculateIncome(transactions, currentMonthStart, currentMonthEnd);
        const lastIncome = calculateIncome(transactions, lastMonthStart, lastMonthEnd);
        const incomeChange = getPercentageChange(currentIncome, lastIncome);

        if (Math.abs(incomeChange) > 10) {
            const icon = incomeChange > 0 ? '🎉' : '⚠️';
            insights.push({
                type: incomeChange > 0 ? 'success' : 'warning',
                icon,
                message: `Income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(0)}% compared to last month`
            });
        }

        // 3. TIME-BASED BUDGET ALERTS
        const categoryExpenses = getExpensesByCategory(transactions, currentMonthStart, currentMonthEnd);
        
        budgets.forEach(budget => {
            const spent = categoryExpenses[budget.category] || 0;
            const limit = parseFloat(budget.limit);
            const percentage = (spent / limit) * 100;
            
            const expectedSpend = (limit / totalDaysInMonth) * daysElapsedInMonth;
            const performance = ((expectedSpend - spent) / expectedSpend) * 100;

            if (percentage >= 100) {
                insights.push({
                    type: 'danger',
                    icon: '🔥',
                    message: `${budget.category} budget exceeded by ₹${(spent - limit).toFixed(0)}`
                });
            } else if (performance < -20) {
                const dailyRate = spent / daysElapsedInMonth;
                const projectedTotal = dailyRate * totalDaysInMonth;
                insights.push({
                    type: 'danger',
                    icon: '⚠️',
                    message: `${budget.category} burning too fast! At current rate, you'll spend ₹${projectedTotal.toFixed(0)} (${((projectedTotal/limit)*100).toFixed(0)}% of budget)`
                });
            } else if (performance < -10) {
                insights.push({
                    type: 'warning',
                    icon: '⚠️',
                    message: `${budget.category} spending ahead of schedule - currently at ${percentage.toFixed(0)}% with ${daysRemainingInMonth} days left`
                });
            } else if (performance > 30 && daysElapsedInMonth > 10) {
                insights.push({
                    type: 'success',
                    icon: '✅',
                    message: `Excellent! ${budget.category} spending well under control (${percentage.toFixed(0)}% used, ${performance.toFixed(0)}% under pace)`
                });
            }
        });

        // 4. SAVINGS RATE
        const savingsRate = getSavingsRate(currentIncome, currentExpenses);
        if (savingsRate >= 20) {
            insights.push({
                type: 'success',
                icon: '💰',
                message: `Excellent! You're saving ${savingsRate.toFixed(0)}% of your income this month`
            });
        } else if (savingsRate < 10 && savingsRate > 0) {
            insights.push({
                type: 'warning',
                icon: '💡',
                message: `Savings rate is low (${savingsRate.toFixed(0)}%) - aim for at least 20%`
            });
        } else if (savingsRate <= 0) {
            insights.push({
                type: 'danger',
                icon: '🚨',
                message: `Alert: You're spending more than you earn this month`
            });
        }

        // 5. INVESTMENT INSIGHTS (NEW)
        if (investments.length > 0) {
            const investmentData = calculateInvestmentScore(investments);
            
            // ROI Insights
            if (investmentData.roi >= 20) {
                insights.push({
                    type: 'success',
                    icon: '📈',
                    message: `Outstanding! Your investments have ${investmentData.roi}% returns`
                });
            } else if (investmentData.roi < 0) {
                insights.push({
                    type: 'warning',
                    icon: '📉',
                    message: `Your portfolio is down ${Math.abs(investmentData.roi)}%. Consider reviewing your investment strategy`
                });
            }
            
            // Diversification Insights
            if (investmentData.types === 1) {
                insights.push({
                    type: 'warning',
                    icon: '⚠️',
                    message: `All investments in ${investmentData.typesList[0]}! Diversify to reduce risk`
                });
            } else if (investmentData.types === 3) {
                insights.push({
                    type: 'success',
                    icon: '🏆',
                    message: `Perfect diversification across ${investmentData.typesList.join(', ')}!`
                });
            }
        } else {
            insights.push({
                type: 'info',
                icon: '💡',
                message: `Start investing to build wealth! Consider stocks, crypto, or mutual funds`
            });
        }

        // 6. ANOMALY DETECTION
        const anomalies = findAnomalies(transactions, currentMonthStart, currentMonthEnd);
        if (anomalies.length > 0) {
            const largest = anomalies[0];
            insights.push({
                type: 'info',
                icon: '📊',
                message: `Unusual expense detected: ₹${parseFloat(largest.amount).toFixed(0)} on ${largest.category} (3x your average)`
            });
        }

        // 7. CATEGORY-SPECIFIC INSIGHTS
        const currentCategoryExpenses = getExpensesByCategory(transactions, currentMonthStart, currentMonthEnd);
        const lastCategoryExpenses = getExpensesByCategory(transactions, lastMonthStart, lastMonthEnd);

        Object.keys(currentCategoryExpenses).forEach(category => {
            const current = currentCategoryExpenses[category];
            const last = lastCategoryExpenses[category] || 0;
            const change = getPercentageChange(current, last);

            if (change > 50 && current > 1000) {
                insights.push({
                    type: 'warning',
                    icon: '📈',
                    message: `${category} expenses increased by ${change.toFixed(0)}% - consider reviewing this category`
                });
            }
        });

        res.json({
            insights: insights.slice(0, 6),
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
