const BaseRepository = require("../../shared/base/base.repository")

class SurveyRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma, logger) 
 
    }

  
}

module.exports = SurveyRepository