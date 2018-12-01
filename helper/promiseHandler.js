const crypto = require('crypto')

function cryptoPassword(password){

    return new Promise((resolve,reject) => {

        crypto.randomBytes(64, async (err, buf) => {

            crypto.pbkdf2(password, buf.toString('base64'), 100000, 64, 'sha512', (err, key) => {

                let obj = [buf.toString('base64'),key.toString('base64')]
                resolve(obj)
            });
        });
    })
}

function getHashedPassword(password, salt)
{
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {

            resolve(key.toString('base64'));
        });
    })

}

module.exports.cryptoPassword = cryptoPassword
module.exports.getHashedPassword = getHashedPassword