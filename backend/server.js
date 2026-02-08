require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');

const app = express();

// --- SESSION CONFIGURATION (MUST BE BEFORE ROUTES) ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: 'lax'
    }
}));

// --- CORS (AFTER SESSION) ---
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

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

// --- AUTHENTICATION MIDDLEWARE ---
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// --- HELPER: FETCH PRICES ---
const fetchLivePrices = async (tickers) => {
    if (tickers.length === 0) return {};
    try {
        const priceMap = {};
        const investments = await Investment.find({ ticker: { $in: tickers } });
        investments.forEach(inv => {
            priceMap[inv.ticker] = inv.current_price || inv.buy_price;
        });
        return priceMap;
    } catch (e) {
        console.error("Price Fetch Error:", e.message);
        return {};
    }
};

// --- AUTH ROUTES (BEFORE OTHER ROUTES) ---
app.get('/api/auth/check', async (req, res) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user) {
                return res.json({ 
                    authenticated: true, 
                    user: { 
                        id: user._id, 
                        name: user.name, 
                        email: user.email 
                    }
                });
            }
        }
        res.json({ authenticated: false });
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const user = await User.findOne({ email });
        
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Store user in session
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };
        
        res.json({ 
            success: true,
            message: 'Login successful', 
            user: req.session.user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const newUser = new User({ name, email, password });
        await newUser.save();
        
        // Auto-login after registration
        req.session.userId = newUser._id;
        req.session.user = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email
        };
        
        res.json({ 
            success: true,
            message: 'User created successfully',
            user: req.session.user
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logout successful' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- PROTECTED ROUTES ---

// INVESTMENTS SEARCH
app.get('/api/investments/search', async (req, res) => {
    const query = req.query.q;
    if(!query) return res.json([]);
    
    const commonAssets = [
        { name: 'Apple Inc.', symbol: 'AAPL', category: 'Stock', exchange: 'NASDAQ' },
        { name: 'Microsoft Corporation', symbol: 'MSFT', category: 'Stock', exchange: 'NASDAQ' },
        { name: 'Tesla Inc.', symbol: 'TSLA', category: 'Stock', exchange: 'NASDAQ' },
        { name: 'Amazon.com Inc.', symbol: 'AMZN', category: 'Stock', exchange: 'NASDAQ' },
        { name: 'Google (Alphabet)', symbol: 'GOOGL', category: 'Stock', exchange: 'NASDAQ' },
        { name: 'Bitcoin', symbol: 'BTC-USD', category: 'Crypto', exchange: 'Crypto' },
        { name: 'Ethereum', symbol: 'ETH-USD', category: 'Crypto', exchange: 'Crypto' },
        { name: 'Reliance Industries', symbol: 'RELIANCE.NS', category: 'Stock', exchange: 'NSE' },
        { name: 'TCS (Tata Consultancy)', symbol: 'TCS.NS', category: 'Stock', exchange: 'NSE' },
        { name: 'Infosys', symbol: 'INFY.NS', category: 'Stock', exchange: 'NSE' },
        { name: 'HDFC Bank', symbol: 'HDFCBANK.NS', category: 'Stock', exchange: 'NSE' },
        { name: 'Gold', symbol: 'GOLD', category: 'Gold', exchange: 'Commodity' }
    ];
    
    const filtered = commonAssets.filter(asset => 
        asset.name.toLowerCase().includes(query.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(filtered);
});

// INVESTMENTS
app.get('/api/investments', requireAuth, async (req, res) => {
    try {
        const investments = await Investment.find();
        const tickers = [...new Set(investments.map(i => i.ticker).filter(t => t))];
        let livePrices = {};
        if (tickers.length > 0) {
            livePrices = await fetchLivePrices(tickers);
        }
        
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

app.post('/api/investments', requireAuth, async (req, res) => {
    try {
        const newItem = new Investment(req.body);
        await newItem.save();
        res.json(newItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/investments/:id', requireAuth, async (req, res) => {
    try {
        const updated = await Investment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({error: "Not Found"});
        res.json(updated);
    } catch(e) { 
        res.status(404).json({error: "Not Found"}); 
    }
});

app.delete('/api/investments/:id', requireAuth, async (req, res) => {
    try {
        await Investment.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/investments/refresh', requireAuth, async (req, res) => {
    try {
        const investments = await Investment.find();
        const tickers = [...new Set(investments.map(i => i.ticker).filter(t => t))];
        
        if (tickers.length > 0) {
            const livePrices = await fetchLivePrices(tickers);
            
            for (let inv of investments) {
                if (livePrices[inv.ticker]) {
                    inv.current_price = livePrices[inv.ticker];
                    await inv.save();
                }
            }
        }
        
        res.json({ message: 'Prices refreshed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// TRANSACTIONS
app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
        const data = await Transaction.find().sort({ date: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
    try {
        const newItem = new Transaction(req.body);
        await newItem.save();
        res.json(newItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/transactions/:id', requireAuth, async (req, res) => {
    try {
        const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({error: "Not Found"});
        res.json(updated);
    } catch(e) { 
        res.status(404).json({error: "Not Found"}); 
    }
});

app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// BUDGETS
app.get('/api/budgets', requireAuth, async (req, res) => { 
    try {
        res.json(await Budget.find()); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/budgets', requireAuth, async (req, res) => { 
    try {
        res.json(await new Budget(req.body).save()); 
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/budgets/:id', requireAuth, async (req, res) => { 
    try {
        res.json(await Budget.findByIdAndUpdate(req.params.id, req.body, {new:true})); 
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/budgets/:id', requireAuth, async (req, res) => { 
    try {
        await Budget.findByIdAndDelete(req.params.id); 
        res.json({msg:"Deleted"}); 
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GOALS
app.get('/api/goals', requireAuth, async (req, res) => { 
    try {
        res.json(await Goal.find()); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/goals', requireAuth, async (req, res) => { 
    try {
        res.json(await new Goal(req.body).save()); 
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/goals/:id', requireAuth, async (req, res) => { 
    try {
        res.json(await Goal.findByIdAndUpdate(req.params.id, req.body, {new:true})); 
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/goals/:id', requireAuth, async (req, res) => { 
    try {
        await Goal.findByIdAndDelete(req.params.id); 
        res.json({msg:"Deleted"}); 
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// EXPORT
app.post('/api/export', requireAuth, async (req, res) => {
    try {
        const { type, start_date, end_date } = req.body;
        let query = {};
        
        if (type && type !== 'all') query.type = type;
        if (start_date || end_date) {
            query.date = {};
            if (start_date) query.date.$gte = start_date;
            if (end_date) query.date.$lte = end_date;
        }
        
        const data = await Transaction.find(query);
        let csv = "Date,Type,Category,Description,Amount\n";
        data.forEach(t => { 
            csv += `${t.date},${t.type},${t.category},"${t.description || ''}",${t.amount}\n`; 
        });
        
        res.header('Content-Type', 'text/csv');
        res.attachment('finance_data.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`));
