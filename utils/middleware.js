const { ObjectId } = require('mongodb');
const dbClient = require('./db');
const redisClient = require('./redis');

class MiddleWare {
  static async userAuth(req, res, next) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client
      .collection('users')
      .findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.userId = userId;
    req.user = user;

    return next();
  }
}

module.exports = MiddleWare;
