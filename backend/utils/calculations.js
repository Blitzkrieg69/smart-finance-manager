const getDateRanges = () => {
    const now = new Date();
    
    return {
        // Current Month
        currentMonthStart: new Date(now.getFullYear(), now.getMonth(), 1),
        currentMonthEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        
        // Last Month
        lastMonthStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lastMonthEnd: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        
        // Last 3 Months
        threeMonthsAgo: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        
        // Last 30 Days
        thirtyDaysAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        
        // Today
        today: now,
        
        // Days remaining in month
        daysRemainingInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate(),
        
        // Days elapsed in month
        daysElapsedInMonth: now.getDate(),
        
        // Total days in current month
        totalDaysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    };
};



// Calculate total income for a period
const calculateIncome = (transactions, startDate, endDate) => {
    return transactions
        .filter(t => t.type === 'income' && t.date >= startDate && t.date <= endDate)
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};



// Calculate total expenses for a period
const calculateExpenses = (transactions, startDate, endDate) => {
    return transactions
        .filter(t => t.type === 'expense' && t.date >= startDate && t.date <= endDate)
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};



// Calculate expenses by category
const getExpensesByCategory = (transactions, startDate, endDate) => {
    const expenses = transactions.filter(
        t => t.type === 'expense' && t.date >= startDate && t.date <= endDate
    );
    
    const categoryMap = {};
    expenses.forEach(t => {
        const category = t.category || 'Others';
        categoryMap[category] = (categoryMap[category] || 0) + parseFloat(t.amount || 0);
    });
    
    return categoryMap;
};



// Calculate daily average spending
const getDailyAverage = (transactions, startDate, endDate) => {
    const totalExpenses = calculateExpenses(transactions, startDate, endDate);
    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    return totalExpenses / days;
};



// Calculate percentage change
const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};



// Calculate savings rate
const getSavingsRate = (income, expenses) => {
    if (income === 0) return 0;
    return ((income - expenses) / income) * 100;
};



// Find unusual transactions (3x average)
const findAnomalies = (transactions, startDate, endDate) => {
    const expenses = transactions.filter(
        t => t.type === 'expense' && t.date >= startDate && t.date <= endDate
    );
    
    if (expenses.length === 0) return [];
    
    const average = expenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / expenses.length;
    const threshold = average * 3;
    
    return expenses.filter(t => parseFloat(t.amount) > threshold);
};



// ============================================
// TIME-BASED BUDGET SCORING
// ============================================
const calculateBudgetHealthTimeBased = (budgets, categoryExpenses, daysElapsed, totalDays) => {
    if (budgets.length === 0) return 100;
    
    let totalScore = 0;
    
    budgets.forEach(budget => {
        const spent = categoryExpenses[budget.category] || 0;
        const limit = parseFloat(budget.limit) || 1;
        
        // Expected spending at this point in the month
        const expectedSpend = (limit / totalDays) * daysElapsed;
        
        // Performance: positive = under pace, negative = over pace
        const performance = expectedSpend > 0 ? ((expectedSpend - spent) / expectedSpend) * 100 : 0;
        
        // Convert performance to score (0-100)
        let score;
        if (performance >= 50) {
            score = 100;
        } else if (performance >= 30) {
            score = 95;
        } else if (performance >= 10) {
            score = 85;
        } else if (performance >= 0) {
            score = 75;
        } else if (performance >= -10) {
            score = 65;
        } else if (performance >= -20) {
            score = 50;
        } else if (performance >= -40) {
            score = 30;
        } else {
            score = 10;
        }
        
        totalScore += score;
    });
    
    return totalScore / budgets.length;
};



// OLD FUNCTION (kept for backwards compatibility)
const calculateBudgetHealth = (budgets, categoryExpenses) => {
    if (budgets.length === 0) return 100;
    
    let totalScore = 0;
    budgets.forEach(budget => {
        const spent = categoryExpenses[budget.category] || 0;
        const limit = parseFloat(budget.limit) || 1;
        const percentage = (spent / limit) * 100;
        
        if (percentage <= 100) {
            totalScore += 100 - percentage;
        }
    });
    
    return Math.max(0, Math.min(100, totalScore / budgets.length));
};



