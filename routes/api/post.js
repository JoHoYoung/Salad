const router = require('express').Router();
const helpers = require('../../helper/helper')
const uuid = require('uuid')
const db = require('../../helper/mysql')
const pool = db.pool
const promiseHandler = require('../../helper/promiseHandler')
const S3 = require('../../helper/awsS3')

/**
 * @swagger
 * tags:
 *   name: post
 *   description: 게시판 관련 API 입니다.
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
 * /list:
 *   post:
 *     summary: 특정 게시판의 게시글 목록을 10개씩 가져옵니다.
 *     tags: [post]
 *     parameters:
 *      - name: post_metaId
 *        in: body
 *        description: 해당 게시판의 metaId
 *        type: array
 *        example: "10fe230121212-dasd123"
 *      - name: page
 *        in: body
 *        description: 게시판의 페이지 번호. 0번부터 시작 각페이지는 게시글 10개씩
 *        type: array
 *        example: "0"
 *     responses:
 *       200:
 *         description: 해당 게시판의 게시글을 10개씩 리턴합니다
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *           data:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  user_name:
 *                   type: string
 *                  id:
 *                   type: string
 *                  title:
 *                   type: string
 *                  content:
 *                   type: string
 *                  star:
 *                   type: int
 *                  views:
 *                   type: int
 *                  comment_count:
 *                   type: int
 *                  created_date:
 *                   type: string
 *                  updated_date:
 *                   type: string
 *              example:
 *                  - user_name: "호영짱"
 *                    id: hihi
 *                    title: 어제 일을 했습니다.
 *                    content: 내일은 정말 하기 싫네요 내일도 진짜 출근 해야하나요? 튈까요?
 *                    star: 100
 *                    views: 350
 *                    comment_count: 10
 *                    created_date: '2018-01-01'
 *                    updated_date: '2018-01-13'
 *                  - user_name: "호영짱"
 *                    id: hihi
 *                    title: 어제 일을 했습니다.
 *                    content: 내일은 정말 하기 싫네요 내일도 진짜 출근 해야하나요? 튈까요?
 *                    star: 100
 *                    views: 350
 *                    comment_count: 10
 *                    created_date: '2018-01-01'
 *                    updated_date: '2018-01-13'
 *                  - user_name: "호영짱"
 *                    id: hihi
 *                    title: 어제 일을 했습니다.
 *                    content: 내일은 정말 하기 싫네요 내일도 진짜 출근 해야하나요? 튈까요?
 *                    star: 100
 *                    views: 350
 *                    comment_count: 10
 *                    created_date: '2018-01-01'
 *                    updated_date: '2018-01-13'
 *                  - user_name: "호영짱"
 *                    id: hihi
 *                    title: 어제 일을 했습니다.
 *                    content: 내일은 정말 하기 싫네요 내일도 진짜 출근 해야하나요? 튈까요?
 *                    star: 100
 *                    views: 350
 *                    comment_count: 10
 *                    created_date: '2018-01-01'
 *                    updated_date: '2018-01-13'
 *       718:
 *          description: 게시판의 postmetaId가 존재하지 않는경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 718
 *            statusMsg:
 *              type: string
 *              example: "Invalid postmetaId"
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
 *             example: "No Access Token"
 */

router.post('/list', helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()
    let post_metaId = req.body.post_metaId
    let offset = parseInt(req.body.page)*10

    let postmetaQ = "SELECT * FROM POST_META WHERE id = '" + post_metaId + "'"
    let postmeta = (await conn.query(postmetaQ))[0][0];

    if(postmeta == null)
    {
        res.json({
            statusCode:718,
            statusMsg:"Invalid postmetaId"
        })
        conn.release()
        return
    }

    //페이지 네이션 처리
    let postQ = "SELECT a.user_name, b.id, b.title, b.content, b.star, b.views, b.created_date, b.updated_date, b.comment_count FROM USER a INNER JOIN (SELECT * FROM POST c WHERE postmeta_id = '" + postmeta.id + "'" +
                " AND c.state = 'C' ORDER BY created_date DESC LIMIT " + offset.toString() + ", 10) b on a.id = b.writer_id"
    let post = (await conn.query(postQ))

    res.json({
        statusCode:200,
        statusMsg:"success",
        data: post !== null ? post : null
    })

    conn.release()
    return


}))

