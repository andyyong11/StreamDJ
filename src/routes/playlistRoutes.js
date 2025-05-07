// Updated playlistRoutes.js without playlistModel usage
const express = require('express');
const router = express.Router();
const db = require('../db/config');
const { auth } = require('../middleware/auth');

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

// Get playlist by ID (public)

// Get playlist by ID including tracks
// Get playlist by ID with tracks
router.get('/:id', async (req, res) => {
  try {
    const playlist = await db.oneOrNone(
      `SELECT * FROM "Playlist" WHERE "PlaylistID" = $1`,
      [req.params.id]
    );

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const tracks = await db.any(
      `SELECT t.*
       FROM "Track" t
       JOIN "PlaylistTrack" pt ON pt."TrackID" = t."TrackID"
       WHERE pt."PlaylistID" = $1
       ORDER BY pt."Position" ASC`,
      [req.params.id]
    );

    res.json({ ...playlist, tracks }); // ✅ Combine and send
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// router.get('/:id', async (req, res) => {
//   try {
//     const playlist = await db.oneOrNone(`SELECT * FROM "Playlist" WHERE "PlaylistID" = $1`, [req.params.id]);
//     if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
//     res.json(playlist);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

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
    const { trackId, position = null } = req.body;

    const playlist = await db.oneOrNone(
      `SELECT * FROM "Playlist" WHERE "PlaylistID" = $1`,
      [req.params.id]
    );

    if (!playlist || playlist.UserID !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
    }

    // ✅ Calculate position if not provided
    let finalPosition = position;
    if (finalPosition === null) {
      const existing = await db.oneOrNone(
        `SELECT MAX("Position") + 1 AS pos FROM "PlaylistTrack" WHERE "PlaylistID" = $1`,
        [req.params.id]
      );
      finalPosition = existing?.pos || 1;
    }

    // ✅ Insert with AddedAt
    const result = await db.one(
      `INSERT INTO "PlaylistTrack" ("PlaylistID", "TrackID", "Position", "AddedAt")
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [req.params.id, trackId, finalPosition]
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
      ORDER BY pt."Position"
      LIMIT 4
    `, [req.params.id]);

    res.json(covers.map(c => c.CoverArt));
  } catch (error) {
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