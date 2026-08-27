const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")

/** 
* - user register controller
* - post /api/auth/register
*/
const userRegisterController = async (req, res) => {
    const { email, name, password } = req.body;

    const isExist = await userModel.findOne({
        email: email
    })

    if (isExist) {
        return res.status(422).json({
            message: "user already exist with email",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email, password, name
    })


    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}

/**
 * - user login controller 
 * - post /api/auth/login
 */
const userLoginController = async (req, res) => {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            message: "email or password is invalid"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "email or password is invalid"
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}

module.exports = { userRegisterController, userLoginController };