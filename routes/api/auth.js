const router = require('express').Router();
const helpers = require('../../helper/helper')
const uuid = require('uuid')
const jwt = require('../../helper/jwtauth')
const crypto = require('crypto')
const db = require('../../helper/mysql')
const pool = db.pool
const promiseHandler = require('../../helper/promiseHandler')
/**
 * @swagger
 * tags:
 *   name: auth
 *   description: 유저 인증 관련 API 입니다
 * definitions:
 *   Todo:
 *     type: object
 *     required:
 *       - content
 *     properties:
 *       _id:
 *         type: string
 *         description: ObjectID
 *       content:
 *         type: string
 *         description: 할일 내용
 *       done:
 *         type: boolean
 *         description: 완료 여부
 */

/**
 * @swagger
 * /token:
 *   post:
 *     summary: 유저의 만료된 토큰을 갱신하여 리턴합니다.
 *     tags: [auth]
 *     parameters:
 *      - name: accessToken
 *        in: body
 *        description: 해당 유저의 만료된 accessToken
 *        type: array
 *        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0aWQiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *      - name: refreshToken
 *        in: body
 *        description: 해당 유저의 refreshToken
 *        type: array
 *        example: "eyasdf123qqwdadssnR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0aWQiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *     responses:
 *       200:
 *         description: 해당 유저의 토큰을 갱신하여 리턴합니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *           data:
 *              type: object
 *              properties:
 *                  accessToken :
 *                      type : string
 *                      example : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0aWQiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *                  refreshToken :
 *                      type : string
 *                      example : "wqerqr3143424312234123412344321321324CJ9.eyJ1213412344132QiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *       705:
 *          description: request의 바디에 인자가 없을경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 705
 *            statusMsg:
 *              type: array
 *              example: "A missing parameter"
 *       716:
 *         description: 토큰이 잘못됐을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 *       719:
 *         description: 토큰이 없을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 */


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

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: 회원가입 을 처리합니다.
 *     tags: [auth]
 *     parameters:
 *      - name: email
 *        in: body
 *        description: 유저가 로그인할때 사용할 이메일값을 받습니다.
 *        type: array
 *        example: "whghdud17@gmail.com"
 *      - name: name
 *        in: body
 *        description: 유저의 닉네임값을 받습니다.
 *        type: array
 *        example: "닉네임짓는중"
 *      - name: password
 *        in: body
 *        description: 유저가 로그인할 패스워드를 받습니다.
 *        type: array
 *        example: "123128awsd!"
 *     responses:
 *       200:
 *         description: 회원가입에 성공
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       701:
 *          description: 중복된 이메일이 존재할 경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 701
 *            statusMsg:
 *              type: array
 *              example: "Email already exist"
 *       705:
 *          description: 중복된 닉네임이 존재할 경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 702
 *            statusMsg:
 *              type: array
 *              example: "Username already Exist"
 *       716:
 *         description: 토큰이 잘못됐을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 *       719:
 *         description: 토큰이 없을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 */

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
                        "VALUES(?, ?, ?, ?, ?, ?, 'T', now(), now())"
    await conn.query(insertUserQ,[uuid.v4(),useremail,username,hashed_password,0,salt])

    res.json({
        statusCode: 200,
        statusMsg : "success"
    })
    conn.release()
    return
}))


