// Updated playlistRoutes.js without playlistModel usage
const express = require('express');
const router = express.Router();
const db = require('../db/config');
const { auth } = require('../middleware/auth');
const authenticateToken = require('../middleware/authenticateToken');

// Get all playlists (public)
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const playlists = await db.any(
      `SELECT * FROM "Playlist" WHERE "IsPublic" = true ORDER BY "CreatedAt" DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured playlists (public)
router.get('/featured', async (req, res) => {
  try {
    const featured = await db.any(`
      SELECT p.*, COUNT(DISTINCT tl."LikeID") AS total_likes, COUNT(DISTINCT lh."PlayedAt") AS total_plays
      FROM "Playlist" p
      JOIN "PlaylistTrack" pt ON pt."PlaylistID" = p."PlaylistID"
      JOIN "Track" t ON t."TrackID" = pt."TrackID"
      LEFT JOIN "TrackLikes" tl ON tl."TrackID" = t."TrackID"
      LEFT JOIN "ListenerHistory" lh ON lh."TrackID" = t."TrackID"
      WHERE p."IsPublic" = true
      GROUP BY p."PlaylistID"
      ORDER BY (COUNT(DISTINCT tl."LikeID") + COUNT(DISTINCT lh."PlayedAt")) DESC
      LIMIT 10;
    `);
    res.json(featured);
  } catch (err) {
    console.error('Error fetching featured playlists:', err);
    res.status(500).json({ error: 'Failed to fetch featured playlists' });
  }
});

// Get personalized featured playlists for a user
router.get('/featured/personalized/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const personalized = await db.any(`
      SELECT p.*, COUNT(DISTINCT tl."LikeID") AS total_likes, COUNT(DISTINCT lh."PlayedAt") AS total_plays
      FROM "Playlist" p
      JOIN "PlaylistTrack" pt ON pt."PlaylistID" = p."PlaylistID"
      JOIN "Track" t ON t."TrackID" = pt."TrackID"
      LEFT JOIN "TrackLikes" tl ON tl."TrackID" = t."TrackID" AND tl."UserID" = $1
      LEFT JOIN "ListenerHistory" lh ON lh."TrackID" = t."TrackID" AND lh."UserID" = $1
      WHERE p."IsPublic" = true
      GROUP BY p."PlaylistID"
      ORDER BY (COUNT(DISTINCT tl."LikeID") + COUNT(DISTINCT lh."PlayedAt")) DESC
      LIMIT 10;
    `, [userId]);
    res.json(personalized);
  } catch (err) {
    console.error('Error fetching personalized playlists:', err);
    res.status(500).json({ error: 'Failed to fetch personalized playlists' });
  }
});

// Get user's playlists (protected)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const playlists = await db.any(
      `SELECT * FROM "Playlist" WHERE "UserID" = $1 ORDER BY "CreatedAt" DESC`,
      [userId]
    );
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get liked playlists for a user - MUST come before /:id route
router.get('/liked/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const query = `
            SELECT p.*, u."Username" AS CreatorName, 
                   COUNT(pt."TrackID") AS TrackCount
            FROM "Playlist" p
            JOIN "PlaylistLikes" pl ON p."PlaylistID" = pl."PlaylistID"
            JOIN "User" u ON p."UserID" = u."UserID"
            LEFT JOIN "PlaylistTrack" pt ON p."PlaylistID" = pt."PlaylistID"
            WHERE pl."UserID" = $1
            GROUP BY p."PlaylistID", u."Username", pl."LikedAt"
            ORDER BY pl."LikedAt" DESC
        `;
        
        const likedPlaylists = await db.any(query, [userId]);
        
        res.json(likedPlaylists);
    } catch (error) {
        console.error('Error fetching liked playlists:', error);
        res.status(500).json({ error: 'Failed to fetch liked playlists' });
    }
});

// Get playlist by ID - Must come AFTER specific routes like /liked/:userId
router.get('/:id', async (req, res) => {
  try {
    // Step 1: Get the playlist basic info first with creator name
    const playlist = await db.oneOrNone(
      `SELECT p.*, u."Username" as "CreatorName", u."UserID" as "CreatorID"
       FROM "Playlist" p
       LEFT JOIN "User" u ON p."UserID" = u."UserID" 
       WHERE p."PlaylistID" = $1`,
      [req.params.id]
    );

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    try {
      // Step 2: Get tracks separately with error handling
      // Removed the ORDER BY pt."Position" clause since the column doesn't exist
      const tracks = await db.any(
        `SELECT t.*
         FROM "Track" t
         JOIN "PlaylistTrack" pt ON pt."TrackID" = t."TrackID"
         WHERE pt."PlaylistID" = $1
         ORDER BY pt."AddedAt"`,
        [req.params.id]
      );
      
      // Step 3: Return both together
      res.json({ 
        ...playlist, 
        Tracks: tracks 
      });
    } catch (trackError) {
      console.error(`ERROR fetching tracks for playlist ${req.params.id}:`, trackError);
      // If we can't get tracks, still return the playlist info
      res.json({ 
        ...playlist, 
        Tracks: [],
        trackError: trackError.message
      });
    }
  } catch (error) {
    console.error(`ERROR in playlist/${req.params.id} endpoint:`, error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Create new playlist (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, isPublic = true, description = '', coverURL = null } = req.body;
    const result = await db.one(`
      INSERT INTO "Playlist" ("UserID", "Title", "IsPublic", "Description", "CoverURL", "CreatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *;
    `, [req.user.id, title, isPublic, description, coverURL]);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update playlist (protected + ownership check)
router.put('/:id', auth, async (req, res) => {
  try {
    const playlist = await db.oneOrNone(`SELECT * FROM "Playlist" WHERE "PlaylistID" = $1`, [req.params.id]);
    if (!playlist || playlist.UserID !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this playlist' });
    }
    const { title, description, isPublic, coverURL } = req.body;
    const updated = await db.one(`
      UPDATE "Playlist"
      SET "Title" = $1, "Description" = $2, "IsPublic" = $3, "CoverURL" = $4
      WHERE "PlaylistID" = $5 RETURNING *;
    `, [title, description, isPublic, coverURL, req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete playlist (protected + ownership check)
router.delete('/:id', auth, async (req, res) => {
  try {
    const playlist = await db.oneOrNone(`SELECT * FROM "Playlist" WHERE "PlaylistID" = $1`, [req.params.id]);
    if (!playlist || playlist.UserID !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this playlist' });
    }
    await db.none(`DELETE FROM "Playlist" WHERE "PlaylistID" = $1`, [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add track to playlist (protected + ownership check)
router.post('/:id/tracks', auth, async (req, res) => {
  try {
    const { trackId } = req.body;

    const playlist = await db.oneOrNone(
      `SELECT * FROM "Playlist" WHERE "PlaylistID" = $1`,
      [req.params.id]
    );

    if (!playlist || playlist.UserID !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
    }

    // ✅ Insert with AddedAt, removing position parameter
    const result = await db.one(
      `INSERT INTO "PlaylistTrack" ("PlaylistID", "TrackID", "AddedAt")
       VALUES ($1, $2, NOW()) RETURNING *`,
      [req.params.id, trackId]
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove track from playlist (protected + ownership check)
router.delete('/:id/tracks/:trackId', auth, async (req, res) => {
  try {
    const playlist = await db.oneOrNone(`SELECT * FROM "Playlist" WHERE "PlaylistID" = $1`, [req.params.id]);
    if (!playlist || playlist.UserID !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
    }
    await db.none(`DELETE FROM "PlaylistTrack" WHERE "PlaylistID" = $1 AND "TrackID" = $2`, [req.params.id, req.params.trackId]);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get cover art for playlist (first 1–4 tracks)
router.get('/:id/covers', async (req, res) => {
  try {
    const covers = await db.any(`
      SELECT t."CoverArt"
      FROM "PlaylistTrack" pt
      JOIN "Track" t ON t."TrackID" = pt."TrackID"
      WHERE pt."PlaylistID" = $1
      ORDER BY pt."AddedAt"
      LIMIT 4
    `, [req.params.id]);

    res.json(covers.map(c => c.CoverArt));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like a playlist
router.post('/:id/like', async (req, res) => {
  const { userId } = req.body;
  const playlistId = parseInt(req.params.id);

  try {
    await db.none(
      `INSERT INTO "PlaylistLikes" ("UserID", "PlaylistID") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, playlistId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error liking playlist:', err);
    res.status(500).json({ error: 'Failed to like playlist.' });
  }
});

