const mysql = require("mysql2/promise");
const getConnection = require("../utils/mysql");
require("dotenv").config();

// This array contains all the genres of movies
const genres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Sci-Fi",
  "Fantasy",
];

// This function will fetch all the movies from the database and return them as a JSON response
module.exports.getMovies = async (req, res) => {
  try {
    // connect to the database
    const connection = await getConnection();

    // fetch all the movies from the database
    const [rows] = await connection.execute(
      "SELECT id,movieName,image,imdb,genre,actors,length FROM movies;"
    );

    // close the connection
    await connection.end();

    // If no movies are found, return a 400 status code and a message
    if (rows.length === 0) {
      return res.json({
        status: 400,
        message: "Movies not found",
      });
    }

    // If movies are found, return a 200 status code and a message along with the movies
    return res.json({
      status: 200,
      message: "Movies fetched successfully",
      movies: rows,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Movies not found",
    });
  }
};

// This function will fetch a single movie which is requested by the user from the database and return it as a JSON response
module.exports.getMovie = async (req, res) => {
  try {
    // connect to the database
    const connection = await getConnection();

    const id = req.params.id;

    // If the id is not a number, then it is a genre
    if (isNaN(id)) {
      // If the genre is not present in the genres array, then return a 400 status code and a message
      if (genres.includes(id)) {
        const [rows] = await connection.execute(
          `SELECT movies.id,movies.movieName,movies.image,movies.imdb,movies.genre,movies.actors,movies.length FROM ${
            id === "Sci-Fi" ? "scifi" : id.toLowerCase()
          } JOIN movies on ${
            id === "Sci-Fi" ? "scifi" : id.toLowerCase()
          }.id = movies.id;`
        );

        // close the connection
        await connection.end();

        if (rows.length === 0) {
          return res.json({
            status: 400,
            message: "Movies not found",
          });
        }

        return res.json({
          status: 200,
          message: "Movies fetched successfully",
          movies: rows,
        });
      }
    } else {
      // If the id is a number, then it is a movie id
      const [rows] = await connection.execute(
        "SELECT id,movieName,image,imdb,genre,actors,length,description,language,year,link FROM movies WHERE id = ?;",
        [id]
      );

      // close the connection
      await connection.end();

      // If the movie is not found, then return a 400 status code and a message
      if (rows.length === 0) {
        return res.json({
          status: 400,
          message: "Movie not found",
        });
      }

      // If the movie is found, then return a 200 status code and a message along with the movie
      return res.json({
        status: 200,
        message: "Movie fetched successfully",
        movie: rows[0],
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Movie not found",
    });
  }
};

// This function is executed when user fetches their favorites
module.exports.getFavoriteMovies = async (req, res) => {
  try {
    // connect to the database
    const connection = await getConnection();

    const ids = req.body.ids;

    // If the ids array is not empty, then return a 200 status code and a message along with the movies
    const [rows] = await connection.execute(
      `SELECT id,movieName,image,imdb,genre,actors,length FROM movies WHERE id IN (${ids});`
    );

    // close the connection
    connection.end();

    return res.json({
      status: 200,
      message: "Movies fetched successfully",
      movies: rows,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 400,
      message: "Internal server error",
    });
  }
};
