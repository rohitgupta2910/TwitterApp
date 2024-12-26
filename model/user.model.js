const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:String,
    tweets:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:'tweet'  //kiski ObjectId aayegi
    }]
})

const userModel = mongoose.model("userModel",userSchema)
module.exports = userModel;