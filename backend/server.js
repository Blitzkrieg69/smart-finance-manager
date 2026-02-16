require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/financeDB';

// --- MIDDLEWARE ---
// 1. CORS: Allow both localhost and 127.0.0.1 to prevent any domain mismatch
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], 
    credentials: true,              
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. SESSION SETUP (Critical for Auth)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false, // Don't create a session until a user actually logs in
    store: MongoStore.create({ 
        mongoUrl: MONGO_URI,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,                 
        secure: false, // MUST BE FALSE for local development (HTTP)
        sameSite: 'lax' // Reliable for local development
    }
}));

// --- DEBUG LOGGER ---
// This will print every request and tell you if the server sees a logged-in user
app.use((req, res, next) => {
    const authStatus = req.session && req.session.userId ? 'Authenticated' : 'Guest';
    console.log(`📡 [${req.method}] ${req.url} | Status: ${authStatus}`);
    next();
});

// --- DATABASE CONNECT ---
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/export', require('./routes/export'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/predictions', require('./routes/predictions'));

// --- START ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
