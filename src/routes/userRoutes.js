const express = require('express');
const router = express.Router();
const { userModel } = require('../db/models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = '';
        if (file.fieldname === 'profileImage') {
            uploadPath = path.join(__dirname, '../../uploads/profiles');
        } else if (file.fieldname === 'bannerImage') {
            uploadPath = path.join(__dirname, '../../uploads/banners');
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and sanitize original name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        cb(null, uniqueSuffix + sanitizedExt);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept only image files
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only image files are allowed!"));
    }
});

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

// Update user profile
router.put('/:id', auth, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]), async (req, res) => {
    try {
        // Check if the authenticated user is the same as the profile being updated
        if (req.user.id != req.params.id) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }
        
        const userId = req.params.id;
        const { username, bio } = req.body;
        
        // Get existing user data to check for existing images
        const existingUser = await userModel.getById(userId);
        
        // Prepare update data
        const updateData = {
            Username: username,
            Bio: bio
        };
        
        // Handle profile image upload
        if (req.files && req.files.profileImage) {
            const profileImage = req.files.profileImage[0];
            // Store only the relative path from the uploads directory, ensure consistent format
            const relativePath = `/uploads/profiles/${encodeURIComponent(path.basename(profileImage.path))}`;
            updateData.ProfileImage = relativePath;
            
            // Delete old image if it exists and is not a URL
            if (existingUser.ProfileImage && 
                !existingUser.ProfileImage.startsWith('http') && 
                fs.existsSync(path.join(__dirname, '../../', existingUser.ProfileImage.replace(/^\//, '')))) {
                try {
                    fs.unlinkSync(path.join(__dirname, '../../', existingUser.ProfileImage.replace(/^\//, '')));
                } catch (err) {
                    console.error('Error deleting old profile image:', err);
                }
            }
        }
        
        // Handle banner image upload
        if (req.files && req.files.bannerImage) {
            const bannerImage = req.files.bannerImage[0];
            // Store only the relative path from the uploads directory, ensure consistent format
            const relativePath = `/uploads/banners/${encodeURIComponent(path.basename(bannerImage.path))}`;
            updateData.BannerImage = relativePath;
            
            // Delete old image if it exists and is not a URL
            if (existingUser.BannerImage && 
                !existingUser.BannerImage.startsWith('http') && 
                fs.existsSync(path.join(__dirname, '../../', existingUser.BannerImage.replace(/^\//, '')))) {
                try {
                    fs.unlinkSync(path.join(__dirname, '../../', existingUser.BannerImage.replace(/^\//, '')));
                } catch (err) {
                    console.error('Error deleting old banner image:', err);
                }
            }
        }
        
        // Update user in database
        const updatedUser = await userModel.update(userId, updateData);
        
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
});

// Follow user
router.post('/:userId/follow/:targetId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const targetId = req.params.targetId;
        
        // Verify user is trying to follow on their own behalf
        if (userId != req.user.id) {
            return res.status(403).json({ error: 'You can only perform follow actions for your own account' });
        }
        
        // Check if trying to follow self
        if (userId == targetId) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }
        
        // Check if target user exists
        const targetUser = await userModel.getById(targetId);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }
        
        // Check if already following
        const isFollowing = await userModel.checkFollowing(userId, targetId);
        if (isFollowing) {
            return res.status(400).json({ error: 'Already following this user' });
        }
        
        // Create follow relationship
        await userModel.followUser(userId, targetId);
        
        // Update follower/following counts
        await userModel.updateFollowerCount(targetId, 1); // Increment target's follower count
        await userModel.updateFollowingCount(userId, 1); // Increment user's following count
        
        res.status(200).json({ 
            success: true,
            following: true,
            message: 'Successfully followed user' 
        });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ error: error.message || 'Failed to follow user' });
    }
});

// Unfollow user
router.delete('/:userId/unfollow/:targetId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const targetId = req.params.targetId;
        
        // Verify user is trying to unfollow on their own behalf
        if (userId != req.user.id) {
            return res.status(403).json({ error: 'You can only perform unfollow actions for your own account' });
        }
        
        // Check if trying to unfollow self
        if (userId == targetId) {
            return res.status(400).json({ error: 'You cannot unfollow yourself' });
        }
        
        // Check if target user exists
        const targetUser = await userModel.getById(targetId);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }
        
        // Check if actually following
        const isFollowing = await userModel.checkFollowing(userId, targetId);
        if (!isFollowing) {
            return res.status(400).json({ error: 'Not following this user' });
        }
        
        // Remove follow relationship
        await userModel.unfollowUser(userId, targetId);
        
        // Update follower/following counts
        await userModel.updateFollowerCount(targetId, -1); // Decrement target's follower count
        await userModel.updateFollowingCount(userId, -1); // Decrement user's following count
        
        res.status(200).json({ 
            success: true,
            following: false,
            message: 'Successfully unfollowed user' 
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ error: error.message || 'Failed to unfollow user' });
    }
});

// Check if user is following another user
router.get('/:userId/following/:targetId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const targetId = req.params.targetId;
        
        // Verify user is querying on their own behalf
        if (userId != req.user.id) {
            return res.status(403).json({ error: 'You can only check follow status for your own account' });
        }
        
        // Check following status
        const isFollowing = await userModel.checkFollowing(userId, targetId);
        
        res.status(200).json({
            following: isFollowing
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: error.message || 'Failed to check follow status' });
    }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { limit = 20, offset = 0 } = req.query;
        
        // Get followers
        const followers = await userModel.getFollowers(userId, parseInt(limit), parseInt(offset));
        
        res.status(200).json(followers);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch followers' });
    }
});

// Get users that a user is following
router.get('/:userId/following', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { limit = 20, offset = 0 } = req.query;
        
        // Get following users
        const following = await userModel.getFollowing(userId, parseInt(limit), parseInt(offset));
        
        res.status(200).json(following);
    } catch (error) {
        console.error('Error fetching following users:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch following users' });
    }
});

module.exports = router; 