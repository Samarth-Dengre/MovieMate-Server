const router = require("express").Router();
router.use("/auth", require("./authRoutes"));
router.use("/movies", require("./moviesRoutes"));
module.exports = router;
