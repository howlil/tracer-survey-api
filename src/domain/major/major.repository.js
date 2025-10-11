const BaseRepository = require("../../shared/base/base.repository")

class MajorRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.major, logger)
    }

    async findMany() {
        try {
            return await this.prisma.findMany({
                select: {
                    id: true,
                    majorName: true,
                }
            })

        } catch (error) {
            throw error
        }
    }
}

module.exports = MajorRepository