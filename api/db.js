const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'devinquire',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true // matches the PHP PDO style named parameters, e.g. :id or :status
});

module.exports = pool;
