const router = require('express').Router();
const helpers = require('../../helper/helper')
const uuid = require('uuid')
const jwt = require('../../helper/jwtauth')
const crypto = require('crypto')
const db = require('../../helper/mysql')
const pool = db.pool
const promiseHandler = require('../../helper/promiseHandler')



// MARK: api/auth/token
router.post("/token", (req, res) => {
    let _accessToken = req.body.accessToken
    let _refreshToken = req.body.refreshToken
    console.log("accessToken: " + _accessToken + " | refreshToken: " + _refreshToken)

    if (_accessToken !== null && _refreshToken !== null && _accessToken !== undefined && _refreshToken !== undefined) {
        jwt.refresh(_accessToken, _refreshToken, (err, newAccessToken) => {
            console.log(err)
            if (err) {
                res.status(716).json({
                    statusCode: 716,
                    statusMsg: "Failed to get a new access token"
                })
            } else {
                res.json({
                    statusCode: 200,
                    statusMsg: "success",
                    data: {
                        accessToken: newAccessToken,
                        refreshToken: _refreshToken
                    }
                })
            }
        })
    } else { // No Body Tokens
        res.status(705).json({
            statusCode: 705,
            statusMsg: "A missing parameters"
        })
    }
})


//MARK : api/auth/signup
router.post('/signup', helpers.asyncWrapper(async (req,res) => {

    let username = req.body.name
    let password = req.body.password
    let useremail = req.body.email

    let conn = await pool.getConnection()

    let emailExistQ = "SELECT * FROM USER WHERE user_email = ?"
    let nameExistQ = "SELECT * FROM USER WHERE user_name = ?"

    let emailExist = (await conn.query(emailExistQ,[useremail]))[0][0]

    if(emailExist != null)
    {
        res.json({
            statusCode: 701,
            statusMsg:  "Email already Exist"
        })
        conn.release()
        return
    }

    let nameExist = (await conn.query(nameExistQ,[username]))[0][0]

    if(nameExist != null)
    {
        res.json({
            statusCode: 702,
            statusMsg : "Username already Exist"
        })
        conn.release()
        return
    }

    let obj = await promiseHandler.cryptoPassword(password)

    let salt = obj[0]
    let hashed_password = obj[1]

    let insertUserQ = "INSERT INTO USER(id, user_email, user_name, password,provider_type, salt, state, created_date, updated_date) " +
                        "VALUES(?, ?, ?, ?, ?, 'T', now(), now())"
    await conn.query(insertUserQ,[uuid.v4(),useremail,username,hashed_password,0,salt])

    res.json({
        statusCode: 200,
        statusMsg : "success"
    })
    conn.release()
    return
}))


//MARK : api/auth/signin
router.post('/signin', helpers.asyncWrapper(async (req,res) => {

    let conn = await pool.getConnection()

    if(req.body.provider_type == 0) {
        let useremail = req.body.email
        let password = req.body.password

        let userinfoQ = "SELECT * FROM USER WHERE user_email = ?"
        let userinfo = (await conn.query(userinfoQ, [useremail]))[0][0]

        if (userinfo == null) {
            res.json({
                statusCode: 703,
                statusMsg: "Invalid email"
            })
            conn.release()
            return
        }

        if (userinfo.password == await promiseHandler.getHashedPassword(password, userinfo.salt)) {
            jwt.generate(useremail, function (err, accesstoken, refreshtoken) {

                res.json({
                    statusCode: 200,
                    accesstoken: accesstoken,
                    refreshtoken: refreshtoken
                })
                conn.release()
                return
            })
        }
        else {
            res.json({
                statusCode: 709,
                statusMsg: "Invalid password"
            })
            conn.release()
            return
        }
    }else           // oauth
    {

        let provider_type = req.body.provider_type
        let key = req.body.key

        let existQ = "SELECT * FROM USER WHERE user_email = ?"
        let exist = (await conn.query(existQ,[key]))

        if(exist == null)
        {
            res.json({
                statusCode: 300,
                statusMsg: 'Nickname is required',
                data :{
                    key : key,
                    provider_type : provider_type
                }
            })
            conn.release()
            return
        }
        else
        {

            jwt.generate(key,function(err, accesstoken, refreshtoken){

                res.json({
                    statusCode:200,
                    accesstoken:accesstoken,
                    refreshtoken:refreshtoken
                })
                conn.release()
                return
            })
        }

    }
}))


//MARK: api/auth/firstoauth
router.post('/firstoauth', helpers.asyncWrapper(async (req,res) => {

    let conn = pool.getConnection()
    let key = req.body.key
    let provider_type = req.body.provider_type
    let user_name = req.body.user_name

    let insertQ = "INSERT INTO USER(id, user_email, user_name, state, provider_type, created_date, updated_date) "  +
                    "VALUES(?, ?, ?, ?, ?, now(), now())"
    await conn.query(insertQ,[uuid.v4(),key,user_name,'C',provider_type])
    jwt.generate(key, (err, accesstoken, refreshtoken) => {

        res.json({
            statusCode:200,
            statusMsg:'success',
            accesstoken : accesstoken,
            refreshtoken : refreshtoken
        })
        conn.release()
        return
    })


}))

module.exports=router