const express = require('express');
const router = express.Router();

// Get liked playlists for a user - Public access
router.get('/liked/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Find playlists that are NOT created by this user, as those would be more likely to be "liked"
        const query = `
            SELECT p.*, u."Username" AS CreatorName
            FROM "Playlist" p
            JOIN "User" u ON p."UserID" = u."UserID"
            WHERE p."UserID" != $1
            LIMIT 10
        `;
        
        const otherPlaylists = await req.app.locals.db.any(query, [userId]);
        
        // For now, return other users' playlists as "liked playlists" since we don't have actual likes
        res.json(otherPlaylists);
    } catch (error) {
        console.error('Error fetching liked playlists:', error);
        res.status(500).json({ error: 'Failed to fetch liked playlists' });
    }
});

module.exports = router; 