const BaseRepository = require("../../shared/base/base.repository")
const { generatePin } = require("../../shared/utils/pin.util")

class AlumniRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.alumni, logger)
        this.prismaClient = prisma
    }

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search, facultyId, majorId, degree, graduatedYear, graduatePeriode, accessibleFacultyIds } = options

            const filters = []
            if (search) {
                filters.push({
                    OR: [
                        { respondent: { fullName: { contains: search, mode: 'insensitive' } } },
                        { nim: { contains: search, mode: 'insensitive' } },
                        { respondent: { email: { contains: search, mode: 'insensitive' } } }
                    ]
                })
            }
            if (majorId) {
                filters.push({ majorId })
            }
            if (degree) {
                filters.push({ degree })
            }
            if (graduatedYear) {
                filters.push({ graduatedYear })
            }
            if (graduatePeriode) {
                filters.push({ graduatePeriode })
            }

            const majorFilter = {}
            if (facultyId) {
                majorFilter.facultyId = facultyId
            } else if (accessibleFacultyIds && accessibleFacultyIds.length > 0) {
                majorFilter.facultyId = { in: accessibleFacultyIds }
            }

            if (Object.keys(majorFilter).length > 0) {
                filters.push({
                    major: majorFilter
                })
            }

            const where = filters.length > 0 ? { AND: filters } : {}

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

    async findMajorWithFaculty(majorId) {
        return this.prismaClient.major.findUnique({
            where: { id: majorId },
            include: {
                faculty: {
                    select: {
                        id: true,
                        facultyName: true,
                    },
                },
            },
        })
    }

    async generateUniquePin(tx, maxAttempts = 10) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pin = generatePin(6)
            const existingPin = await tx.pinAlumni.findUnique({
                where: { pin },
            })
            if (!existingPin) {
                return pin
            }
        }
        throw new Error('Gagal menghasilkan PIN unik')
    }

    async createAlumniWithRespondent(data) {
        try {
            const {
                nim,
                fullName,
                email,
                majorId,
                degree,
                graduatedYear,
                graduatePeriode,
            } = data

            const result = await this.prismaClient.$transaction(async (tx) => {
                const existingNim = await tx.alumni.findUnique({
                    where: { nim },
                })
                if (existingNim) {
                    throw new Error(`NIM ${nim} sudah terdaftar`)
                }

                const existingEmail = await tx.respondent.findUnique({
                    where: { email },
                })
                if (existingEmail) {
                    throw new Error(`Email ${email} sudah digunakan`)
                }

                const respondent = await tx.respondent.create({
                    data: {
                        fullName,
                        email,
                        role: 'ALUMNI',
                    },
                })

                const alumni = await tx.alumni.create({
                    data: {
                        nim,
                        majorId,
                        degree,
                        graduatedYear,
                        graduatePeriode,
                        respondentId: respondent.id,
                    },
                    include: {
                        respondent: true,
                        major: {
                            include: {
                                faculty: true,
                            },
                        },
                    },
                })

                const pin = await this.generateUniquePin(tx)

                await tx.pinAlumni.create({
                    data: {
                        pin,
                        alumniId: alumni.id,
                        managerId: null,
                        pinType: 'ALUMNI',
                    },
                })

                return alumni
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = AlumniRepository