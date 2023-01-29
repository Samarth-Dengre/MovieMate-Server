const router = require("express").Router();
const moviesController = require("../controllers/moviesController");

router.get("/", moviesController.getMovies);
module.exports = router;