/**
 * @swagger
 * /signin:
 *   post:
 *     summary: 로그인및 Oauth로그인을 처리합니다.
 *     tags: [auth]
 *     parameters:
 *      - name: email
 *        in: body
 *        description: 유저가 로그인할때 사용할 이메일값을 받습니다. Oauth일 경우 key를 넣어보냅니다.
 *        type: array
 *        example: "whghdud17@gmail.com"
 *      - name: password
 *        in: body
 *        description: 유저의 비밀번호 값을 받습니다. Oauth일 경우 해당필드는 비워둡니다.
 *        type: array
 *        example: "비밀번호 "
 *      - name: provider_type
 *        in: body
 *        description: 유저가 Oauth인지 자체 로그인인지 판별하여 보냅니다.
 *        type: array
 *        example: "자체 로그인일 경우 - { provider_type : 0 }, kakao : 1, facebook : 2"
 *     responses:
 *       200:
 *         description: 토큰을 반납합니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *           data:
 *              type: object
 *              properties:
 *                  accessToken :
 *                      type : string
 *                      example : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0aWQiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *                  refreshToken :
 *                      type : string
 *                      example : "wqerqr3143424312234123412344321321324CJ9.eyJ1213412344132QiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *       300:
 *         description: 해당유저가 이메일을 등록하지 않은 oauth 유저일경우 300코드를 리턴합니다..
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 300
 *           statusMsg:
 *              type : string
 *              example : "Nickname is required"
 *           data:
 *              properties:
 *               key:
 *                type: array
 *                example: "10002131200"
 *               provider_type:
 *                type: integer
 *                example: 1
 *       703:
 *          description: 이메일이 존재하지 않을경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 703
 *            statusMsg:
 *              type: array
 *              example: "Invalid email"
 *       704:
 *          description: 비밀번호가 틀렸을 경우 에러와 받은 키를 리턴합니다
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 704
 *            statusMsg:
 *              type: array
 *              example: "Invalid password"
 *       716:
 *         description: 토큰이 잘못됐을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 *       719:
 *         description: 토큰이 없을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 */
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
            jwt.generate(userinfo.id, function (err, accesstoken, refreshtoken) {

                res.json({
                    statusCode: 200,
                    statusMsg: "success",
                    accesstoken: accesstoken,
                    refreshtoken: refreshtoken
                })
                conn.release()
                return
            })
        }
        else {
            res.json({
                statusCode: 704,
                statusMsg: "Invalid password"
            })
            conn.release()
            return
        }
    }else           // oauth
    {

        let provider_type = req.body.provider_type
        let key = req.body.key

        let existQ = "SELECT * FROM USER WHERE id = ?"
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

/**
 * @swagger
 * /firstoauth:
 *   post:
 *     summary: Oauth 로그인을 시도한 후 300코드를 받은 유저의 회원등록을 처리합니다.
 *     tags: [auth]
 *     parameters:
 *      - name: key
 *        in: body
 *        description: 300 코드와 함께 받은 Oauth키를 보냅니다.
 *        type: array
 *        example: "100041324321004132"
 *      - name: provider_type
 *        in: body
 *        description: 300 코드와 함께 받은 provider_type 을 보냅니다.
 *        type: integer
 *        example: 1
 *      - name: user_name
 *        in: body
 *        description: 유저가 사용하기로 한 닉네임을 보냅니다.
 *        type: array
 *        example: "호영짱"
 *     responses:
 *       200:
 *         description: 정상적으로 db에 저장 후 토큰값을 줍니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *           data:
 *              type: object
 *              properties:
 *                  accessToken :
 *                      type : string
 *                      example : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0aWQiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *                  refreshToken :
 *                      type : string
 *                      example : "wqerqr3143424312234123412344321321324CJ9.eyJ1213412344132QiLCJleHAiOjE1NDM4MjYwNzIsImlhdCI6MTU0MzczOTY3Mn0.82zH2AdRxUfnFjWC1WZtqpO-Gx3iov-CCRUsTEMcu-Q"
 *       702:
 *          description: 닉네임이 이미 존재할경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 702
 *            statusMsg:
 *              type: array
 *              example: "Username already Exist"
 *       716:
 *         description: 토큰이 잘못됐을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 *       719:
 *         description: 토큰이 없을 경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 716
 *           statusMsg:
 *             type: array
 *             example: "Invalid Token"
 */
//MARK: api/auth/firstoauth
router.post('/firstoauth', helpers.asyncWrapper(async (req,res) => {

    let conn = await pool.getConnection()
    let key = req.body.key
    let provider_type = req.body.provider_type
    let user_name = req.body.user_name


    let exist = (await conn.query("SELECT * FROM USER WHERE user_name = '" + user_name + "'"))[0][0]
    if(exist != null)
    {
        res.json({
            statusCode:702,
            statusMsg:'Username already Exist',
        })
        conn.release()
        return
    }

    let insertQ = "INSERT INTO USER(id, user_name, state, provider_type, created_date, updated_date) "  +
                    "VALUES( ?, ?, ?, ?, now(), now())"
    await conn.query(insertQ,[key,user_name,'C',provider_type])

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

/**
 * @swagger
 * /checkname:
 *   post:
 *     summary: 닉네임 중복체크를 합니다.
 *     tags: [auth]
 *     parameters:
 *      - name: user_name
 *        in: body
 *        description: 닉네임 값을 받습니다.
 *        type: array
 *        example: "호영짱"
 *     responses:
 *       200:
 *         description: 중복되지 않는 닉네임일 경우 200을 반납합니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       702:
 *         description: 중복된 경우 702를 반납합니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 702
 *           statusMsg:
 *              type : string
 *              example : "Username already Exist"
 */

//MARK : api/auth/checkname
router.post('/checkname', helpers.asyncWrapper(async (req,res) => {

    let user_name = req.body.user_name

    let existQ = "SELECT * FROM USER WHERE user_name =?"
    let exist = (await conn.query(existQ,[user_name]))[0][0]

    if(exist != null)
    {
        res.json({
            statusCode : 702,
            statusMsg : "Username already Exist"
        })
        conn.release()
        return
    }
    else{
        res.json({
            statusCode : 200,
            statusMsg : "success"
        })
        conn.release()
        return
    }

}))


/**
 * @swagger
 * /checkemail:
 *   post:
 *     summary: 이메일 중복체크를 합니다.
 *     tags: [auth]
 *     parameters:
 *      - name: email
 *        in: body
 *        description: 이메일 값을 받습니다.
 *        type: array
 *        example: "whghdud17@gmail.com"
 *     responses:
 *       200:
 *         description: 중복되지 않는 이메일일 경우 200을 반납합니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       701:
 *         description: 중복된 경우 701을 반납합니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 701
 *           statusMsg:
 *              type : string
 *              example : "Email already Exist"
 */
//MARK : api/auth/checkemail
router.post('/checkemail', helpers.asyncWrapper(async (req,res) => {

    let email = req.body.email

    let existQ = "SELECT * FROM USER WHERE user_email =?"
    let exist = (await conn.query(existQ,[email]))[0][0]

    if(exist != null)
    {
        res.json({
            statusCode : 701,
            statusMsg : "Email already Exist"
        })
        conn.release()
        return
    }
    else{
        res.json({
            statusCode : 200,
            statusMsg : "success"
        })
        conn.release()
        return
    }

}))

module.exports=router