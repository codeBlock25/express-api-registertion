const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Nexmo = require('nexmo');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const genNum = Math.floor(Math.random() * 90000) + 10000;
const nexmo = new Nexmo({
  apiKey: '395c23ac',
  apiSecret: '4FZTsU86zPaTwDzd',
});

const userType = require('../model/user');

router.post("/",async (request,responce)=>{
    var {
        firstName,
        lastName,
        email,
        phoneNum,
        verifiedByNum,
        password,
        isRemember,
        deviceType,
        policy
    } = request.body;
    var foundByEmail = await userType.findOne({email: email});
    var foundByNum = await userType.findOne({phoneNum: phoneNum});
    let hashedPassword = await bcrypt.hashSync(password, salt);
    let testAccount = await nodemailer.createTestAccount();
    let transporter = await nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });
    const from = 'Node App';
    const to = '2348075435636';
    const text = 'Thanks you using codebasetch';
    
    let newUser = new userType({
        firstName: firstName,
        lastName: lastName,
        email: email,
        phoneNum: phoneNum,
        verifiedByNum: verifiedByNum,
        password: hashedPassword,
        isRemember: isRemember,
        deviceType: deviceType,
        isVerified: false,
        vCode: genNum,
        policy: policy
    })
    if (!foundByEmail && !foundByNum) {
        newUser.save()
        .then(() => {
            responce.json({msg:"Registeration successful"}).status(200);
            var msg = {
                from: `"codebasetech 👻" <foo@example.com>`, // sender address
                to: email, // list of receivers
                subject: 'Hello ✔', // Subject line
                text: 'Hello world?', // plain text body
                html: `<b>Hello world? this is your validation code ${genNum}</b>` // html body
            }
            const from = 'Node App';
            const to = phoneNum;
            const text = `Thanks you using codebasetch validation code is ${genNum}`;
            if (!verifiedByNum) {
                transporter.sendMail(msg)
                .then((result)=>{
                    console.log(result);
                })
                .catch((err)=>{
                    console.log(err);
                })
            } else {
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
            responce.json(err).status(401)
        });
    } else {
        responce.json({msg:"This account is already part of the system"})
    }
});

router.get("/", async (request,responce)=>{
    const {email,code}=request.body;

    const account = await userType.findOne({email: email});
    const filter = { email: email };
    if(account.vCode!==code){
        responce.json({msg:"unaccessable"}).status(400)
    } else {
        await account.updateOne(filter, { isVerified: true });
        await account.save();
        responce.json("successful").status(200)
    }
})
module.exports = router;
