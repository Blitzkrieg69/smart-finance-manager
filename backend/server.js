require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// CRITICAL: This library fixes the 401 Error
const yahooFinance = require('yahoo-finance2').default; 

const app = express();
app.use(cors());
app.use(express.json());

// --- DEBUG LOGGER ---
app.use((req, res, next) => {
    console.log(`📡 [${req.method}] Request received at: ${req.url}`);
    next();
});

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/financeDB';

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// --- SCHEMAS ---
const TransactionSchema = new mongoose.Schema({ type: String, amount: Number, category: String, description: String, date: String, recurrence: String });
const BudgetSchema = new mongoose.Schema({ category: String, limit: Number, period: String });
const GoalSchema = new mongoose.Schema({ name: String, target_amount: Number, saved_amount: Number, deadline: String, color: String });
const UserSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String });

const InvestmentSchema = new mongoose.Schema({
    name: String, ticker: String, category: String, quantity: Number,
    buy_price: Number, 
    date: String,
    currency: { type: String, default: 'INR' }
});

// --- MODELS ---
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Budget = mongoose.model('Budget', BudgetSchema);
const Investment = mongoose.model('Investment', InvestmentSchema);
const Goal = mongoose.model('Goal', GoalSchema);
const User = mongoose.model('User', UserSchema);

// --- HELPER: FETCH PRICES WITH YAHOO-FINANCE2 ---
const fetchLivePrices = async (tickers) => {
    if (tickers.length === 0) return {};
    try {
        // 1. Fetch USD to INR Rate
        const inrQuote = await yahooFinance.quote('USDINR=X');
        const usdToInr = inrQuote ? inrQuote.regularMarketPrice : 84.0;

        // 2. Fetch Asset Quotes
        // Suppress errors for individual invalid tickers
        const quotes = await yahooFinance.quote(tickers, { returnQuoteType: false });
        
        // 3. Map Results
        const priceMap = {};
        const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

        quoteArray.forEach(q => {
            if (!q) return;
            let price = q.regularMarketPrice;
            
            // Auto-Convert USD assets to INR
            if (q.currency === 'USD') {
                price = price * usdToInr;
            }
            // Some Crypto is already in USD, convert it
            if (q.quoteType === 'CRYPTOCURRENCY' && q.currency === 'USD') {
                price = price * usdToInr;
            }
            
            priceMap[q.symbol] = price;
        });

        return priceMap;
    } catch (e) {
        console.error("Yahoo Finance Library Error:", e.message); // <--- Note the new error message
        return {};
    }
};

// --- ROUTES ---

// 1. INVESTMENTS (Auto-Convert to INR)
app.get('/api/investments', async (req, res) => {
    try {
        const investments = await Investment.find();
        
        // Get Unique Tickers
        const tickers = [...new Set(investments.map(i => i.ticker).filter(t => t))];
        
        // Fetch Live Prices (Safe Method)
        let livePrices = {};
        if (tickers.length > 0) {
            livePrices = await fetchLivePrices(tickers);
        }
        
        // Merge Live Data
        const data = investments.map(inv => {
            const livePriceINR = livePrices[inv.ticker] || inv.buy_price; 
            return {
                ...inv._doc,
                current_price: livePriceINR, 
                id: inv._id
            };
        });

        res.json({ investments: data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server Error" });
    }
});

app.post('/api/investments', async (req, res) => {
    const newItem = new Investment(req.body);
    await newItem.save();
    res.json(newItem);
});
app.put('/api/investments/:id', async (req, res) => {
    try {
        const updated = await Investment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch(e) { res.status(404).json({error: "Not Found"}); }
});
app.delete('/api/investments/:id', async (req, res) => {
    await Investment.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// 2. SEARCH (Using yahoo-finance2)
app.get('/api/investments/search', async (req, res) => {
    const query = req.query.q;
    if(!query) return res.json([]);
    try {
        const results = await yahooFinance.search(query);
        const quotes = results.quotes || [];
        
        // Format for Frontend
        const formatted = quotes
            .filter(q => q.isYahooFinance) // Filter out news items
            .map(q => ({
                name: q.shortname || q.longname || q.symbol,
                symbol: q.symbol,
                category: q.quoteType === 'CRYPTOCURRENCY' ? 'Crypto' : 'Stock',
                exchange: q.exchange
            }))
            .slice(0, 8);
            
        res.json(formatted);
    } catch (err) { 
        console.error("Search Error:", err.message);
        res.json([]); 
    }
});

// 3. TRANSACTIONS
app.get('/api/transactions', async (req, res) => {
    const data = await Transaction.find();
    res.json(data);
});
app.post('/api/transactions', async (req, res) => {
    const newItem = new Transaction(req.body);
    await newItem.save();
    res.json(newItem);
});
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch(e) { res.status(404).json({error: "Not Found"}); }
});
app.delete('/api/transactions/:id', async (req, res) => {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// 4. BUDGETS & GOALS
app.get('/api/budgets', async (req, res) => { res.json(await Budget.find()); });
app.post('/api/budgets', async (req, res) => { res.json(await new Budget(req.body).save()); });
app.put('/api/budgets/:id', async (req, res) => { res.json(await Budget.findByIdAndUpdate(req.params.id, req.body, {new:true})); });
app.delete('/api/budgets/:id', async (req, res) => { await Budget.findByIdAndDelete(req.params.id); res.json({msg:"Deleted"}); });

app.get('/api/goals', async (req, res) => { res.json(await Goal.find()); });
app.post('/api/goals', async (req, res) => { res.json(await new Goal(req.body).save()); });
app.put('/api/goals/:id', async (req, res) => { res.json(await Goal.findByIdAndUpdate(req.params.id, req.body, {new:true})); });
app.delete('/api/goals/:id', async (req, res) => { await Goal.findByIdAndDelete(req.params.id); res.json({msg:"Deleted"}); });

// 5. EXPORT
app.post('/api/export', async (req, res) => {
    const { type } = req.body;
    let query = {};
    if(type !== 'all') query.type = type;
    const data = await Transaction.find(query);
    let csv = "Date,Type,Category,Description,Amount\n";
    data.forEach(t => { csv += `${t.date},${t.type},${t.category},${t.description},${t.amount}\n`; });
    res.header('Content-Type', 'text/csv');
    res.attachment('finance_data.csv');
    res.send(csv);
});

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`));