// Unlike a playlist
router.post('/:id/unlike', async (req, res) => {
  const { userId } = req.body;
  const playlistId = parseInt(req.params.id);

  try {
    await db.none(
      `DELETE FROM "PlaylistLikes" WHERE "UserID" = $1 AND "PlaylistID" = $2`,
      [userId, playlistId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error unliking playlist:', err);
    res.status(500).json({ error: 'Failed to unlike playlist.' });
  }
});

// Get like status for a playlist
router.get('/:id/like-status', async (req, res) => {
  const { userId } = req.query;
  const playlistId = parseInt(req.params.id);

  try {
    const exists = await db.oneOrNone(
      `SELECT 1 FROM "PlaylistLikes" WHERE "UserID" = $1 AND "PlaylistID" = $2`,
      [userId, playlistId]
    );
    res.json({ liked: !!exists });
  } catch (err) {
    console.error('Error checking playlist like status:', err);
    res.status(500).json({ error: 'Failed to fetch playlist like status.' });
  }
});

// Get featured playlists with covers
router.get('/featured/covers', async (req, res) => {
    try {
        const featuredWithCovers = await db.any(`
            SELECT p."PlaylistID", 
                   p."Title", 
                   p."UserID",
                   u."Username" as "CreatorName",
                   (
                     SELECT "CoverArt"
                     FROM "PlaylistTrack" pt
                     JOIN "Track" t ON t."TrackID" = pt."TrackID"
                     WHERE pt."PlaylistID" = p."PlaylistID"
                     LIMIT 1
                   ) as "CoverUrl"
            FROM "Playlist" p
            JOIN "User" u ON p."UserID" = u."UserID"
            WHERE p."IsPublic" = true
            LIMIT 8
        `);
        
        res.json(featuredWithCovers);
    } catch (err) {
        console.error('Error fetching featured playlists with covers:', err);
        res.status(500).json({ error: 'Failed to fetch featured playlists with covers' });
    }
});

// Get playlist cover art (first 4 tracks)
router.get('/:id/cover-art', async (req, res) => {
  try {
    // Get cover images from up to 4 tracks in the playlist
    const coverImages = await db.any(`
      SELECT t."CoverArt"
      FROM "PlaylistTrack" pt
      JOIN "Track" t ON t."TrackID" = pt."TrackID"
      WHERE pt."PlaylistID" = $1
      ORDER BY pt."AddedAt"
      LIMIT 4
    `, [req.params.id]);
    
    res.json(coverImages);
  } catch (error) {
    console.error('Error getting playlist cover art:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { playlistModel } = require('../db/models');
// const db = require('../db/config');
// const { auth } = require('../middleware/auth');

// // Get all playlists (public)
// router.get('/', async (req, res) => {
//   try {
//     const { limit = 10, offset = 0 } = req.query;
//     const playlists = await playlistModel.listPublic(parseInt(limit), parseInt(offset));
//     res.json(playlists);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get featured playlists (public)
// router.get('/featured', async (req, res) => {
//     try {
//       const featured = await db.any(`
//         SELECT p.*, COUNT(DISTINCT tl."LikeID") AS total_likes, COUNT(DISTINCT lh."PlayedAt") AS total_plays
//         FROM "Playlist" p
//         JOIN "PlaylistTrack" pt ON pt."PlaylistID" = p."PlaylistID"
//         JOIN "Track" t ON t."TrackID" = pt."TrackID"
//         LEFT JOIN "TrackLikes" tl ON tl."TrackID" = t."TrackID"
//         LEFT JOIN "ListenerHistory" lh ON lh."TrackID" = t."TrackID"
//         WHERE p."IsPublic" = true
//         GROUP BY p."PlaylistID"
//         ORDER BY (COUNT(DISTINCT tl."LikeID") + COUNT(DISTINCT lh."PlayedAt")) DESC
//         LIMIT 10;
//       `);
//       console.log('Featured Playlists:', featured);
  
//       res.json(featured);
//     } catch (err) {
//       console.error('Error fetching featured playlists:', err);
//       res.status(500).json({ error: 'Failed to fetch featured playlists' });
//     }
//   });

// // Get personalized featured playlists for a user
// router.get('/featured/personalized/:userId', async (req, res) => {
//     const { userId } = req.params;
  
//     try {
//       const personalized = await db.any(`
//         SELECT p.*, 
//           COUNT(DISTINCT tl."LikeID") AS total_likes, 
//           COUNT(DISTINCT lh."PlayedAt") AS total_plays
//         FROM "Playlist" p
//         JOIN "PlaylistTrack" pt ON pt."PlaylistID" = p."PlaylistID"
//         JOIN "Track" t ON t."TrackID" = pt."TrackID"
//         LEFT JOIN "TrackLikes" tl ON tl."TrackID" = t."TrackID" AND tl."UserID" = $1
//         LEFT JOIN "ListenerHistory" lh ON lh."TrackID" = t."TrackID" AND lh."UserID" = $1
//         WHERE p."IsPublic" = true
//         GROUP BY p."PlaylistID"
//         ORDER BY (COUNT(DISTINCT tl."LikeID") + COUNT(DISTINCT lh."PlayedAt")) DESC
//         LIMIT 10
//       `, [userId]);
  
//       res.json(personalized);
//     } catch (err) {
//       console.error('Error fetching personalized playlists:', err);
//       res.status(500).json({ error: 'Failed to fetch personalized playlists' });
//     }
//   });
  
// // router.get('/featured/personalized/:userId', async (req, res) => {
// //     const { userId } = req.params;
  
// //     try {
// //       const featured = await db.any(`
// //         SELECT DISTINCT p.*, COUNT(DISTINCT tl."LikeID") AS total_likes, COUNT(DISTINCT lh."PlayedAt") AS total_plays
// //         FROM "Playlist" p
// //         JOIN "PlaylistTrack" pt ON pt."PlaylistID" = p."PlaylistID"
// //         JOIN "Track" t ON t."TrackID" = pt."TrackID"
// //         LEFT JOIN "TrackLikes" tl ON tl."TrackID" = t."TrackID"
// //         LEFT JOIN "ListenerHistory" lh ON lh."TrackID" = t."TrackID"
// //         WHERE p."IsPublic" = true
// //         AND (
// //           t."Genre" IN (
// //             SELECT DISTINCT tr."Genre"
// //             FROM "Track" tr
// //             JOIN "TrackLikes" tl2 ON tl2."TrackID" = tr."TrackID"
// //             WHERE tl2."UserID" = $1
// //           )
// //           OR t."TrackID" IN (
// //             SELECT "TrackID"
// //             FROM "TrackLikes"
// //             WHERE "UserID" = $1
// //           )
// //         )
// //         GROUP BY p."PlaylistID"
// //         ORDER BY (COUNT(DISTINCT tl."LikeID") + COUNT(DISTINCT lh."PlayedAt")) DESC
// //         LIMIT 10;
// //       `, [userId]);
  
// //       res.json(featured);
// //     } catch (err) {
// //       console.error('Error fetching personalized featured playlists:', err);
// //       res.status(500).json({ error: 'Failed to fetch personalized playlists' });
// //     }
// //   });  
  
// // Get user's playlists (protected)
// router.get('/user/:userId', auth, async (req, res) => {
//   try {
//     const userId = parseInt(req.params.userId);
//     if (userId !== req.user.id) {
//       return res.status(403).json({ error: 'Unauthorized' });
//     }

//     const playlists = await db.any(
//       `SELECT * FROM "Playlist" WHERE "UserID" = $1 ORDER BY "CreatedAt" DESC`,
//       [userId]
//     );

//     res.json(playlists); // ✅ this is a raw array that frontend .filter() can use
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get playlist by ID (public)
// router.get('/:id', async (req, res) => {
//   try {
//     const playlist = await playlistModel.getById(req.params.id);
//     res.json(playlist);
//   } catch (error) {
//     res.status(404).json({ error: 'Playlist not found' });
//   }
// });

// // Create new playlist (protected)
// router.post('/', auth, async (req, res) => {
//   try {
//     const { title, isPublic = true, description = '', coverURL = null } = req.body;
//     const result = await db.one(`
//       INSERT INTO "Playlist" ("UserID", "Title", "IsPublic", "Description", "CoverURL", "CreatedAt")
//       VALUES ($1, $2, $3, $4, $5, NOW())
//       RETURNING *;
//     `, [req.user.id, title, isPublic, description, coverURL]);

//     res.status(201).json(result);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });


// // router.post('/', auth, async (req, res) => {
// //   try {
// //     const { name, isPublic } = req.body;
// //     const newPlaylist = await playlistModel.create(name, req.user.id, isPublic);
// //     res.status(201).json(newPlaylist);
// //   } catch (error) {
// //     res.status(400).json({ error: error.message });
// //   }
// // });

// // Update playlist (protected + ownership check)
// router.put('/:id', auth, async (req, res) => {
//   try {
//     const playlist = await playlistModel.getById(req.params.id);
//     if (!playlist || playlist.UserID !== req.user.id) {
//       return res.status(403).json({ error: 'Unauthorized to update this playlist' });
//     }
//     const updatedPlaylist = await playlistModel.update(req.params.id, req.body);
//     res.json(updatedPlaylist);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Delete playlist (protected + ownership check)
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const playlist = await playlistModel.getById(req.params.id);
//     if (!playlist || playlist.UserID !== req.user.id) {
//       return res.status(403).json({ error: 'Unauthorized to delete this playlist' });
//     }
//     await playlistModel.delete(req.params.id);
//     res.status(204).send();
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Add track to playlist (protected + ownership check)
// router.post('/:id/tracks', auth, async (req, res) => {
//   try {
//     const { trackId, position } = req.body;
//     const playlist = await playlistModel.getById(req.params.id);
//     if (!playlist || playlist.UserID !== req.user.id) {
//       return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
//     }
//     const result = await playlistModel.addTrack(req.params.id, trackId, position);
//     res.status(201).json(result);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Remove track from playlist (protected + ownership check)
// router.delete('/:id/tracks/:trackId', auth, async (req, res) => {
//   try {
//     const playlist = await playlistModel.getById(req.params.id);
//     if (!playlist || playlist.UserID !== req.user.id) {
//       return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
//     }
//     await playlistModel.removeTrack(req.params.id, req.params.trackId);
//     res.status(204).send();
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });



// module.exports = router;