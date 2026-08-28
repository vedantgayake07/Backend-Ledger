const express = require("express")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes")
const accountRoutes = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")

const app = express()

app.use(express.json()) // use to handle the req.body data
app.use(cookieParser())
app.use("/api/auth" , authRoutes) //all the request with endpoint /api/auth will be directed to authRoutes 
app.use("/api/accounts" , accountRoutes)
app.use("/api/transactions" , transactionRoutes)

module.exports = app;