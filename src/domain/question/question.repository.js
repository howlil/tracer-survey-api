const BaseRepository = require("../../shared/base/base.repository")

class QuestionRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma, logger) 
 
    }

  
}

module.exports = QuestionRepository