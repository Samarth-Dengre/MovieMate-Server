const mysql = require("mysql2/promise");
require("dotenv").config();
const bcrypt = require("bcrypt");
const getConnection = require("../utils/mysql");
const Mailjet = require("node-mailjet");

// This function is executed when the user signing up
module.exports.signin = async (req, res) => {
  try {
    const { userName, email, password, code } = req.body;

    // Create a connection to the database
    const connection = await getConnection();

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

    // verify the code sent to the user's email address
    const [rows2] = await connection.execute(
      `SELECT * FROM otp WHERE email='${email}' AND code='${code}';`
    );

    if (rows2.length === 0) {
      return res.json({
        status: 400,
        message: "Invalid code",
      });
    }

    // delete the code from the database
    const [rows3] = await connection.execute(
      `DELETE FROM otp WHERE email='${email}' AND code='${code}';`
    );

    const userid = Date.now().toString() + Math.random().toString(); // Generate a unique id for the user

    // hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const [rows] = await connection.execute(
      `INSERT INTO users (id, name, email, password, favorites) VALUES('${userid}','${userName}','${email}','${passwordHash}','[]');`
    );

    // close the connection
    await connection.end();

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
  try {
    const email = req.query.email;
    const password = req.query.password;

    // Create a connection to the database
    const connection = await getConnection();

    // Get the user from the database
    const [rows] = await connection.execute(
      `SELECT name,password,id,favorites FROM users WHERE email='${email}';`
    );

    // close the connection
    connection.end();

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
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Login failed",
    });
  }
};

// This function is executed when the user adds a movie to the favorites
module.exports.addFavorite = async (req, res) => {
  const movieId = req.body.movieId;
  const { email, name, password, id } = req.body.user;

  try {
    const connection = await getConnection();

    // Get the user from the database
    const [rows] = await connection.execute(
      `SELECT favorites,password FROM users WHERE id ='${id}' AND email='${email}' AND password='${password}';`
    );

    // Check if the user exists
    if (rows.length === 0) {
      // Close the connection
      await connection.end();

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

      // Close the connection
      await connection.end();

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

    // Close the connection
    await connection.end();

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

// This function is executed when the user deletes the account
module.exports.deleteAccount = async (req, res) => {
  try {
    const { name, email, password, id } = req.body;

    // Create a connection to the database
    const connection = await getConnection();

    // Delete the user from the database
    const [rows] = await connection.execute(
      `DELETE FROM users WHERE id='${id}' AND email='${email}' AND password='${password}' AND name='${name}';`
    );

    // Check if the user exists
    if (rows.affectedRows === 0) {
      return res.json({
        status: 400,
        message: "Invalid Request",
      });
    }

    // Close the connection
    await connection.end();

    // Send a response to the client
    return res.json({
      status: 200,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Invalid Request",
    });
  }
};

// This function is executed when the the user send a request to verify the email
module.exports.verifyEmail = async (req, res) => {
  try {
    const { email, userName } = req.body;

    // check if the email is already registered
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT email FROM users WHERE email='${email}';`
    );

    if (rows.length !== 0) {
      return res.json({
        status: 400,
        message: "Email already registered",
      });
    }

    // create connection to mail server
    const mailjet = await Mailjet.apiConnect(
      process.env.PUBLIC_KEY,
      process.env.SECRET_KEY
    );

    // create a random number of 6 digits
    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    const request = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "teamsocialify@gmail.com",
            Name: "MovieMate",
          },
          To: [
            {
              Email: email,
              Name: userName,
            },
          ],
          Subject: "Verify your email",
          TextPart: "Verify your email",
          HTMLPart: `<h3>Verify your email</h3><p>Enter the following code to verify your email: <b>${randomNumber}</b></p>`,
        },
      ],
    });

    // delete the previous code from the database if it exists
    const [rows1] = await connection.execute("DELETE FROM otp WHERE email=?", [
      email,
    ]);

    // add code and current DATETIME to the database to verify the email
    const [rows2] = await connection.execute(
      "INSERT INTO otp (email, code, timestamp) VALUES (?, ?, NOW());",
      [email, randomNumber]
    );

    // close the connection
    await connection.end();

    // Send a response to the client
    return res.json({
      status: 200,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Invalid Request",
    });
  }
};

// This function is executed to delete the old OTP;s from the database
module.exports.deleteOtp = async () => {
  try {
    // Create a connection to the database
    const connection = await getConnection();

    // Delete the old OTP's from the database
    const [rows] = await connection.execute(
      "DELETE FROM otp WHERE timestamp < NOW() - INTERVAL 1 HOUR;"
    );

    // Close the connection
    await connection.end();
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Invalid Request",
    });
  }
};
