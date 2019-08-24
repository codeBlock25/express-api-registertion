// importing dependences
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Nexmo = require('nexmo');
const bcrypt = require('bcryptjs');

// setting rounds and salting for hashing script
const salt = bcrypt.genSaltSync(10);

// random number function to generate random number of 6 digits
const genNum = Math.floor(Math.random() * 90000) + 10000;

// setting nexmo options
const nexmo = new Nexmo({
  apiKey: process.env.NEXMOKEY,
  apiSecret: process.env.NEXMOSECRET,
});

// importing models
const userType = require('../model/user');

// post route for signup
router.post("/",async (request,responce)=>{
    // All this information must be provided when routing
    var {
        firstName,
        lastName,
        email,
        phoneNum,
        verifiedByNum,
        password,
        isRemember,
        policy
    } = request.body;

    // checking for olduser with given email
    var foundByEmail = await userType.findOne({email: email});

    // checking for olduser with given email
    var foundByNum = await userType.findOne({phoneNum: phoneNum});

    // hashing given password
    let hashedPassword = await bcrypt.hashSync(password, salt);

    // nodemailer: this is to create a test account for you
    let testAccount = await nodemailer.createTestAccount();

    // nodemailer: to connect via smtp 
    let transporter = await nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });
    // Email message
    var msg = {
        from: `"codebasetech 👻" <foo@example.com>`, // sender address
        to: email, // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: `<b>Hello world? this is your validation code ${genNum}</b>` // html body
    }
    // credentials for nexmo
    const from = 'Node App';
    const to = phoneNum;
    const text =  `Thanks you using codebasetch validation code is ${genNum}`;
    
    // creating new object instance to save user detail to database
    let newUser = new userType({
        firstName: firstName,
        lastName: lastName,
        email: email,
        phoneNum: phoneNum,
        verifiedByNum: verifiedByNum,
        password: hashedPassword,
        isRemember: isRemember,
        isVerified: false,
        vCode: genNum,
        policy: policy
    })
    // verifing if it's an old user by email and number so as to avoid dual account 
    if (!foundByEmail && !foundByNum) {
        // saving details
        newUser.save().then(() => {
            responce.json({msg:"Registeration successful"}).status(200);
            if (!verifiedByNum) {
                // sending validation Email to user if they choose to validate by Email
                transporter.sendMail(msg)
                .then((result)=>{
                    console.log(result);
                })
                .catch((err)=>{
                    console.log(err);
                })
            } else {
                // sending validation sms to user if they choose to validate by number
                nexmo.message.sendSms(from, to, text,(err,responceData)=>{ 
                    if (err) {
                    console.log(err);
                    } else {
                        if(responceData.messages[0]['status'] === "0") {
                            console.log("Message sent successfully.");
                        } else {
                            console.log(`Message failed with error: ${responceData.messages[0]['error-text']}`);
                        }
                    }
                });
            }
        }).catch((err) => {
            // error handler required by node
            responce.json(err).status(401)
        });
    } else {
        // if a user with given details was found on the system this will fire 
        responce.json({msg:"This account is already part of the system"})
    }
});

// account validation
router.get("/", async (request,responce)=>{
    // the email will be needed for this alone side the sent validation code check line 92 || 102 for details
    const {email,code}=request.body;
    // checking if a user has this email
    const account = await userType.findOne({email: email});
    // checking if the user is already verified
    if (!account) {
        responce.json({msg: "No account with this info"})
    } else if (account.isVerified == true) {
        responce.json({msg: "this account has already been verified"})
    }
    else {
        const filter = { email: email }; 
        // checking if given code is equal to stored code i.e vCode
        if(account.vCode!==code){
            responce.json({msg:"unaccessable"}).status(400)
        } else {
            // updating instance
            await account.updateOne(filter, { isVerified: true });
            // saving new record
            await account.save()
            .then(()=>{
                responce.json("successful").status(200)
            })
            .catch(()=>{
                responce.json("failure").status(401)
            })
        }
    }
})

// updating password
router.get("/forget", async (request,responce)=>{
    // this information mus be provided 
    const {userentry,deviceType,password}=request.body;

    // checking by Email
    var validateByEmail = await userType.findOne({email: userentry});
    // checking by PhoneNum
    var validateByNum = await userType.findOne({phoneNum: userentry});
    // generation random number of 6 digits
    let Num = Math.floor(Math.random() * 90000) + 10000;
    
    // Email message
    var _msg = {
        from: `"codebasetech 👻" <foo@example.com>`, // sender address
        to: email, // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: `<b>Hello world? this is your validation code ${Num}</b>` // html body
    };
    // sms message
    let text = `validation code ${Num}`;

    // to hold the account details when found
    var validAccDetails = [];
    // nodemailer this is to create a test account for you
    let testAccount = await nodemailer.createTestAccount();
    // nodemailer: to connect via smtp 
    let transporter = await nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });

    // checking if details provided is valid
    if (!validateByEmail || !validateByNum) {
        responce.json({msg: "Invalid user details"}).status(404)
    } else {
        // checking if login is made by Email
        if (validateByEmail) {
            // action when found by Phone Number
            transporter.sendMail(_msg)
            .then((result)=>{
                console.log(result);
            })
            .catch((err)=>{
                console.log(err);
            })
            validAccDetails.push(validateByEmail);
        } else {
            // action when found by Email
            nexmo.message.sendSms("your num", userentry, text,(err,responceData)=>{ 
                if (err) {
                console.log(err);
                } else {
                    if(responceData.messages[0]['status'] === "0") {
                        console.log("Message sent successfully.");
                    } else {
                        console.log(`Message failed with error: ${responceData.messages[0]['error-text']}`);
                    }
                }
            });
            validAccDetails.push(validateByNum);
        }
    }
    // checking if device type match
    if (!validAccDetails[0].deviceType.includes(deviceType)) {
        responce.json({msg: "You can only change you details from a verified device (a deive you have loged in before with)"})
    } else {
        // hashing password
        let hashedPassword = await bcrypt.hashSync(password, salt);
        // getting acount
        const account = await userType.findOne({email: validAccDetails[0].email});
        // filtering accounts
        const filter = { email: validAccDetails[0].email }; 
        // updating account with new info
        await account.updateOne(filter, { 
            password: hashedPassword,
            vCode: Num,
            isVerified: false 
        });
        // saving details
        await account.save()
        .then(()=>{
            responce.json({msg:"successful"}).status(200)
        }).catch(()=>{
            responce.json({msg: "failure to update account"}).status(404)
        })
    }
});
module.exports = router;
