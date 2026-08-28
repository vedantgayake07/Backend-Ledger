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

module.exports = router;