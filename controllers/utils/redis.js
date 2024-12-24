import { createClient } from 'redis';

export const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

await redisClient.connect().then(() => {
    console.log('Connected to Redis...');
});

// await redisClient.set('foo', 'bar');
// const result = await redisClient.get('foo');
// console.log(result)  // >>> bar

export async function getArr() {
    try {
      const arr = await redisClient.lRange('inlineAudioArr', 0, -1);
      const intArr = arr
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item));
    //   console.log(intArr);
      return intArr;
    } catch (error) {
      console.error("Error getting arr:", error);
      //returning a dummy array in case of error
      return [25, 26, 27, 28];
    }
  }