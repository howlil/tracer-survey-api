const RequestHttp = require("../http/request.http")

module.exports = function httpMiddleware(req,res,next){
    req.extract = new RequestHttp(res)
    next()
}