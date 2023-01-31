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
      user: {
        name: userName,
        email,
        id: userid,
        password: passwordHash,
        favorites: [],
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "User creation failed",
    });
  }
};

// This function is executed when the user logs in
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
    `SELECT name,password,id,favorites FROM users WHERE email='${email}';`
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
      id: rows[0].id,
      name: rows[0].name,
      email,
      password: rows[0].password,
      favorites: rows[0].favorites,
    },
  });
};

// This function is executed when the user adds a movie to the favorites
module.exports.addFavorite = async (req, res) => {
  const movieId = req.body.movieId;
  const { email, name, password, id } = req.body.user;

  try {
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      database: "moviemate",
      password: "samarth@sql",
    });

    // Get the user from the database
    const [rows] = await connection.execute(
      `SELECT favorites,password FROM users WHERE id ='${id}' AND email='${email}' AND password='${password}';`
    );

    // Check if the user exists
    if (rows.length === 0) {
      return res.json({
        status: 400,
        message: "Invalid Request",
      });
    }

    // Check if the movie is already in the favorites
    const favorites = rows[0].favorites;
    if (favorites.includes(movieId)) {
      // Remove the movie from the database
      const [rows1] = await connection.execute(
        `UPDATE users SET favorites='${JSON.stringify(
          favorites.filter((movie) => movie !== movieId)
        )}' WHERE id='${id}';`
      );

      // Remove the movie from the favorites
      return res.json({
        status: 200,
        message: "Movie Removed from favorites",
        user: {
          id,
          name,
          email,
          password: rows[0].password,
          favorites: favorites.filter((movie) => movie !== movieId),
        },
      });
    }

    // Add the movie to the favorites
    favorites.push(movieId);

    // Update the user in the database
    const [rows2] = await connection.execute(
      `UPDATE users SET favorites='${JSON.stringify(
        favorites
      )}' WHERE id='${id}';`
    );

    // Send a response to the client
    return res.json({
      status: 200,
      message: "Movie added to favorites",
      user: {
        id,
        name,
        email,
        password,
        favorites,
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Invalid Request",
    });
  }
};
