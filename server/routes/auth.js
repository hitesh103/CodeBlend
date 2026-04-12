const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'codeblend-secret-key-change-in-production';

function createAuthRouter() {
    const router = express.Router();
    router.post('/register', async (req, res) => {
        const { name, email, password } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        try {
            const existing = await User.findOne({ email: email.toLowerCase() });
            if (existing) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            const user = await User.create({ name, email: email.toLowerCase(), password });
            const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
            res.status(201).json({
                token,
                user: { _id: user._id, name: user.name, email: user.email }
            });
        } catch (err) {
            res.status(500).json({ error: 'Registration failed' });
        }
    });

    router.post('/login', async (req, res) => {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        try {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
            res.json({
                token,
                user: { _id: user._id, name: user.name, email: user.email }
            });
        } catch (err) {
            res.status(500).json({ error: 'Login failed' });
        }
    });

    router.get('/me', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.slice(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            res.json({ user });
        } catch (err) {
            res.status(401).json({ error: 'Invalid token' });
        }
    });

    return router;
}

module.exports = createAuthRouter;
