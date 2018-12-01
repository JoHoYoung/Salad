//필요한 모듈 설정.
const router = require('express').Router();
const helper = require('../helper/helper')

//db 설정
const db = require('../helper/mysql')
const pool = db.pool




router.get('/',helper.asyncWrapper(async(req,res) => {

    console.log(req.user)
    res.send(req.toString())
}))

module.exports = router