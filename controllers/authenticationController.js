const mailjet = require("node-mailjet");
const mysql = require("mysql2/promise");
require("dotenv").config();
const bcrypt = require("bcrypt");

// This function is executed when the user signing up
module.exports.signin = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    const userid = Date.now().toString() + Math.random().toString(); // Generate a unique id for the user

    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      database: "moviemate",
      password: "samarth@sql",
    });

    // Check if the user already exists
    const [user] = await connection.execute(
      `SELECT * FROM users WHERE email='${email}';`
    );

    if (user.length > 0) {
      return res.json({
        status: 400,
        message: "This email is already registered",
      });
    }

    // hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const [rows] = await connection.execute(
      `INSERT INTO users (id, name, email, password, favorites) VALUES('${userid}','${userName}','${email}','${passwordHash}','[]');`
    );

    // Send a response to the client
    return res.json({
      status: 200,
      message: "User created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "User creation failed",
    });
  }
};

module.exports.login = async (req, res) => {
  const email = req.query.email;
  const password = req.query.password;

  // Create a connection to the database
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "moviemate",
    password: "samarth@sql",
  });

  // Get the user from the database
  const [rows] = await connection.execute(
    `SELECT name,password FROM users WHERE email='${email}';`
  );

  // Check if the user exists
  if (rows.length === 0) {
    return res.json({
      status: 400,
      message: "User does not exist",
    });
  }

  // Check if the password is correct
  const isPasswordCorrect = await bcrypt.compare(password, rows[0].password);

  if (!isPasswordCorrect) {
    return res.json({
      status: 400,
      message: "Incorrect password",
    });
  }

  // Send a response to the client
  return res.json({
    status: 200,
    message: "User logged in successfully",
    user: {
      name: rows[0].name,
      email,
      password,
    },
  });
};
