const router = require("express").Router()

router.use("/auth", require("./auth.js"))
module.exports = router
