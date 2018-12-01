const nodemailer = require('nodemailer')
const account = require('../config/account')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: account.GMAIL_HOST,
        pass: account.GMAIL_PASSWORD
    }
})

function sendMailTo(subject,email,body)
{
    let mailOptions = {
        from: 'whghdud17@gmail.com',
        to: email,
        subject: subject,
        html:body
    }

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    })
}

module.exports.sendMailTo = sendMailTo