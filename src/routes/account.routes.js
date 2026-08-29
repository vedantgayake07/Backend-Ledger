const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const AccountController = require("../controllers/account.controller")


const router = express.Router()

/**
 * - Post /api/accounts/
 * - Create a new Account
 * - Protected Route
 */
router.post("/",authMiddleware.authMiddleware , AccountController.createAccountController)

/**
 * -Get /api/accounts/
 */
router.get("/",authMiddleware.authMiddleware , AccountController.getUserAccountsController)

/**
 * - Get /api/account/balance
 */
router.get("/balance/:accountId",authMiddleware.authMiddleware , AccountController.getUserBalance)
module.exports = router;