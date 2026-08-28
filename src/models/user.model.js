const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "email is required"],
            trim: true,
            lowercase: true,
            match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "email not valid"],
            unique: [true, "email must be unique"]
        },

        name: {
            type: String,
            required: [true, "name is required"]
        },

        password: {
            type: String,
            required: [true, "password is required for creating acc"],
            minlength: [8, "password should be more than 8 chars long"],
            select: false //while accessing user data password will not be provided
        },

        systemUser : {
            type : Boolean,
            default : false ,//have to set true from db (mongodb)
            immutable : true ,
            select : false
        }
    }, {
    timestamps: true // so when was user created and updated will be stored
})

userSchema.pre("save" , async function () //so we are telling mongoose before saving a user run this function
    {// 'this' referes to the current user being saved in the db
    if(!this.isModified("password")) //its preventing hashing already hashed password
    {
        return; 
    }

    const hash = await bcrypt.hash(this.password,10)
    this.password = hash;

    return;
})

userSchema.methods.comparePassword = async function (password) //method is created for every user document
{
    return await bcrypt.compare(password , this.password)
}

const userModel = mongoose.model("user" , userSchema)

module.exports = userModel