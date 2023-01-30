const router = require("express").Router();
const moviesController = require("../controllers/moviesController");

router.get("/", moviesController.getMovies);
router.get("/:id", moviesController.getMovie);
module.exports = router;
