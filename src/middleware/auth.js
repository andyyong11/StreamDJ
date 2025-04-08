const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

// Middleware to check if user has access to the resource
const checkResourceAccess = (resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const resourceId = req.params.id;

            switch (resourceType) {
                case 'playlist':
                    const playlist = await req.app.locals.db.one(
                        'SELECT user_id FROM playlists WHERE id = $1',
                        [resourceId]
                    );
                    if (playlist.user_id !== userId) {
                        throw new Error('Not authorized to access this playlist');
                    }
                    break;
                    
                // Add more resource types as needed
                default:
                    throw new Error('Invalid resource type');
            }
            next();
        } catch (error) {
            res.status(403).json({ error: error.message || 'Access denied' });
        }
    };
};

module.exports = { auth, checkResourceAccess }; 