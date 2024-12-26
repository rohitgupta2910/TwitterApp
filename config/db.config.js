const mongoose = require('mongoose')

function connectToDB(){
    mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log("Connected To Twitter DB");
    }).catch((err)=>{
        console.log(err)
    });
}

module.exports = connectToDB;