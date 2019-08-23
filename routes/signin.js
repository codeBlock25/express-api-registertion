const express = require('express');
const router = express.Router();

const userType = require('../model/user');
const SECRET = process.env.SECRET;

router.get("/",(request,responce)=>{
    const {
        userentry,
        password
    }=request.body;
    var validateByEmail = await userType.findOne({email: userentry});
    var validateByNum = await userType.findOne({phoneNum: userentry});
    var validAccDetails = [];
    if (validateByEmail && validateByNum) {
        responce.json({msg: "Invalid user details"}).status(404)
    } else {
        if (!validateByEmail) {
            validAccDetails.push(validateByEmail);
        } else {
            validAccDetails.push(validateByNum);
        }
    }
    var validPasscode = bcrypt.compareSync(password, validAccDetails[0].password);
    if (!validPasscode) {
        responce.json({msg: "Invalid user details"}).status(404)
    } else {
        try{
            const token = jwt.sign({
                User_ID: validAccDetails[0]._id,
                UserName: validAccDetails[0].fullName
            }, SECRET ,{expiresIn: '30 days'});
                res.json({token: token}).status(200);
            } catch (e) {
                res.json(e).status(401);
                console.log(e);
        } 
    }
})
module.exports = router;
