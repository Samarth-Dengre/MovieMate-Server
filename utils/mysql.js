const mysql = require("mysql2/promise");

async function createConnection() {
  try {
    return await mysql.createConnection({
      host: "localhost",
      user: "root",
      database: "moviemate",
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = createConnection;