/**
 * @swagger
 * /create:
 *   post:
 *     summary: 게시글을 작성합니다.
 *     tags: [post]
 *     parameters:
 *      - name: post_metaId
 *        in: body
 *        description: 해당 게시판의 metaId
 *        type: array
 *        example: "10fe230121212-dasd123"
 *      - name: title
 *        in: body
 *        description: 작성자가 작성한 게시물의 제목.
 *        type: array
 *        example: "추운데 새콤달콤 맛있음"
 *      - name: content
 *        in: body
 *        description: 작성자가 작성한 게시물의 내용.
 *        type: array
 *        example: "오늘 날씨가 정말 춥네요.... 길바닥도 얼었어요.. 새콤달콤 맛있다."
 *      - name: image
 *        in: multipart
 *        description: 작성자가 작성한 게시물의 사진. 최대 6개까지 가능합니다.
 *        type: array
 *     responses:
 *       200:
 *         description: 게시물 작성 완료.
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       718:
 *          description: 게시판의 postmetaId가 존재하지 않는경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 718
 *            statusMsg:
 *              type: string
 *              example: "Invalid postmetaId"
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
 *             example: "No Access Token"
 */

let Multiple = S3.uploadArray
router.post('/create',Multiple, helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let post_metaId = req.body.post_metaId
    let title = req.body.title
    let content = req.body.content

    let exist = (await conn.query("SELECT * FROM POST_META WHERE id = '" + post_metaId + "'"))[0][0]
    if(exist == null)
    {
        res.json({
            statusCode: 718,
            statusMsg: 'Invalid postmetaId'
        })
        conn.release()
        return
    }

    await conn.query("UPDATE POST_META SET numberofpost = numberofpost + 1 WHERE id = '" + post_metaId + "'")


    let postId = uuid.v4()
    let insertQ = "INSERT INTO POST(id, postmeta_id, title, content, writer_id, state, created_date, updated_date) "+
                    "VALUES(?, ?, ?, ?, ?, 'C', now(), now())"
    await conn.query(insertQ,[postId,post_metaId, title, content, userId])

    for(let i=0;i<req.files.length;i++)
    {
        let createQ = "INSERT INTO POSTIMAGE(id, media_url, post_id, state, created_date, updated_date) "+
                        "VALUES(?, ?, ?, 'C', now(), now())"
        await conn.query(createQ,[uuid.v4(),req.files[i].location, postId])
    }

    res.json({
        statusCode:200,
        statusMsg:"success"
    })
    conn.release()
    return

}))

/**
 * @swagger
 * /read:
 *   post:
 *     summary: 특정 게시글에 대한 정보를 리턴합니다. 특정게시물이 해당유저가 작성한 게시물인지와 추천여부도 같이 리턴합니다.
 *     tags: [post]
 *     parameters:
 *      - name: postId
 *        in: body
 *        description: 특정 게시물의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *     responses:
 *       200:
 *         description: 해당 게시글의 데이터.
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
 *                 id:
 *                  type: string
 *                  example: "1231230asd-231ksad:
 *                 title:
 *                  type: string
 *                  example: "새콤달콤 마싱다:
 *                 content:
 *                  type: string
 *                  example: "글의내용은.. 별거 없습니다"
 *                 myname:
 *                  type: string
 *                  example: "디프만"
 *                 writer_name:
 *                  type: string
 *                  example: "호영짱"
 *                 star:
 *                  type: integer
 *                  example: 5
 *                 views:
 *                  type: integer
 *                  example: 105
 *                 recommended:
 *                  type: integer
 *                  example: 0
 *                 created_date:
 *                  type: string
 *                  example: "2018-12-14"
 *                 updated_date:
 *                  type: string
 *                  example: "2018-12-16"
 *                 ismine:
 *                  type: integer
 *                  example: 0
 *                 comments:
 *                  type: object
 *                  properties:
 *                   user_name:
 *                    type: string
 *                   comment_id:
 *                    type: string
 *                   content:
 *                    type: string
 *                   created_date:
 *                    type: string
 *                   updated_date:
 *                    type: string
 *                  example:
 *                      - user_name : "호영짱"
 *                        comment_id: "1200123-asvzxw-1"
 *                        post_id: "123912312-xzzdw012"
 *                        content: "댓글입니다."
 *                        created_date: "2018-12-01"
 *                        updated_date: "2018-12-14"
 *                      - user_name : "호영짱"
 *                        comment_id: "1200123-asvzxw-1"
 *                        post_id: "123912312-xzzdw012"
 *                        content: "댓글입니다."
 *                        created_date: "2018-12-01"
 *                        updated_date: "2018-12-14"
 *                      - user_name : "호영짱"
 *                        comment_id: "1200123-asvzxw-1"
 *                        post_id: "123912312-xzzdw012"
 *                        content: "댓글입니다."
 *                        created_date: "2018-12-01"
 *                        updated_date: "2018-12-14"
 *                 images:
 *                  type: object
 *                  properties:
 *                   id:
 *                    type: string
 *                   media_url:
 *                    type: string
 *                   post_id:
 *                    type: string
 *                   state:
 *                    type: int
 *                   created_date:
 *                    type: string
 *                   updated_date:
 *                    type: string
 *                  example:
 *                      - id : "adfafdasf23-01233211"
 *                        media_url: "https://amazon-s3/rpictue.jpg"
 *                        post_id: "123912312-xzzdw012"
 *                        state: "C"
 *                        created_date: "2018-12-01"
 *                        updated_date: "2018-12-14"
 *                      - id : "adfafdasf23-01233211"
 *                        media_url: "https://amazon-s3/rpictue.jpg"
 *                        post_id: "123912312-xzzdw012"
 *                        state: "C"
 *                        created_date: "2018-12-01"
 *                        updated_date: "2018-12-14"
 *                      - id : "adfafdasf23-01233211"
 *                        media_url: "https://amazon-s3/rpictue.jpg"
 *                        post_id: "123912312-xzzdw012"
 *                        state: "C"
 *                        created_date: "2018-12-01"
 *                        updated_date: "2018-12-14"
 *       718:
 *          description: 게시판의 postmetaId가 존재하지 않는경우 에러를 리턴합니다.
 *          properties:
 *            statusCode:
 *              type: integer
 *              example: 718
 *            statusMsg:
 *              type: string
 *              example: "Invalid postmetaId"
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
 *             example: "No Access Token"
 */
