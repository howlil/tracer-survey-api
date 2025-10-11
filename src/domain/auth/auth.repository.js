const BaseRepository = require("../../shared/base/base.repository")

class AdminRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.admin, logger)
    }

}

module.exports = AdminRepository