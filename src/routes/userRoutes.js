const express = require('express');
const router = express.Router();
const { userModel } = require('../db/models');

// Get all users
router.get('/', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const users = await userModel.list(parseInt(limit), parseInt(offset));
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await userModel.getById(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(404).json({ error: 'User not found' });
    }
});

module.exports = router; 