router.post('/read',helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let myname = (await conn.query("SELECT user_name FROM USER WHERE id = '" + userId + "'"))[0][0]
    let postId = req.body.postId
    let post = (await conn.query("SELECT * FROM POST WHERE id = '" + postId + "'"))[0][0]

    let username = (await conn.query("SELECT user_name FROM USER WHERE id = '" + post.writer_id + "'"))[0][0]
    await conn.query("UPDATE POST SET views = views + 1 WHERE id ='" + postId + "'")
    let ismine
    if(writer_id == userId)
    {
        ismine = true
    }
    else
    {
        ismine=false
    }
    let images = (await conn.query("SELECT * FROM POSTIMAGE WHERE post_id = '" + postId + "' AND state = 'C' "))[0]
    let commentsQ = "SELECT a.user_name, b.id as comment_id, b.content, b.created_date, b.updated_date FROM USER a INNER JOIN (SELECT * COMMENT WHERE post_id ='" + postId + "' AND state ='C') b"+
                    " on a.id = b.writer_id"
    let comments = (await conn.query(commentsQ))[0]

    let recommed = (await conn.query("SELECT * FROM RECOMMEND WHERE post_id = ? AND user_id =? AND state = 'C'",[postId,userId]))[0][0]
    let recommended

    if(recommed != null)
    {
        recommended = 0

    }
    else
    {
        recommended = 1
    }
    res.json({
        statusCode:200,
        statusMsg:"success",
        data:{
            id: post.id,
            myname: myname,
            title: post.title,
            content: post.content,
            writer_name: username,
            star: post.star,
            views: post.views,
            recommended: recommended,
            created_date: post.created_date,
            updated_date: post.updated_date,
            ismine: ismine,
            comments: comments,
            images: images
        }
    })
    conn.release()
    return

}))

/**
 * @swagger
 * /update:
 *   post:
 *     summary: 특정 게시글의 내용을 수정합니다.
 *     tags: [post]
 *     parameters:
 *      - name: postId
 *        in: body
 *        description: 특정 게시물의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *      - name: title
 *        in: body
 *        description: 수정할 제목
 *        example: 제목은 이걸로 수정
 *      - name: content
 *        in: body
 *        description: 수정할 내용
 *        example: 내용은 이걸로 수정할래요
 *      - name: deletefile
 *        in: body
 *        description: 기존 게시물에서 삭제할 사진들의 id들을 array로 전달
 *        example: ["xzc02131221-123123","001o123-sdadaw"]
 *      - name: images
 *        description: 새롭게 업로드할 사진들을 multipart로 전송, 최대 6개
 *        in: body
 *     responses:
 *       200:
 *         description: 업데이트성공
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
 *             example: "No Access Token"
 */

