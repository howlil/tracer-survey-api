const BaseRepository = require("../../shared/base/base.repository")

class AlumniRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.alumni, logger)
    }
}

module.exports = AlumniRepository