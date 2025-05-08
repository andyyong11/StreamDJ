const express = require('express');
const router = express.Router();
const db = require('../db/config');

router.get('/:userId/liked-songs', async (req, res) => {
  const { userId } = req.params;
  try {
    const likedTracks = await db.any(`
      SELECT t.*
      FROM "Track" t
      JOIN "TrackLikes" tl ON t."TrackID" = tl."TrackID"
      WHERE tl."UserID" = $1
      ORDER BY tl."LikedAt" DESC
    `, [userId]);

    res.json(likedTracks);
  } catch (err) {
    console.error('Error fetching liked songs:', err);
    res.status(500).json({ error: 'Failed to fetch liked songs' });
  }
});

module.exports = router;

// const express = require('express');
// const router = express.Router(); // ✅ You were missing this line!
// const db = require('../db/config');

// router.get('/:userId/liked-songs', async (req, res) => {
//     const { userId } = req.params;
//     try {
//       const likedTracks = await db.any(`
//         SELECT t.*
//         FROM "Track" t
//         JOIN "TrackLikes" tl ON t."TrackID" = tl."TrackID"
//         WHERE tl."UserID" = $1
//         ORDER BY tl."LikedAt" DESC
//       `, [userId]);
  
//       res.json(likedTracks);
//     } catch (err) {
//       console.error('Error fetching liked songs:', err);
//       res.status(500).json({ error: 'Failed to fetch liked songs' });
//     }
//   });  