const BaseRepository = require("../../shared/base/base.repository")

class UserRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma, logger) 
 
    }

  
}

module.exports = UserRepository