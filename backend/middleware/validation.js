// Validation middleware for API requests

const validateTransaction = (req, res, next) => {
    const { amount, type, category } = req.body;
    
    // Check required fields
    if (!amount || !type) {
        return res.status(400).json({ 
            error: 'Missing required fields: amount and type are required' 
        });
    }
    
    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ 
            error: 'Amount must be a positive number' 
        });
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ 
            error: 'Type must be either "income" or "expense"' 
        });
    }
    
    // Validate recurrence if provided
    const validRecurrences = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
    if (req.body.recurrence && !validRecurrences.includes(req.body.recurrence)) {
        return res.status(400).json({ 
            error: 'Invalid recurrence value' 
        });
    }
    
    next();
};

const validateInvestment = (req, res, next) => {
    const { name, ticker, category, quantity, buy_price } = req.body;
    
    // Check required fields
    if (!name || !ticker || !category || !quantity || !buy_price) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, ticker, category, quantity, and buy_price are required' 
        });
    }
    
    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ 
            error: 'Quantity must be a positive number' 
        });
    }
    
    // Validate buy_price
    if (typeof buy_price !== 'number' || buy_price <= 0) {
        return res.status(400).json({ 
            error: 'Buy price must be a positive number' 
        });
    }
    
    // Validate ticker format (uppercase, alphanumeric with optional dash/dot)
    const tickerRegex = /^[A-Z0-9\.\-]+$/;
    if (!tickerRegex.test(ticker.toUpperCase())) {
        return res.status(400).json({ 
            error: 'Invalid ticker format' 
        });
    }
    
    // Convert ticker to uppercase
    req.body.ticker = ticker.toUpperCase();
    
    next();
};

const validateBudget = (req, res, next) => {
    const { category, limit } = req.body;
    
    // Check required fields
    if (!category || !limit) {
        return res.status(400).json({ 
            error: 'Missing required fields: category and limit are required' 
        });
    }
    
    // Validate limit
    if (typeof limit !== 'number' || limit <= 0) {
        return res.status(400).json({ 
            error: 'Limit must be a positive number' 
        });
    }
    
    next();
};

const validateGoal = (req, res, next) => {
    const { name, target_amount, deadline } = req.body;
    
    // Check required fields
    if (!name || !target_amount || !deadline) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, target_amount, and deadline are required' 
        });
    }
    
    // Validate target_amount
    if (typeof target_amount !== 'number' || target_amount <= 0) {
        return res.status(400).json({ 
            error: 'Target amount must be a positive number' 
        });
    }
    
    // Validate saved_amount if provided
    if (req.body.saved_amount !== undefined) {
        if (typeof req.body.saved_amount !== 'number' || req.body.saved_amount < 0) {
            return res.status(400).json({ 
                error: 'Saved amount must be a non-negative number' 
            });
        }
    }
    
    // Validate deadline format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(deadline)) {
        return res.status(400).json({ 
            error: 'Deadline must be in YYYY-MM-DD format' 
        });
    }
    
    // Validate color format if provided (hex color)
    if (req.body.color) {
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!colorRegex.test(req.body.color)) {
            return res.status(400).json({ 
                error: 'Color must be a valid hex color (e.g., #6366f1)' 
            });
        }
    }
    
    next();
};

const validateExport = (req, res, next) => {
    const { type, start_date, end_date } = req.body;
    
    // Validate type if provided
    const validTypes = ['all', 'income', 'expense'];
    if (type && !validTypes.includes(type)) {
        return res.status(400).json({ 
            error: 'Type must be "all", "income", or "expense"' 
        });
    }
    
    // Validate date formats if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (start_date && !dateRegex.test(start_date)) {
        return res.status(400).json({ 
            error: 'Start date must be in YYYY-MM-DD format' 
        });
    }
    if (end_date && !dateRegex.test(end_date)) {
        return res.status(400).json({ 
            error: 'End date must be in YYYY-MM-DD format' 
        });
    }
    
    // Validate date range
    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({ 
            error: 'Start date cannot be after end date' 
        });
    }
    
    next();
};

module.exports = {
    validateTransaction,
    validateInvestment,
    validateBudget,
    validateGoal,
    validateExport
};
