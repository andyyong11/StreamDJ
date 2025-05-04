const db = require('../config');

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
    }
};

module.exports = userModel; 