const BaseController = require("../../shared/base/base.controller")

class AlumniController extends BaseController {
    constructor(alumniService, logger) {
        super(alumniService, logger)
        this.alumniService = alumniService
        this.logger = logger
    }
}

module.exports = AlumniController