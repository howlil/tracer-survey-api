const BaseRepository = require("../../shared/base/base.repository")

class FaqRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.faq, logger)
    }
}

module.exports = FaqRepository