const mysql = require("mysql2/promise");

const getConnection = async () => {
  const connection = await mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  return connection;
};

module.exports = getConnection;
