const express = require('express');
const router = express.Router();
const db = require('../db/config');

// Mock data to use when database is not available
const mockTrendingTracks = [
  {
    TrackID: 1,
    Title: "Summer Vibes",
    Artist: "DJ Cool",
    Genre: "Electronic",
    CoverArt: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg",
    FilePath: "https://example.com/track1.mp3",
    Duration: 180,
    UserID: 1,
    Username: "DJ Cool",
    play_count: 1500,
    like_count: 220
  },
  {
    TrackID: 2, 
    Title: "Midnight Drive",
    Artist: "Night Rider",
    Genre: "Synthwave",
    CoverArt: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/800px-Image_created_with_a_mobile_phone.png",
    FilePath: "https://example.com/track2.mp3",
    Duration: 210,
    UserID: 2,
    Username: "Night Rider",
    play_count: 1200,
    like_count: 180
  },
  {
    TrackID: 3,
    Title: "Chill Out",
    Artist: "Relaxo",
    Genre: "Lo-fi",
    CoverArt: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Moon_over_Washington_Monument.jpg/800px-Moon_over_Washington_Monument.jpg",
    FilePath: "https://example.com/track3.mp3",
    Duration: 195,
    UserID: 3,
    Username: "Relaxo",
    play_count: 950,
    like_count: 160
  }
];

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
    
    // Return mock data if the database query fails
    console.warn('Database query failed, returning mock trending data');
    res.json(mockTrendingTracks);
  }
});

module.exports = router;