router.post('/update',Multiple,helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let postId = req.body.postId
    let title = req.body.title
    let content = req.body.content
    let deletefile = req.body.deletefile

    let writer = (await conn.query("SELECT * FROM POST WHERE id = '" + postId + "'"))[0][0].writer_id

    if(userId != writer)
    {
        res.json({
            statusCode: 720,
            statusMsg: "This article is not yours"
        })
        conn.release()
        return
    }

    await conn.query("UPDATE POST SET title = ?, content = ?, updated_date = now() WHERE id = '" + postId + "'",[title,content])

    for(let i=0;i<deletefile.length;i++)
    {
        await conn.query("UPDATE POSTIMAGE SET state = 'D' WHERE id = '" + deletefile[i] + "'")
    }

    for(let j=0;j<req.files.length;j++)
    {
        let createQ = "INSERT INTO POSTIMAGE(id, media_url, post_id, state, created_date, updated_date) "+
            "VALUES(?, ?, ?, 'C', now(), now())"
        await conn.query(createQ,[uuid.v4(),req.files[j].location, postId])
    }

    res.json({
        statusCode:200,
        statusMsg:"success"
    })

    conn.release()
    return

}))

/**
 * @swagger
 * /delete:
 *   post:
 *     summary: 특정 게시글을 삭제합니다.
 *     tags: [post]
 *     parameters:
 *      - name: postId
 *        in: body
 *        description: 특정 게시물의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       720:
 *         description: 자기가 쓴 글이 아닐경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 720
 *           statusMsg:
 *             type: array
 *             example: "This article is not yours"
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
 *             example: 719
 *           statusMsg:
 *             type: array
 *             example: "No Access Token"
 */

router.post('/delete',helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let postId = req.body.postId

    let postmeta_Id = (await conn.query("SELECT writer_id ,postmeta_id FROM POST WHERE id = '" + postId + "'"))[0][0]

    if(userId != postmeta_Id.writer_id)
    {
        res.json({
            statusCode: 720,
            statusMsg: "This article is not yours"
        })
        conn.release()
        return
    }

    await conn.query("UDDATE POSTIMAGE SET state ='D' WHERE post_id = '" + postId +"'")
    await conn.query("UPDATE POST_META SET numberofpost = numberofpost - 1 WHERE id = '" + postmeta_Id.postmeta_Id + "'")
    await conn.query("UPDATE POST SET state ='D' WHERE id = '" + postId + "'")

    res.json({
        statusCode:200,
        statusMsg:"success"
    })
    conn.release()
    return

}))

/**
 * @swagger
 * /comment:
 *   post:
 *     summary: 특정 게시글에 댓글을 작성합니다.
 *     tags: [post]
 *     parameters:
 *      - name: postId
 *        in: body
 *        description: 해당 게시글의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *      - name: content
 *        in: body
 *        description: 댓글 내용
 *        type: array
 *        example: "댓글 입니다."
 *     responses:
 *       200:
 *         description: 댓글작성 성공
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
 *             example: 719
 *           statusMsg:
 *             type: array
 *             example: "No Access Token"
 */
router.post('/comment',helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let postId = req.body.postId
    let content = req.body.content

    let insertQ = "INSERT INTO COMMENT(id, post_id, content, writer_id, state, created_date, updated_date) "
                    + "VALUES(?, ?, ?, ?, 'C', now(), now())"
    await conn.query(insertQ,[uuid.v4(), postId, content, userId]);

    await conn.query("UPDATE POST SET comment_count = comment_count + 1 WHERE id = '" + postId + "'")

    res.json({
        statusCode:200,
        statusMsg:"success"
    })
    conn.release()
    return

}))

/**
 * @swagger
 * /decomment:
 *   post:
 *     summary: 특정 댓글을 삭제합니다.
 *     tags: [post]
 *     parameters:
 *      - name: commentId
 *        in: body
 *        description: 특정 댓글의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       720:
 *         description: 자기가 쓴 댓글이 아닐경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 720
 *           statusMsg:
 *             type: array
 *             example: "This article is not yours"
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
 *             example: 719
 *           statusMsg:
 *             type: array
 *             example: "No Access Token"
 */

router.post('/decomment',helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let commentId = req.body.commentId
    let comment = (await conn.query("SELECT * FROM COMMENT WHERE id = '" + commentId + "'"))[0][0]

    if(comment.writer_id != userId)
    {
        res.json({
            statusCode: 720,
            statusMsg: "This article is not yours"
        })
        conn.release()
        return
    }

    await conn.query("UPDATE POST SET comment_count = comment_count - 1 WHERE id = '" + comment.post_id + "'")
    await conn.query("UPDATE COMMENT SET state = 'D' WHERE id = ?",[commentId])
    await conn.query(insertQ,[uuid.v4(), postId, content, userId]);

    res.json({
        statusCode:200,
        statusMsg:"success"
    })
    conn.release()
    return

}))

