const router = require("express").Router();
const authentcationController = require("../controllers/authenticationController");
router.post("/", authentcationController.signin);
router.get("/", authentcationController.login);
router.patch("/", authentcationController.addFavorite);
router.put("/", authentcationController.deleteAccount);
router.post('/verifymail', authentcationController.verifyEmail);
router.get('/verifymail', authentcationController.deleteOtp);
module.exports = router;
