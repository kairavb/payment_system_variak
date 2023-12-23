const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    uid: {
        type:String,
        required:[true,'User must be enter data']
    },
    email: {
        type:String,
        required:[true,'User must be enter data']
    },
    pass: {
        type:String,
        required:[true,'User must be enter data']
    },
    name: {
        type:String,
        required:[true,'User must be enter data']
    },
    mobile: {
        type:Number,
        required:[true,'User must be enter data']
    },
    date: {
        type:String,
        required:[true,'User must be enter data']
    }
});

const UserSignup = new mongoose.model('Signup',userSchema);
module.exports = UserSignup;