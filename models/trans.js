const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    transid: {
        type:String
    },
    suid: {
        type:String
    },
    ruid: {
        type:String,
        required:[true,'User must be enter data']
    },
    amount: {
        type:Number,
        required:[true,'User must be enter data']
    },
    date: {
        type:String,
        required:[true,'User must be enter data']
    },
    status: {
        type:String
    }
});

//cardnumber, cvv, exp, reqamount

const UserTrans = new mongoose.model('Trans',userSchema);
module.exports = UserTrans;