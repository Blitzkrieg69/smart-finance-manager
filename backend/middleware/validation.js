const validateTransaction = (req, res, next) => {
  const { title, amount, type, category } = req.body;

  if (!title || !amount || !type || !category) {
    return res.status(400).json({
      error: 'Missing required fields: title, amount, type, category are required'
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (!['Income', 'Expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be Income or Expense' });
  }

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

  if (typeof limit !== 'number' || limit <= 0) {
    return res.status(400).json({ error: 'Limit must be a positive number' });
  }

  next();
};

const validateGoal = (req, res, next) => {
  const { name, targetAmount } = req.body;

  if (!name || !targetAmount) {
    return res.status(400).json({
      error: 'Missing required fields: name, targetAmount are required'
    });
  }

  if (typeof targetAmount !== 'number' || targetAmount <= 0) {
    return res.status(400).json({ error: 'Target amount must be a positive number' });
  }

  next();
};
const validateExport = (req, res, next) => {
  const { type, start_date, end_date } = req.body;

  if (type && !['Income', 'Expense', 'all'].includes(type)) {
    return res.status(400).json({ error: 'Type must be Income, Expense, or all' });
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
