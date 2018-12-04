const router = require("express").Router()

router.use('/auth', require("./auth"))
router.use('/profile', require("./profile"))

module.exports = router
