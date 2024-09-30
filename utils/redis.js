import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.on('error', (err) => {
        console.error(err.message);
    });
  }

  isAlive() {
    return !this.client.connected;
  }

  async get(key) {
    return new Promise((res, rej) => {
      this.client.get(key, (err, reply)=> {
          if (err) rej(err);
          res(reply);
        });
    });
  }

  async set(key, value, duration) {
    return new Promise((res, rej) => {
      this.client.set(key, value, 'EX', duration, (err, reply) => {
        if (err) rej(err);
        res(reply);
        });
    });
  }

  async del(key) {
    return new Promise((res) => {
      this.client.del(key);
      res();
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;