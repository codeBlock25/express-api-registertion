const mongoose = require('mongoose');
const schema = mongoose.Schema;

var userSchema = new schema({
    firstName:{
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNum: {
        type: String,
        required: true
    },
    verifiedByNum: {
        type: Boolean,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isRemember: {
        type: Boolean
    },
    deviceType: {
        type: String
    },
    isVerified: {
        type: Boolean
    },
    policy:{
        type: Boolean,
        required: true
    },
    vCode:{
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

module.exports =  mongoose.model('user', userSchema)
