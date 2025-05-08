const db = require('./index');

const uploadModel = {
  async getAll() {
    return db.any('SELECT * FROM uploads ORDER BY created_at DESC');
  },

  async getById(id) {
    return db.oneOrNone('SELECT * FROM uploads WHERE id = $1', [id]);
  },

  async create({ filename, user_id }) {
    return db.one(
      'INSERT INTO uploads (filename, user_id) VALUES ($1, $2) RETURNING *',
      [filename, user_id]
    );
  },
};

module.exports = uploadModel;