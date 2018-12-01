const mysql2 = require("mysql2/promise")
const account = require("../config/account")

// Initialize MySQL DB
const pool = mysql2.createPool({
    host: account.MYSQL_HOST,
    user: account.MYSQL_USERID,
    password: account.MYSQL_PASSWORD,
    database: account.MYSQL_DATABASE,
    port: account.MYSQL_PORT,
    connectionLimit: account.MYSQL_CONNECTION_LIMIT
})

module.exports.pool = pool

