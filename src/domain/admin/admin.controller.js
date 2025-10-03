const BaseController = require("../../shared/base/base.controller")

class AdminController extends BaseController {
    constructor(opts){
        super(opts.service,opts.logger)
    }
}

module.exports = AdminController