const express = require('express');
const router = express.Router();
const db = require('../db/config');

// Mock data for recommendations
const mockRecommendations = [
  {
    TrackID: 4,
    Title: "Dance Party",
    Artist: "Groove Master",
    Genre: "House",
    CoverArt: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/TEIDE.JPG/800px-TEIDE.JPG",
    FilePath: "https://example.com/track4.mp3",
    Duration: 240,
    UserID: 4,
    Username: "Groove Master"
  },
  {
    TrackID: 5,
    Title: "Deep Focus",
    Artist: "Zen Mind",
    Genre: "Ambient",
    CoverArt: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Altja_jõgi_Lahemaal.jpg/800px-Altja_jõgi_Lahemaal.jpg",
    FilePath: "https://example.com/track5.mp3",
    Duration: 320, 
    UserID: 5,
    Username: "Zen Mind"
  },
  {
    TrackID: 6,
    Title: "Energy Boost",
    Artist: "Power Pump",
    Genre: "EDM",
    CoverArt: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Jaguar_in_Artis_%282090242525%29.jpg/800px-Jaguar_in_Artis_%282090242525%29.jpg",
    FilePath: "https://example.com/track6.mp3",
    Duration: 185,
    UserID: 6,
    Username: "Power Pump"
  }
];

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
    console.warn('Database query failed, returning mock recommendations');
    res.json(mockRecommendations);
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
      console.warn('Database query failed, returning mock collab recommendations');
      res.json(mockRecommendations);
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
      console.warn('Database query failed, returning mock genre recommendations');
      res.json(mockRecommendations);
    }
  });
  
module.exports = router;