const router = require("express").Router();
const authentcationController = require("../controllers/authenticationController");
router.post("/", authentcationController.signin);
router.get("/", authentcationController.login);
module.exports = router;