/**
 * @swagger
 * /recomment:
 *   post:
 *     summary: 특정 댓글을 수정합니다.
 *     tags: [post]
 *     parameters:
 *      - name: commentId
 *        in: body
 *        description: 특정 댓글의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *      - name: content
 *        in: body
 *        description: 수정할 내용
 *        type: array
 *        example: "댓글을 이 내용으로 수정하겠습니다."
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       720:
 *         description: 자기가 쓴 댓글이 아닐경우 에러코드를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 720
 *           statusMsg:
 *             type: array
 *             example: "This article is not yours"
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
 *             example: 719
 *           statusMsg:
 *             type: array
 *             example: "No Access Token"
 */

router.post('/recomment',helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let commentId = req.body.commentId
    let content = req.body.content
    let comment = (await conn.query("SELECT * FROM COMMENT WHERE id = '" + commentId + "'"))[0][0]

    if(comment.writer_id != userId)
    {
        res.json({
            statusCode: 720,
            statusMsg: "This article is not yours"
        })
        conn.release()
        return
    }

    await conn.query("UPDATE COMMENT SET content = ? WHERE id = ?",[content,commentId])
    await conn.query(insertQ,[uuid.v4(), postId, content, userId]);

    res.json({
        statusCode:200,
        statusMsg:"success"
    })
    conn.release()
    return

}))

/**
 * @swagger
 * /star:
 *   post:
 *     summary: 특정 게시글을 추천 합니다.
 *     tags: [post]
 *     parameters:
 *      - name: postId
 *        in: body
 *        description: 특정 게시글의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *     responses:
 *       200:
 *         description: 추천 성공
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       721:
 *         description: 이미 추천한 게시글일 경우 에러를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 721
 *           statusMsg:
 *             type: array
 *             example: "You already recommend this article"
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
 *             example: 719
 *           statusMsg:
 *             type: array
 *             example: "No Access Token"
 */
router.post('/star',helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let postId = req.body.postId


    let exist = await conn.query("SELECT * FROM RECOMMEND WHERE post_id = ? AND user_id = ? AND state = 'C'",[postId,userId])

    if(exist != null)
    {
        res.json({
            statusCode: 721,
            statusMsg: "You already recommend this article"
        })
        conn.release()
        return
    }

    await conn.query("UPDATE POST SET star = star + 1 WHERE id = ?",[postId])

    let insertQ = "INSERT INTO RECOMMEND(id, post_id, user_id, state, created_date, updated_date) " +
                    "VALUES(?, ?, ?, 'C', now(), now())"
    await conn.query(insertQ,[uuid.v4(), postId, userId]);

    res.json({
        statusCode:200,
        statusMsg:"success"
    })
    conn.release()
    return

}))

/**
 * @swagger
 * /destar:
 *   post:
 *     summary: 특정 게시글을 추천을 취소 합니다.
 *     tags: [post]
 *     parameters:
 *      - name: postId
 *        in: body
 *        description: 특정 게시글의 id
 *        type: array
 *        example: "33241221310fe230121212-dasd123"
 *     responses:
 *       200:
 *         description: 취소 성공
 *         properties:
 *           statusCode:
 *             type : integer
 *             example : 200
 *           statusMsg:
 *              type : string
 *              example : "success"
 *       722:
 *         description: 이전에 추천하지 않은 게시글일 경우 에러를 리턴합니다.
 *         properties:
 *           statusCode:
 *             type: integer
 *             example: 722
 *           statusMsg:
 *             type: array
 *             example: "You didn't recommend this article"
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
 *             example: 719
 *           statusMsg:
 *             type: array
 *             example: "No Access Token"
 */
router.post('/destar',helpers.asyncWrapper(async (req,res) => {

    let conn = await db.connection()

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

    let postId = req.body.postId


    let exist = await conn.query("SELECT * FROM RECOMMEND WHERE post_id = ? AND user_id = ? AND state = 'C'",[postId,userId])

    if(exist == null)
    {
        res.json({
            statusCode: 722,
            statusMsg: "You didn't recommend this article"
        })
        conn.release()
        return
    }

    await conn.query("UPDATE POST SET star = star - 1 WHERE id = ?",[postId])
    await conn.query("UPDATE RECOMMEND SET state = 'D' WHERE post_id = ?, user_id = ?",[postId,userId])

    res.json({
        statusCode:200,
        statusMsg:"success"
    })
    conn.release()
    return

}))

module.exports = router