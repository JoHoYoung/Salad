const redis = require('redis')
const account = require("../config/account")

// Initialize Redis Client
const redisClient = redis.createClient({
    host: account.REDIS_HOST,
    port: account.REDIS_PORT
})

// Error Handling of Redis Client
redisClient.on("error", (err) => {
    console.log("Redis Error: " + err)
})

module.exports = redisClient
