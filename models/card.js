const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    uid: {
        type:String,
        required:[true,'User must be enter data']
    },
    cardnumber: {
        type:Number,
        required:[true,'User must be enter data']
    },
    cvv: {
        type:Number,
        required:[true,'User must be enter data']
    },
    exp: {
        type:Number,
        required:[true,'User must be enter data']
    },
    bal: {
        type:Number,
        required:[true,'User must be enter data']
    },
});

const UserCard = new mongoose.model('Card',userSchema);
module.exports = UserCard;