// ============================================
// TIME-BASED GOAL SCORING
// ============================================
const calculateGoalScoreTimeBased = (goals) => {
    if (goals.length === 0) return 100;
    
    const now = new Date();
    let totalScore = 0;
    
    goals.forEach(goal => {
        const targetAmount = parseFloat(goal.target_amount) || 1;
        const savedAmount = parseFloat(goal.saved_amount) || 0;
        const deadline = new Date(goal.deadline);
        const createdAt = goal.created_at ? new Date(goal.created_at) : new Date(now.getFullYear(), now.getMonth(), 1);
        
        const totalDays = Math.max(1, Math.ceil((deadline - createdAt) / (1000 * 60 * 60 * 24)));
        const daysElapsed = Math.max(1, Math.ceil((now - createdAt) / (1000 * 60 * 60 * 24)));
        
        const expectedSaved = (targetAmount / totalDays) * daysElapsed;
        const performance = expectedSaved > 0 ? ((savedAmount - expectedSaved) / expectedSaved) * 100 : 0;
        
        let score;
        if (savedAmount >= targetAmount) {
            score = 100;
        } else if (performance >= 50) {
            score = 100;
        } else if (performance >= 30) {
            score = 95;
        } else if (performance >= 10) {
            score = 85;
        } else if (performance >= 0) {
            score = 75;
        } else if (performance >= -10) {
            score = 65;
        } else if (performance >= -20) {
            score = 50;
        } else if (performance >= -40) {
            score = 30;
        } else {
            score = 10;
        }
        
        totalScore += score;
    });
    
    return totalScore / goals.length;
};



// OLD FUNCTION (kept for backwards compatibility)
const calculateGoalScore = (goals) => {
    if (goals.length === 0) return 100;
    
    let totalProgress = 0;
    goals.forEach(goal => {
        const progress = Math.min(100, (goal.saved_amount / goal.target_amount) * 100);
        totalProgress += progress;
    });
    
    return totalProgress / goals.length;
};



// ============================================
// NEW: INVESTMENT SCORE (ROI + DIVERSIFICATION)
// ============================================


// Calculate Investment ROI Score (15 points max) - WITH CURRENCY CONVERSION
const calculateInvestmentROI = (investments, exchangeRate = 91.5) => {
    if (investments.length === 0) return { score: 0, roi: 0 };
    
    // Helper: Convert to INR
    const convert = (value, currency) => {
        const val = parseFloat(value || 0);
        if (currency === 'USD') return val * exchangeRate;
        return val; // Already INR
    };
    
    // Calculate total invested and current value WITH CURRENCY CONVERSION
    const totalInvested = investments.reduce((sum, inv) => {
        return sum + (parseFloat(inv.quantity || 0) * convert(inv.buy_price, inv.currency));
    }, 0);
    
    const totalCurrentValue = investments.reduce((sum, inv) => {
        return sum + (parseFloat(inv.quantity || 0) * convert(inv.current_price || inv.buy_price, inv.currency));
    }, 0);
    
    if (totalInvested === 0) return { score: 0, roi: 0 };
    
    const roi = ((totalCurrentValue - totalInvested) / totalInvested) * 100;
    
    // Score based on ROI performance
    let score;
    if (roi >= 30) {
        score = 15;      // Elite (30%+)
    } else if (roi >= 20) {
        score = 13;      // Excellent (20-29%)
    } else if (roi >= 10) {
        score = 11;      // Good (10-19%)
    } else if (roi >= 5) {
        score = 9;       // Fair (5-9%)
    } else if (roi >= 0) {
        score = 7;       // Minimal (0-4%)
    } else if (roi >= -5) {
        score = 5;       // Slight loss (-1 to -5%)
    } else if (roi >= -10) {
        score = 3;       // Loss (-6 to -10%)
    } else if (roi >= -20) {
        score = 2;       // Heavy loss (-11 to -20%)
    } else {
        score = 0;       // Critical (<-20%)
    }
    
    return { score, roi: parseFloat(roi.toFixed(2)) };
};



