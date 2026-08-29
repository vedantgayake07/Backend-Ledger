const accountModel = require("../models/account.model")

async function createAccountController(req , res) {
    const user = req.user;

    const account = await accountModel.create({
        user : user._id 
    })

    res.status(201).json({
        message : "user created ",
        account
    })
}

async function getUserAccountsController(req , res) {
    
    try{
        const accounts = await accountModel.find({user: req.user._id})

    res.status(200).json({
        accounts
    })
    }

    catch(error)
    {
        console.log(error)
    }
}

async function getUserBalance(req , res) {
    try
    {
    const {accountId} = req.params;

    const account = await accountModel.findOne({
        _id : accountId ,
        user: req.user._id})

    if(!account)
    {
        return res.status(401).json({
            message : "account not found"
        })
    }

    const balance = await account.getBalance()

    res.status(200).json({
        accountId,
        balance
    })
    }
    catch(error)
    {
        console.log(error)
    }
}

module.exports = {createAccountController , getUserAccountsController , getUserBalance}