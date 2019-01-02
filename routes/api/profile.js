const router = require('express').Router();
const helpers = require('../../helper/helper')
const uuid = require('uuid')
const db = require('../../helper/mysql')
const promiseHandler = require('../../helper/promiseHandler')
const S3 = require('../../helper/awsS3')

/**
 * @swagger
 * tags:
 *   name: profile
 *   description: 유저 프로필 관련 API 입니다
 */

/**
 * @swagger
 * /profileupload:
 *   post:
 *     summary: 유저의 프로필 사진을 업로드 혹은, 수정합니다. 사진을 업로드 수정, 할때 모두 이 API를 호출합니다.
 *     tags: [profile]
 *     parameters:
 *      - name: Authorization
 *        in: header
 *        description: 유저의 Access토큰을 헤더에 실어 보냅니다. ex) "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMzYzMmZhZC1iZmE2LTRhN2ItYjg0Ni00NGQ1Yjk5ZmFhMjUiLCJleHAiOjE1NDQwMTUwMzQsImlh6WhY"
 *        type: array
 *      - name: image
 *        in: mulipart
 *        description: 유저의 사진을 multipart로 실어 보냅니다.
 *        type: array
 *     responses:
 *       200:
 *         description: 유저의 프로필사진 업로드에 성공시 200을 리턴합니다.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
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
 *
 */

let Single = S3.uploadSingle
router.post('/profileupload',Single,helpers.asyncWrapper(async (req, res)=>{

    let userId
    if (!req.user) { // No req.user
        res.json({
            statusCode: 719,
            statusMsg:  "No Access Token"
        })
        return null
    } else {
        userId = req.user.userId || null
    }

    let conn = await db.connection()

    let profileQ = "SELECT * FROM PROFILE WHERE user_id = ?"
    let profile = (await conn.query(profileQ,[userId]))[0][0]

    if(profile == null)
    {
        let insertQ  = "INSERT INTO PROFILE(id, user_id, media_url, created_date, updated_date)" +
                        " VALUES(?, ?, ?, now(), now())"
        await conn.query(insertQ,[uuid.v4(), userId, req.file.location])
    }
    else
    {
        let updateQ = "UPDATE PROFILE SET media_url = ? WHERE user_id = ?"
        await conn.query(updateQ,[req.file.location,userId])
    }

    res.json({
        statusCode: 200,
        statusMsg: "success"
    })
    conn.release()
    return

}))

module.exports = router;