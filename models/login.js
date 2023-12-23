const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:[true,'User must be enter data']
    } ,
    pass:{
        type:String,
        required:[true,'User must be enter data']
    }
});

const UserLogin = new mongoose.model('Login',userSchema);
module.exports = UserLogin;