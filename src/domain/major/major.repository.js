const BaseRepository = require("../../shared/base/base.repository")

class MajorRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.major, logger)
    }

    async findManyWithFaculty(options = {}) {
        try {
            const { facultyId } = options

            const where = {}
            if (facultyId) {
                where.facultyId = facultyId
            }

            const majors = await this.prisma.findMany({
                where,
                include: {
                    faculty: {
                        select: {
                            id: true,
                            facultyName: true
                        }
                    }
                },
                orderBy: { majorName: 'asc' }
            })

            return majors.map(major => ({
                id: major.id,
                name: major.majorName,
                faculty: {
                    id: major.faculty.id,
                    name: major.faculty.facultyName
                }
            }))
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = MajorRepository