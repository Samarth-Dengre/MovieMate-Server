const router = require("express").Router();
const moviesController = require("../controllers/moviesController");

router.get("/", moviesController.getMovies);
router.get("/:id", moviesController.getMovie);
router.post("/", moviesController.getFavoriteMovies);
module.exports = router;
