const validateTransaction = (req, res, next) => {
  const { title, amount, type, category } = req.body;

  if (!title || !amount || !type || !category) {
    return res.status(400).json({
      error: 'Missing required fields: title, amount, type, category are required'
    });
  }

  // Convert amount to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Normalize amount to number
  req.body.amount = numAmount;

  // Accept both lowercase and capitalized type
  const normalizedType = type.toLowerCase();
  
  if (!['income', 'expense'].includes(normalizedType)) {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }

  // Ensure type is lowercase for database
  req.body.type = normalizedType;

  next();
};

const validateInvestment = (req, res, next) => {
  const { name, ticker, category, quantity, buy_price, provider, providerId } = req.body;

  console.log('🔍 Validating investment:', { name, ticker, category, quantity, buy_price, provider, providerId }); // DEBUG

  if (!name || !ticker || !category || quantity === undefined || buy_price === undefined || !provider || !providerId) {
    return res.status(400).json({
      error: 'Missing required fields: name, ticker, category, quantity, buy_price, provider, providerId are required'
    });
  }

  // Convert to numbers if they're strings
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  const price = typeof buy_price === 'string' ? parseFloat(buy_price) : buy_price;

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Buy price must be a positive number' });
  }

  const tickerRegex = /^[A-Z0-9\.\-:]+$/;
  if (!tickerRegex.test(String(ticker).toUpperCase())) {
    return res.status(400).json({ error: 'Invalid ticker format' });
  }

  // Normalize values
  req.body.ticker = String(ticker).toUpperCase();
  req.body.quantity = qty; // Convert to number
  req.body.buy_price = price; // Convert to number

  if (req.body.current_price === undefined || req.body.current_price === null) {
    req.body.current_price = price;
  }

  if (String(category).toLowerCase() === 'crypto') {
    req.body.exchange = '';
  }

  next();
};

const validateBudget = (req, res, next) => {
  const { category, limit } = req.body;

  if (!category || !limit) {
    return res.status(400).json({
      error: 'Missing required fields: category, limit are required'
    });
  }

  // Convert limit to number if it's a string
  const numLimit = typeof limit === 'string' ? parseFloat(limit) : limit;

  if (isNaN(numLimit) || numLimit <= 0) {
    return res.status(400).json({ error: 'Limit must be a positive number' });
  }

  // Normalize limit to number
  req.body.limit = numLimit;

  next();
};

const validateGoal = (req, res, next) => {
  const { name, target_amount, targetAmount } = req.body;

  // Accept both camelCase and snake_case
  const finalTargetAmount = target_amount || targetAmount;

  if (!name || !finalTargetAmount) {
    return res.status(400).json({
      error: 'Missing required fields: name, target_amount are required'
    });
  }

  // Convert targetAmount to number if it's a string
  const numTarget = typeof finalTargetAmount === 'string' ? parseFloat(finalTargetAmount) : finalTargetAmount;

  if (isNaN(numTarget) || numTarget <= 0) {
    return res.status(400).json({ error: 'Target amount must be a positive number' });
  }

  // Normalize to snake_case for database
  req.body.target_amount = numTarget;
  
  // Also normalize saved_amount if present (handle both camelCase and snake_case)
  if (req.body.savedAmount !== undefined) {
    const numSaved = typeof req.body.savedAmount === 'string' 
      ? parseFloat(req.body.savedAmount) 
      : req.body.savedAmount;
    req.body.saved_amount = numSaved;
    delete req.body.savedAmount; // Remove camelCase version
  }
  
  if (req.body.saved_amount !== undefined) {
    const numSaved = typeof req.body.saved_amount === 'string' 
      ? parseFloat(req.body.saved_amount) 
      : req.body.saved_amount;
    req.body.saved_amount = numSaved;
  }

  next();
};

const validateExport = (req, res, next) => {
  const { type, start_date, end_date } = req.body;

  // Accept both lowercase and capitalized type
  if (type) {
    const normalizedType = type.toLowerCase();
    if (!['income', 'expense', 'all'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Type must be income, expense, or all' });
    }
    req.body.type = normalizedType;
  }

  if (start_date && isNaN(Date.parse(start_date))) {
    return res.status(400).json({ error: 'Invalid start_date format' });
  }

  if (end_date && isNaN(Date.parse(end_date))) {
    return res.status(400).json({ error: 'Invalid end_date format' });
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
