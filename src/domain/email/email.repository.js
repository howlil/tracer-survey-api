const BaseRepository = require("../../shared/base/base.repository")

class EmailRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma, logger) 
 
    }

  
}

module.exports = EmailRepository