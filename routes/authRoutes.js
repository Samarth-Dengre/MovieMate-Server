const router = require("express").Router();
const authentcationController = require("../controllers/authenticationController");
router.post("/", authentcationController.signin);
router.get("/", authentcationController.login);
router.patch("/", authentcationController.addFavorite);
module.exports = router;
