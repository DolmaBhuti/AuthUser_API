const redis = require("redis");

//initialize a client at the very beginning of this file
const client = redis.createClient({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

client.on("connect", () => {
  console.log(
    `Connected to Redis on ${process.env.REDIS_HOSTNAME}:${process.env.REDIS_PORT}`
  );
});

client.on("ready", () => {
  console.log("Client connected to Redis and ready to use...");
});

client.on("error", (err) => {
  console.log("Error connecting", err.message);
});

client.on("end", () => {
  console.log("Client disconnected from redis");
});

//you want to stop redis when you press ctrl+c on your process
process.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
