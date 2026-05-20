const mysql = require("mysql2");
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const dbUser = process.env.DB_USER || process.env.MYSQL_USER || "root";
const isRootUser = dbUser.toLowerCase() === "root";

const connection = mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
    user: dbUser,
    password: isRootUser
        ? (process.env.DB_ROOT_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "")
        : (process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_ROOT_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || ""),
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "project",
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306)
});

connection.connect((err) => {
    if (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
    console.log("✅ Connected to MySQL Database");
});

module.exports = connection;
