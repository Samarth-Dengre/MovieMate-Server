const mysql = require("mysql2/promise");

module.exports.getMovies = async (req, res) => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "moviemate",
    password: "samarth@sql",
  });

  const [rows] = await connection.execute(
    "SELECT id,movieName,image,imdb,genre,cast,length FROM movies;"
  );
  return res.json({
    status: 200,
    message: "Movies fetched successfully",
    movies: rows,
  });
};
