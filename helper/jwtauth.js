const jwt = require("jsonwebtoken")
const account = require("../config/account")
const moment = require('moment')

module.exports.generate = function(userId, cb) {

    let _accessToken
    let _refreshToken
    // Generate an access token
    jwt.sign({
        userId: userId,
        exp: Math.floor(moment().add(1, "d") / 1000) // 1 day expiration - add(1, "d")
    }, account.JWT_SECRET, (err, token) => {
        if (err) { // Failed to generate an access token
            cb(err, null, null)
        } else { // Success to create an access token
            _accessToken = token
            // Generate a refresh token
            jwt.sign({
                userId: userId,
                exp: Math.floor(moment().add(5, "y") / 1000)
            }, account.JWT_SECRET, (err, token) => {
                if (err) {  // Failed to generate a refresh token
                    cb(err, null, null)
                } else {
                    _refreshToken = token
                    cb(err, _accessToken, _refreshToken)
                }
            })
        }
    })
}

module.exports.verify = function(token, cb) {

    console.log("ㅅㅟ벌")
    jwt.verify(token, account.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Failed to verify the token: " + err)
            cb(err, null)
        } else {
            console.log("decoded: " + decoded)
            cb(null, decoded)
        }
    })
}

module.exports.refresh = function(accessToken, refreshToken, cb) {

    jwt.verify(accessToken, account.JWT_SECRET, (err, decoded) => { // Verify  Access Token
        if (err) {
            console.log("ERROR: " + err)
            if (err.name == "TokenExpiredError") { // Token Expired
                console.log("Token expired")
                jwt.verify(refreshToken, account.JWT_SECRET, (err, decoded) => { // Verify Refresh Token
                    console.log("refreshToken decoded userId: " + decoded.userId)
                    if (err) { // Refresh Token is not valid
                        console.log("error: " + error)
                        cb(err, null)
                    } else { // Refresh Token is valid, Generate a new access Token
                        let expiration = Math.floor(moment().add(1, "d") / 1000) // 1 day expiration
                        console.log("expiration: " + expiration)
                        let payload = {
                            userId: decoded.userId,
                            exp: expiration
                        }

                        jwt.sign( payload, account.JWT_SECRET, (err, token) => {
                            if (err) { // Failed to generate a new access token
                                cb(err, null)
                            } else {
                                console.log("Token Refreshed")
                                cb(null, token)
                            }
                        })
                    }
                })
            } else { // Other error on the access token verification
                console.log("No Error")
                cb(err, null)
            }
        } else { // Access Token is valid
            // console.log("decoded: " + decoded)
            cb(null, accessToken)
        }
    })
}
