const BaseRepository = require("../../shared/base/base.repository")

class AcademicRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma, logger)
    }

  
}

module.exports = AcademicRepository