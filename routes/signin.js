// importing dependences
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// importing models
const userType = require('../model/user');

// stating access secret
const SECRET = process.env.SECRET || "myawesomebigsectret";

router.get("/", async (request,responce)=>{
    // this must be porvided
    const {
        // either phone number or email
        userentry,
        password,
        deviceType
    }=request.body;

    // checking if porvided info is an valid Email
    var validateByEmail = await userType.findOne({email: userentry});
    // checking if porvided info is an valid Phone Number
    var validateByNum = await userType.findOne({phoneNum: userentry});
    // empty array to store account detials
    var validAccDetails = [];


    // checking if accound was found by either email or phone number
    if (!validateByEmail || !validateByNum) {
        // reponse both return null
        responce.json({msg: "Invalid user details"}).status(404)
    } else {
        // checking if it's an Email or Phone Number
        if (validateByEmail) {
            // updating array to with deatials fonud with Email if account was found my email
            validAccDetails.push(validateByEmail);
        } else {
            // updating array to with deatials fonud with Phone Number if account was found my phone number
            validAccDetails.push(validateByNum);
        }
    }
    // checking if hashed password matches given password
    var validPasscode = await bcrypt.compareSync(password, validAccDetails[0].password);
    if (!validPasscode) {
        // responce if password don't match
        responce.json({msg: "Invalid user details"}).status(404)
    } else {
        try{
            userType.findByIdAndUpdate(validAccDetails[0]._id,
                {$PUSH:{deviceType: deviceType}},
                {safe: true,upsert:true},
                function (err,res) {
                    if (err) {
                        console.log(err)
                    } else{
                        // do stuff
                    }
                }).then(()=>{
            // generating token
                    const token = jwt.sign({
                        User_ID: validAccDetails[0]._id,
                        UserName: validAccDetails[0].email
                    }, SECRET ,{expiresIn: '30 days'});
                    // sending token to front end
                    await responce.json({token: token}).status(200);
                    
                }).catch((err)=>console.log(err))
            } catch (e) {
                // if error
                responce.json(e).status(401);
                console.log(e);
        }
    }
});

module.exports = router;
