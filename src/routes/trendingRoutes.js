const express = require('express');
const router = express.Router();
const db = require('../db/config');

router.get('/', async (req, res) => {
  try {
    const trendingTracks = await db.any(`
      SELECT 
        t."TrackID",
        t."Title",
        t."Artist",
        t."Genre",
        t."CoverArt",
        t."FilePath",
        t."Duration", 
        t."UserID",
        u."Username",
        COUNT(DISTINCT lh."PlayedAt") AS play_count,
        COUNT(DISTINCT tl."UserID") AS like_count,
        COALESCE(SUM(
          1.5 - LEAST(1.5, EXTRACT(DAY FROM NOW() - lh."PlayedAt") / 7.0)
        ), 0) AS decay_weighted_plays,
        (COALESCE(SUM(
          1.5 - LEAST(1.5, EXTRACT(DAY FROM NOW() - lh."PlayedAt") / 7.0)
        ), 0) + 2 * COUNT(DISTINCT tl."UserID")) AS score
      FROM "Track" t
      LEFT JOIN "ListenerHistory" lh 
        ON t."TrackID" = lh."TrackID" 
        AND lh."PlayedAt" >= NOW() - INTERVAL '7 days'
      LEFT JOIN "TrackLikes" tl 
        ON t."TrackID" = tl."TrackID"
      LEFT JOIN "User" u
        ON t."UserID" = u."UserID"
      GROUP BY t."TrackID", t."Title", t."Artist", t."Genre", t."CoverArt", t."FilePath", t."Duration", t."UserID", u."Username"
      ORDER BY score DESC
      LIMIT 20;
    `);      

    res.json(trendingTracks);
  } catch (err) {
    console.error('Trending Route Error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;