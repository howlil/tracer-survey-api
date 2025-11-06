const BaseRepository = require("../../shared/base/base.repository")

class AlumniRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.alumni, logger)
        this.prismaClient = prisma
    }

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search, facultyId, majorId, degree, graduatedYear, graduatePeriode } = options

            const where = {}
            if (search) {
                where.OR = [
                    { respondent: { fullName: { contains: search, mode: 'insensitive' } } },
                    { nim: { contains: search, mode: 'insensitive' } },
                    { respondent: { email: { contains: search, mode: 'insensitive' } } }
                ]
            }
            if (facultyId) {
                where.major = { facultyId }
            }
            if (majorId) {
                where.majorId = majorId
            }
            if (degree) {
                where.degree = degree
            }
            if (graduatedYear) {
                where.graduatedYear = graduatedYear
            }
            if (graduatePeriode) {
                where.graduatePeriode = graduatePeriode
            }

            // Use getAll from base repository
            const result = await this.getAll({
                page,
                limit,
                where,
                include: {
                    respondent: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true
                        }
                    },
                    major: {
                        select: {
                            id: true,
                            majorName: true,
                            faculty: {
                                select: {
                                    id: true,
                                    facultyName: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // Get stats
            const [totalAlumni, alumniThisYear, majorsGroup, facultiesGroup] = await Promise.all([
                this.prisma.count(),
                this.prisma.count({
                    where: {
                        graduatedYear: new Date().getFullYear()
                    }
                }),
                this.prisma.groupBy({
                    by: ['majorId'],
                    _count: { majorId: true }
                }),
                this.prismaClient.major.groupBy({
                    by: ['facultyId'],
                    _count: { facultyId: true }
                })
            ])

            const totalMajors = majorsGroup.length
            const totalFaculties = facultiesGroup.length

            const formattedAlumni = result.data.map(alum => ({
                id: alum.id,
                nim: alum.nim,
                graduatedYear: alum.graduatedYear,
                graduatePeriode: alum.graduatePeriode,
                degree: alum.degree,
                respondent: alum.respondent,
                major: {
                    id: alum.major.id,
                    name: alum.major.majorName,
                    faculty: {
                        id: alum.major.faculty.id,
                        name: alum.major.faculty.facultyName
                    }
                }
            }))

            return {
                alumni: formattedAlumni,
                meta: result.meta,
                stats: {
                    totalAlumni,
                    alumniThisYear,
                    totalMajors,
                    totalFaculties,
                    filteredCount: result.meta.total
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = AlumniRepository