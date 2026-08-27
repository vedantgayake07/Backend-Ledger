const express = require("express")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes")

const app = express()

app.use(express.json()) // use to handle the req.body data
app.use(cookieParser())
app.use("/api/auth" , authRoutes) //all the request with endpoint /api/auth will be directed to authRoutes 

module.exports = app;