const BaseController = require("../../shared/base/base.controller")

class AcademicController extends BaseController {
    constructor(academicService, logger) {
        super(academicService, logger)
        this.academicService = academicService
        this.logger = logger
    }

 
}

module.exports = AcademicController