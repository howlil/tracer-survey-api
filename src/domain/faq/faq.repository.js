const BaseRepository = require("../../shared/base/base.repository")

class FaqRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.faq, logger)
    }

    async findMany() {
        try {
            return await this.prisma.findMany({
                orderBy: {
                    createdAt: 'desc'
                }
            })

        } catch (error) {
            throw error
        }
    }
}

module.exports = FaqRepository