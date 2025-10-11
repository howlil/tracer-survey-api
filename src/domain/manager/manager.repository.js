const BaseRepository = require("../../shared/base/base.repository")

class ManagerRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.manager, logger)
    }
}

module.exports = ManagerRepository