const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goals');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getDateRanges,
    calculateIncome,
    calculateExpenses,
    getDailyAverage,
    getExpensesByCategory
} = require('../utils/calculations');


router.get('/cashflow', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const {
            currentMonthStart,
            currentMonthEnd,
            daysRemainingInMonth,
            daysElapsedInMonth,
            today
        } = getDateRanges();

        const transactions = await Transaction.find({ userId });

        // Current balance
        const totalIncome = calculateIncome(transactions, new Date(0), today);
        const totalExpenses = calculateExpenses(transactions, new Date(0), today);
        const currentBalance = totalIncome - totalExpenses;

        // Current month income and expenses
        const monthIncome = calculateIncome(transactions, currentMonthStart, today);
        const monthExpenses = calculateExpenses(transactions, currentMonthStart, today);

        // Daily average spending (this month)
        const dailyAvgSpending = getDailyAverage(transactions, currentMonthStart, today);

        // Predicted expenses for remaining days
        const predictedExpenses = dailyAvgSpending * daysRemainingInMonth;

        // Check for recurring transactions coming up
        const recurringTransactions = await Transaction.find({
            userId,
            recurrence: { $ne: 'None' },
            nextDate: { $lte: currentMonthEnd, $gte: today }
        });

        const upcomingRecurringExpenses = recurringTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const upcomingRecurringIncome = recurringTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        // Total predicted for end of month
        const totalPredictedExpenses = predictedExpenses + upcomingRecurringExpenses;
        const totalPredictedIncome = upcomingRecurringIncome;

        const predictedEndBalance = currentBalance - totalPredictedExpenses + totalPredictedIncome;

        // Build timeline (simplified: today + 1 week + 2 weeks + end of month)
        const timeline = [];
        const now = new Date();

        // Today
        timeline.push({
            date: now.toISOString().split('T')[0],
            balance: currentBalance,
            label: 'Today'
        });

        // 1 week from now
        if (daysRemainingInMonth >= 7) {
            const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            timeline.push({
                date: oneWeek.toISOString().split('T')[0],
                balance: currentBalance - (dailyAvgSpending * 7),
                label: '1 Week'
            });
        }

        // 2 weeks from now
        if (daysRemainingInMonth >= 14) {
            const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            timeline.push({
                date: twoWeeks.toISOString().split('T')[0],
                balance: currentBalance - (dailyAvgSpending * 14),
                label: '2 Weeks'
            });
        }

        // End of month
        timeline.push({
            date: currentMonthEnd.toISOString().split('T')[0],
            balance: predictedEndBalance,
            label: 'Month End'
        });

        res.json({
            current: {
                balance: parseFloat(currentBalance.toFixed(2)),
                monthIncome: parseFloat(monthIncome.toFixed(2)),
                monthExpenses: parseFloat(monthExpenses.toFixed(2))
            },
            predictions: {
                dailyAvgSpending: parseFloat(dailyAvgSpending.toFixed(2)),
                predictedExpenses: parseFloat(totalPredictedExpenses.toFixed(2)),
                predictedIncome: parseFloat(totalPredictedIncome.toFixed(2)),
                predictedEndBalance: parseFloat(predictedEndBalance.toFixed(2)),
                daysRemaining: daysRemainingInMonth
            },
            timeline,
            upcomingRecurring: {
                expenses: parseFloat(upcomingRecurringExpenses.toFixed(2)),
                income: parseFloat(upcomingRecurringIncome.toFixed(2)),
                count: recurringTransactions.length
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/budget-burnrate', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const {
            currentMonthStart,
            currentMonthEnd,
            daysRemainingInMonth,
            daysElapsedInMonth,
            totalDaysInMonth,
            today
        } = getDateRanges();

        const transactions = await Transaction.find({ userId });
        const budgets = await Budget.find({ userId });

        const categoryExpenses = getExpensesByCategory(transactions, currentMonthStart, today);

        const budgetAnalysis = budgets.map(budget => {
            const spent = categoryExpenses[budget.category] || 0;
            const limit = parseFloat(budget.limit);
            const remaining = limit - spent;
            const percentage = (spent / limit) * 100;

            // Daily burn rate
            const dailyBurnRate = daysElapsedInMonth > 0 ? spent / daysElapsedInMonth : 0;

            // Expected spending at this point (NEW)
            const expectedSpend = (limit / totalDaysInMonth) * daysElapsedInMonth;
            
            // Performance score (NEW)
            const performance = expectedSpend > 0 ? ((expectedSpend - spent) / expectedSpend) * 100 : 0;

            // Projected spending if current rate continues
            const projectedTotal = dailyBurnRate * totalDaysInMonth;

            // Days until budget exhausted
            const daysUntilExhausted = dailyBurnRate > 0 ? remaining / dailyBurnRate : 999;

            // Recommended daily spending to stay within budget
            const recommendedDailySpending = daysRemainingInMonth > 0 ? remaining / daysRemainingInMonth : 0;

            let status = 'healthy';
            let message = `On track to finish at ₹${projectedTotal.toFixed(0)}`;
            
            // Status based on time-based performance (NEW LOGIC)
            if (percentage >= 100) {
                status = 'exceeded';
                message = `Budget exceeded by ₹${(spent - limit).toFixed(0)}`;
            } else if (performance < -40) {
                status = 'danger';
                message = `Burning ${Math.abs(performance).toFixed(0)}% faster than expected! Will exceed budget by Day ${(daysElapsedInMonth + daysUntilExhausted).toFixed(0)}`;
            } else if (performance < -20) {
                status = 'danger';
                message = `Spending too fast (${Math.abs(performance).toFixed(0)}% over pace). Reduce to ₹${recommendedDailySpending.toFixed(0)}/day`;
            } else if (performance < -10) {
                status = 'warning';
                message = `Slightly over pace. ${percentage.toFixed(0)}% used with ${daysRemainingInMonth} days remaining`;
            } else if (performance >= 30) {
                status = 'excellent';
                message = `Excellent control! ${Math.abs(performance).toFixed(0)}% under pace with ₹${remaining.toFixed(0)} buffer`;
            } else if (performance >= 10) {
                status = 'healthy';
                message = `Good pace. On track to finish at ₹${projectedTotal.toFixed(0)} (${(projectedTotal/limit*100).toFixed(0)}% of budget)`;
            } else {
                status = 'healthy';
                message = `On track to finish at ₹${projectedTotal.toFixed(0)}`;
            }

            return {
                category: budget.category,
                limit: parseFloat(limit.toFixed(2)),
                spent: parseFloat(spent.toFixed(2)),
                remaining: parseFloat(remaining.toFixed(2)),
                percentage: parseFloat(percentage.toFixed(1)),
                dailyBurnRate: parseFloat(dailyBurnRate.toFixed(2)),
                expectedSpend: parseFloat(expectedSpend.toFixed(2)),
                performance: parseFloat(performance.toFixed(1)),
                recommendedDailySpending: parseFloat(recommendedDailySpending.toFixed(2)),
                projectedTotal: parseFloat(projectedTotal.toFixed(2)),
                daysUntilExhausted: Math.round(daysUntilExhausted),
                status,
                message
            };
        });

        // Sort by status priority (danger first)
        const statusOrder = { 'exceeded': 0, 'danger': 1, 'warning': 2, 'healthy': 3, 'excellent': 4 };
        budgetAnalysis.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        res.json({
            budgets: budgetAnalysis,
            summary: {
                daysElapsed: daysElapsedInMonth,
                daysRemaining: daysRemainingInMonth,
                totalBudgets: budgets.length,
                exceeded: budgetAnalysis.filter(b => b.status === 'exceeded').length,
                atRisk: budgetAnalysis.filter(b => b.status === 'danger').length,
                healthy: budgetAnalysis.filter(b => b.status === 'healthy' || b.status === 'excellent').length
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/goals', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { currentMonthStart, today, lastMonthStart } = getDateRanges();

        const goals = await Goal.find({ userId });
        const transactions = await Transaction.find({ userId });

        // Calculate monthly savings rate (last 3 months average)
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        const totalIncome = calculateIncome(transactions, threeMonthsAgo, today);
        const totalExpenses = calculateExpenses(transactions, threeMonthsAgo, today);
        const avgMonthlySavings = (totalIncome - totalExpenses) / 3;

        const goalAnalysis = goals.map(goal => {
            const remaining = goal.target_amount - goal.saved_amount;
            const progress = (goal.saved_amount / goal.target_amount) * 100;
            
            // Calculate months until deadline
            const deadlineDate = new Date(goal.deadline);
            const monthsRemaining = Math.max(0, Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24 * 30)));
            
            // Required monthly savings to meet goal
            const requiredMonthlySavings = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
            
            // Predicted completion based on current savings rate
            const monthsToComplete = avgMonthlySavings > 0 ? remaining / avgMonthlySavings : 999;
            const predictedDate = new Date(today.getTime() + monthsToComplete * 30 * 24 * 60 * 60 * 1000);
            
            // Status
            let status = 'on-track';
            let message = `On track to complete by ${goal.deadline}`;
            
            if (progress >= 100) {
                status = 'achieved';
                message = 'Goal achieved! 🎉';
            } else if (monthsToComplete > monthsRemaining) {
                status = 'behind';
                const monthsLate = Math.round(monthsToComplete - monthsRemaining);
                message = `Will be ${monthsLate} month(s) late at current savings rate`;
            } else if (monthsToComplete < monthsRemaining) {
                status = 'ahead';
                const monthsEarly = Math.round(monthsRemaining - monthsToComplete);
                message = `Will complete ${monthsEarly} month(s) early!`;
            }

            return {
                name: goal.name,
                target: parseFloat(goal.target_amount.toFixed(2)),
                saved: parseFloat(goal.saved_amount.toFixed(2)),
                remaining: parseFloat(remaining.toFixed(2)),
                progress: parseFloat(progress.toFixed(1)),
                deadline: goal.deadline,
                monthsRemaining,
                requiredMonthlySavings: parseFloat(requiredMonthlySavings.toFixed(2)),
                currentMonthlySavings: parseFloat(avgMonthlySavings.toFixed(2)),
                predictedCompletionDate: predictedDate.toISOString().split('T')[0],
                status,
                message
            };
        });

        res.json({
            goals: goalAnalysis,
            summary: {
                totalGoals: goals.length,
                achieved: goalAnalysis.filter(g => g.status === 'achieved').length,
                onTrack: goalAnalysis.filter(g => g.status === 'on-track').length,
                behind: goalAnalysis.filter(g => g.status === 'behind').length,
                avgMonthlySavings: parseFloat(avgMonthlySavings.toFixed(2))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
