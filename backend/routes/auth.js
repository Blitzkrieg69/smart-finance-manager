// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

const SALT_ROUNDS = 10;

// 1. CHECK AUTH STATUS
router.get('/check', async (req, res) => {
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
        console.error('Auth Check Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. REGISTER
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        // Auto-Login (Set Session)
        req.session.userId = newUser._id;
        req.session.user = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: req.session.user
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        console.log("USER FOUND:", user);  // ADD THIS
        console.log("INPUT PASSWORD:", password); // ADD THIS

        // Use bcrypt.compare instead of plain text check
        const isMatch = user ? await bcrypt.compare(password, user.password) : false;
        console.log("IS MATCH:", isMatch); // ADD THIS
        if (!user || !isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set Session
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
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logout successful' });
    });
});

module.exports = router;