const BaseRepository = require("../../shared/base/base.repository")

class FacultyRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.faculty, logger)
    }

    async facultyWithMajor() {
        try {
            return await this.prisma.findMany({
                select: {
                    id: true,
                    facultyName: true,
                    majors: {
                        select: {
                            id: true,
                            majorName: true,
                            degree: true
                        }
                    }
                }
            })
        } catch (error) {
            throw error
        }
    }

    async findMany() {
        try {
            return await this.prisma.findMany({
                select: {
                    id: true,
                    facultyName: true,
                }
            })

        } catch (error) {
            throw error
        }
    }
}

module.exports = FacultyRepository