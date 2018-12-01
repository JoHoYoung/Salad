var nodemailer = require('nodemailer');
const router = require("express").Router();
const account = require("../config/account");
var smtpPassword = require('aws-smtp-credentials');


var smtpTransporter = nodemailer.createTransport({
    port: 465,
    host: 'email-smtp.us-west-2.amazonaws.com',
    secure: true,
    auth: {
        user: account.AMAZON_SES_ACCESS_KEY_ID,
        pass: smtpPassword(account.AMAZON_SES_SECRET_ACCESS_KEY),
    },
    debug: true
});

function sendMailTo(user){

    let mailOptions = {
        from: 'audrey.knox@spryfit.app',
        to: user,
        subject: '테스트',
        html: '<p>테스트</p>',
    };

    smtpTransporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

}

module.exports.sendMailTo=sendMailTo;
