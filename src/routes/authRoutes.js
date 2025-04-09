const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userModel } = require('../db/models');

// Check if username exists
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await userModel.getByUsername(username);
        res.json({ exists: !!user });
    } catch (error) {
        console.error('Username check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register new user
router.post('/register', async (req, res) => {
    console.log('Received registration request');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { username: !!username, email: !!email, password: !!password }
            });
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        console.log('Creating user in database...');
        const user = await userModel.create(username, email, password_hash);
        console.log('User created:', { id: user.UserID, username: user.Username, email: user.Email });

        // Generate token
        console.log('Generating JWT token...');
        const token = jwt.sign(
            { id: user.UserID, username: user.Username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Registration successful');
        res.status(201).json({
            user: {
                id: user.UserID,
                username: user.Username,
                email: user.Email
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
            error: error.message,
            type: error.name,
            details: error.toString()
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user by email
        const user = await userModel.getByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Generate token
        const token = jwt.sign(
            { id: user.UserID, username: user.Username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            user: {
                id: user.UserID,
                username: user.Username,
                email: user.Email
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const user = await userModel.getById(req.user.id);
        res.json({
            id: user.UserID,
            username: user.Username,
            email: user.Email
        });
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
});

module.exports = router; 