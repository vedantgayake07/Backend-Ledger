const mongoose = require("mongoose")
const dns = require("dns")

dns.setServers(['0.0.0.0' , '8.8.8.8'])

async function connectDB()
{
    try{
        await  mongoose.connect(process.env.MONGO_DB_URI)
        console.log("connected to DB")
    }
    catch(error)
    {
        console.log(error)
        process.exit(1) //telling the server to stop if db not connected
    }
}

module.exports = connectDB;