// Calculate Investment Diversification Score (10 points max)
const calculateInvestmentDiversification = (investments) => {
    if (investments.length === 0) return { score: 0, types: 0, typesList: [] };
    
    // Map category field to our expected types
    const categoryMapping = {
        'Stock': 'Stocks',           // Generic stocks
        'Stocks': 'Stocks',          // Already correct
        'USA Stock': 'USA Stocks',   // US stocks
        'USA Stocks': 'USA Stocks',
        'US Stock': 'USA Stocks',
        'US Stocks': 'USA Stocks',
        'India Stock': 'India Stocks', // Indian stocks
        'India Stocks': 'India Stocks',
        'Indian Stock': 'India Stocks',
        'Indian Stocks': 'India Stocks',
        'Crypto': 'Cryptocurrency',   // Crypto
        'Cryptocurrency': 'Cryptocurrency'
    };
    
    // Get unique categories and map them
    const mappedTypes = new Set();
    investments.forEach(inv => {
        const category = inv.category;
        const mapped = categoryMapping[category] || category;
        mappedTypes.add(mapped);
    });
    
    const typeCount = mappedTypes.size;
    const typesList = Array.from(mappedTypes);
    
    // Score for 3-type system (USA Stocks, India Stocks, Cryptocurrency)
    let score;
    if (typeCount >= 3) {
        score = 10;      // Perfect (all 3 types)
    } else if (typeCount === 2) {
        score = 7;       // Good (2 types)
    } else if (typeCount === 1) {
        score = 3;       // Risky (1 type only)
    } else {
        score = 0;       // No investments
    }
    
    return { score, types: typeCount, typesList };
};



// Calculate Complete Investment Score (25 points max) - WITH CURRENCY CONVERSION
const calculateInvestmentScore = (investments, exchangeRate = 91.5) => {
    if (investments.length === 0) {
        return {
            score: 0,
            roiScore: 0,
            diversificationScore: 0,
            roi: 0,
            types: 0,
            typesList: [],
            totalInvested: 0,
            totalCurrentValue: 0
        };
    }
    
    const roiResult = calculateInvestmentROI(investments, exchangeRate);
    const diversificationResult = calculateInvestmentDiversification(investments);
    
    // Helper: Convert to INR
    const convert = (value, currency) => {
        const val = parseFloat(value || 0);
        if (currency === 'USD') return val * exchangeRate;
        return val; // Already INR
    };
    
    // Calculate totals WITH CURRENCY CONVERSION
    const totalInvested = investments.reduce((sum, inv) => {
        return sum + (parseFloat(inv.quantity || 0) * convert(inv.buy_price, inv.currency));
    }, 0);
    
    const totalCurrentValue = investments.reduce((sum, inv) => {
        return sum + (parseFloat(inv.quantity || 0) * convert(inv.current_price || inv.buy_price, inv.currency));
    }, 0);
    
    return {
        score: roiResult.score + diversificationResult.score,
        roiScore: roiResult.score,
        diversificationScore: diversificationResult.score,
        roi: roiResult.roi,
        types: diversificationResult.types,
        typesList: diversificationResult.typesList,
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2))
    };
};



module.exports = {
    getDateRanges,
    calculateIncome,
    calculateExpenses,
    getExpensesByCategory,
    getDailyAverage,
    getPercentageChange,
    getSavingsRate,
    findAnomalies,
    calculateBudgetHealth,
    calculateBudgetHealthTimeBased,
    calculateGoalScore,
    calculateGoalScoreTimeBased,
    calculateInvestmentROI,
    calculateInvestmentDiversification,
    calculateInvestmentScore
};
