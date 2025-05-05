const express = require('express');
const router = express.Router();
const db = require('../db/config');

// ✅ Unified recommendation logic with wrapped UNION
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const recommendations = await db.any(`
      SELECT combined.*, u."Username" 
      FROM (
        -- Top liked tracks by user
        SELECT t.*
        FROM "Track" t
        JOIN (
          SELECT "TrackID"
          FROM "TrackLikes"
          WHERE "UserID" = $1
          GROUP BY "TrackID"
          LIMIT 5
        ) liked ON liked."TrackID" = t."TrackID"

        UNION

        -- Top played tracks by user
        SELECT t.*
        FROM "Track" t
        JOIN (
          SELECT "TrackID"
          FROM "ListenerHistory"
          WHERE "UserID" = $1
          GROUP BY "TrackID"
          ORDER BY COUNT(*) DESC
          LIMIT 5
        ) recent ON recent."TrackID" = t."TrackID"

        UNION

        -- Tracks from most listened genres
        SELECT *
        FROM "Track"
        WHERE "Genre" IN (
          SELECT "Genre"
          FROM "Track" t
          JOIN "ListenerHistory" lh ON lh."TrackID" = t."TrackID"
          WHERE lh."UserID" = $1
          GROUP BY "Genre"
          ORDER BY COUNT(*) DESC
          LIMIT 2
        )
      ) AS combined
      LEFT JOIN "User" u ON combined."UserID" = u."UserID"
      ORDER BY RANDOM()
      LIMIT 20;
    `, [userId]);

    res.json(recommendations);
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

router.get('/collab/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const recommendations = await db.any(`
        SELECT t.*, u."Username"
        FROM "Track" t
        JOIN "TrackLikes" tl ON tl."TrackID" = t."TrackID"
        LEFT JOIN "User" u ON t."UserID" = u."UserID"
        WHERE tl."UserID" IN (
          SELECT DISTINCT other."UserID"
          FROM "TrackLikes" other
          WHERE other."TrackID" IN (
            SELECT "TrackID"
            FROM "TrackLikes"
            WHERE "UserID" = $1
          ) AND other."UserID" != $1
        )
        AND t."TrackID" NOT IN (
          SELECT "TrackID"
          FROM "TrackLikes"
          WHERE "UserID" = $1
        )
        GROUP BY t."TrackID", u."Username"
        ORDER BY COUNT(*) DESC
        LIMIT 20;
      `, [userId]);
  
      res.json(recommendations);
    } catch (err) {
      console.error('Collaborative recommendation error:', err);
      res.status(500).json({ error: 'Failed to generate collaborative recommendations' });
    }
  });
  
// 📌 Because You Listened To: Recommend by most recent genre
router.get('/recent-genre/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const recommendations = await db.any(`
        SELECT t.*, u."Username"
        FROM "Track" t
        LEFT JOIN "User" u ON t."UserID" = u."UserID"
        WHERE t."Genre" = (
          SELECT t."Genre"
          FROM "ListenerHistory" lh
          JOIN "Track" t ON lh."TrackID" = t."TrackID"
          WHERE lh."UserID" = $1
          ORDER BY lh."PlayedAt" DESC
          LIMIT 1
        )
        ORDER BY RANDOM()
        LIMIT 20;
      `, [userId]);
  
      res.json(recommendations);
    } catch (err) {
      console.error('Recent genre recommendation error:', err);
      res.status(500).json({ error: 'Failed to generate recent genre recommendations' });
    }
  });
  
module.exports = router;