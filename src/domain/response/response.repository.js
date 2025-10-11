const BaseRepository = require("../../shared/base/base.repository")

class ResponseRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma, logger) 
 
    }

  
}

module.exports = ResponseRepository