const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const router = express.Router();

router.post("/",authMiddleware.authMiddleware , transactionController.transactionController)

router.post("/system/initialfunds",authMiddleware.authSystemUserMiddleware ,transactionController.createInitialFunds)

module.exports=router;