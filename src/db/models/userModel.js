const db = require('../config');

// First ensure FollowingCount column exists
(async () => {
    try {
        // Check if FollowingCount column exists
        const columnExists = await db.oneOrNone(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'User'
                AND column_name = 'FollowingCount'
            ) as exists
        `);
        
        // If column doesn't exist, add it
        if (!columnExists || !columnExists.exists) {
            console.log('Adding FollowingCount column to User table...');
            await db.none(`
                ALTER TABLE "User"
                ADD COLUMN "FollowingCount" INTEGER DEFAULT 0
            `);
            console.log('FollowingCount column added successfully');
        }
    } catch (error) {
        console.error('Error ensuring FollowingCount column exists:', error);
    }
})();

const userModel = {
    // Create a new user
    async create(username, email, password_hash) {
        try {
            const result = await db.one(
                'INSERT INTO "User" ("Username", "Email", "PasswordHash", "Role", "SubscriptionType", "Bio", "Genres", "FollowersCount") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [username, email, password_hash, 'Listener', 'Free', '', '', 0]
            );
            return result;
        } catch (error) {
            if (error.code === '23505') { // Unique violation error code
                if (error.constraint === 'User_Email_key') {
                    throw new Error('Email already exists');
                } else if (error.constraint === 'User_Username_key') {
                    throw new Error('Username already exists');
                }
            }
            throw new Error(`Error creating user: ${error.message}`);
        }
    },

    // Get user by ID
    async getById(id) {
        try {
            return await db.one('SELECT * FROM "User" WHERE "UserID" = $1', [id]);
        } catch (error) {
            throw new Error(`Error getting user: ${error.message}`);
        }
    },

    // Get user by email
    async getByEmail(email) {
        try {
            return await db.one('SELECT * FROM "User" WHERE "Email" = $1', [email]);
        } catch (error) {
            throw new Error(`Error getting user by email: ${error.message}`);
        }
    },

    // Get user by username
    async getByUsername(username) {
        try {
            return await db.oneOrNone('SELECT * FROM "User" WHERE "Username" = $1', [username]);
        } catch (error) {
            throw new Error(`Error getting user by username: ${error.message}`);
        }
    },

    // Update user
    async update(id, updates) {
        try {
            const setClause = Object.keys(updates)
                .map((key, index) => `"${key}" = $${index + 2}`)
                .join(', ');
            const values = Object.values(updates);
            
            return await db.one(
                `UPDATE "User" SET ${setClause} WHERE "UserID" = $1 RETURNING *`,
                [id, ...values]
            );
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    },

    // Update user avatar
    async updateAvatar(id, avatarUrl) {
        try {
          return await db.one(
            'UPDATE "User" SET "ProfilePicture" = $1 WHERE "UserID" = $2 RETURNING *',
            [avatarUrl, id]  // Save the URL, not the binary data
          );
        } catch (error) {
          throw new Error(`Error updating avatar: ${error.message}`);
        }
    },

    // Update user banner
    async updateBanner(id, bannerUrl) {
        try {
        return await db.one(
            'UPDATE "User" SET "Banner" = $1 WHERE "UserID" = $2 RETURNING *',
            [bannerUrl, id]  // Save the URL, not the binary data
        );
        } catch (error) {
        throw new Error(`Error updating banner: ${error.message}`);
        }
    },  

    // Delete user
    async delete(id) {
        try {
            return await db.result('DELETE FROM "User" WHERE "UserID" = $1', [id]);
        } catch (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    },

    // List all users
    async list(limit = 10, offset = 0) {
        try {
            return await db.any('SELECT * FROM "User" ORDER BY "CreatedAt" DESC LIMIT $1 OFFSET $2', 
                [limit, offset]
            );
        } catch (error) {
            throw new Error(`Error listing users: ${error.message}`);
        }
    },
    
    // Follow a user
    async followUser(followerId, followedId) {
        try {
            // First check if UserFollows table exists, if not create it
            await db.none(`
                CREATE TABLE IF NOT EXISTS "UserFollows" (
                    "FollowerID" INTEGER NOT NULL,
                    "FollowedID" INTEGER NOT NULL,
                    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY ("FollowerID", "FollowedID"),
                    FOREIGN KEY ("FollowerID") REFERENCES "User"("UserID") ON DELETE CASCADE,
                    FOREIGN KEY ("FollowedID") REFERENCES "User"("UserID") ON DELETE CASCADE
                )
            `);
            
            // Insert the follow relationship
            return await db.none(
                'INSERT INTO "UserFollows" ("FollowerID", "FollowedID") VALUES ($1, $2)',
                [followerId, followedId]
            );
        } catch (error) {
            if (error.code === '23505') { // Unique violation - already following
                return null; // Silently succeed if already following
            }
            throw new Error(`Error following user: ${error.message}`);
        }
    },
    
    // Unfollow a user
    async unfollowUser(followerId, followedId) {
        try {
            return await db.result(
                'DELETE FROM "UserFollows" WHERE "FollowerID" = $1 AND "FollowedID" = $2',
                [followerId, followedId]
            );
        } catch (error) {
            throw new Error(`Error unfollowing user: ${error.message}`);
        }
    },
    
    // Check if a user is following another
    async checkFollowing(followerId, followedId) {
        try {
            // First check if UserFollows table exists
            const tableExists = await db.oneOrNone(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'UserFollows'
                )
            `);
            
            if (!tableExists || !tableExists.exists) {
                return false;
            }
            
            const result = await db.oneOrNone(
                'SELECT 1 FROM "UserFollows" WHERE "FollowerID" = $1 AND "FollowedID" = $2',
                [followerId, followedId]
            );
            return result !== null;
        } catch (error) {
            throw new Error(`Error checking follow status: ${error.message}`);
        }
    },
    
    // Get followers of a user
    async getFollowers(userId, limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT u.* 
                FROM "User" u
                JOIN "UserFollows" uf ON u."UserID" = uf."FollowerID"
                WHERE uf."FollowedID" = $1
                ORDER BY uf."CreatedAt" DESC
                LIMIT $2 OFFSET $3
            `, [userId, limit, offset]);
        } catch (error) {
            throw new Error(`Error getting followers: ${error.message}`);
        }
    },
    
    // Get users followed by a user
    async getFollowing(userId, limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT u.* 
                FROM "User" u
                JOIN "UserFollows" uf ON u."UserID" = uf."FollowedID"
                WHERE uf."FollowerID" = $1
                ORDER BY uf."CreatedAt" DESC
                LIMIT $2 OFFSET $3
            `, [userId, limit, offset]);
        } catch (error) {
            throw new Error(`Error getting followed users: ${error.message}`);
        }
    },
    
    // Update follower count for a user
    async updateFollowerCount(userId, increment) {
        try {
            return await db.one(`
                UPDATE "User" 
                SET "FollowersCount" = GREATEST(0, COALESCE("FollowersCount", 0) + $2)
                WHERE "UserID" = $1
                RETURNING "FollowersCount"
            `, [userId, increment]);
        } catch (error) {
            throw new Error(`Error updating follower count: ${error.message}`);
        }
    },
    
    // Update following count for a user
    async updateFollowingCount(userId, increment) {
        try {
            return await db.one(`
                UPDATE "User" 
                SET "FollowingCount" = GREATEST(0, COALESCE("FollowingCount", 0) + $2)
                WHERE "UserID" = $1
                RETURNING "FollowingCount"
            `, [userId, increment]);
        } catch (error) {
            throw new Error(`Error updating following count: ${error.message}`);
        }
    }
};

module.exports = userModel; 