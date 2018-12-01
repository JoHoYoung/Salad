var Channels = ['NAVER_News_Main']

module.exports.Channels = Channels
module.exports.asyncWrapper = fn => (req, res, next) => {Promise.resolve(fn(req,res,next)).catch(next)}