const BaseRepository = require("../../shared/base/base.repository")

class ManagerRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.manager, logger)
        this.prismaClient = prisma
    }

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search, company, position, accessibleFacultyIds } = options

            const where = {}
            if (search) {
                where.OR = [
                    { respondent: { fullName: { contains: search, mode: 'insensitive' } } },
                    { respondent: { email: { contains: search, mode: 'insensitive' } } }
                ]
            }
            if (company) {
                where.company = { contains: company, mode: 'insensitive' }
            }
            if (position) {
                where.position = { contains: position, mode: 'insensitive' }
            }
            if (accessibleFacultyIds && accessibleFacultyIds.length > 0) {
                where.PinAlumni = {
                    some: {
                        alumni: {
                            major: {
                                facultyId: { in: accessibleFacultyIds }
                            }
                        }
                    }
                }
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
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            // Get stats
            const [totalManagers, companiesGroup, positionsGroup] = await Promise.all([
                this.prisma.count(),
                this.prisma.groupBy({
                    by: ['company'],
                    _count: { company: true }
                }),
                this.prisma.groupBy({
                    by: ['position'],
                    _count: { position: true }
                })
            ])

            const totalCompanies = companiesGroup.length
            const totalPositions = positionsGroup.length

            const formattedManagers = result.data.map(manager => ({
                id: manager.id,
                company: manager.company,
                position: manager.position,
                respondentId: manager.respondentId,
                respondent: manager.respondent
            }))

            return {
                managers: formattedManagers,
                meta: result.meta,
                stats: {
                    totalManagers,
                    totalCompanies,
                    totalPositions,
                    filteredCount: result.meta.total
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUniqueCompanies() {
        try {
            const companies = await this.prisma.findMany({
                select: { company: true },
                distinct: ['company'],
                orderBy: { company: 'asc' }
            })
            return companies.map(c => c.company)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getUniquePositions() {
        try {
            const positions = await this.prisma.findMany({
                select: { position: true },
                distinct: ['position'],
                orderBy: { position: 'asc' }
            })
            return positions.map(p => p.position)
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findPinsWithAlumni(pins = []) {
        return this.prismaClient.pinAlumni.findMany({
            where: {
                pin: { in: pins },
            },
            include: {
                alumni: {
                    include: {
                        major: {
                            include: {
                                faculty: true,
                            },
                        },
                        respondent: {
                            select: {
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })
    }

    async createManagerWithPins(options = {}) {
        const {
            fullName,
            email,
            company,
            position,
            phoneNumber,
            pins = [],
        } = options

        return this.prismaClient.$transaction(async (tx) => {
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
                    role: 'MANAGER',
                },
            })

            const manager = await tx.manager.create({
                data: {
                    company,
                    position,
                    phoneNumber: phoneNumber || null,
                    respondentId: respondent.id,
                },
                include: {
                    respondent: true,
                },
            })

            await tx.pinAlumni.updateMany({
                where: {
                    pin: { in: pins },
                },
                data: {
                    managerId: manager.id,
                },
            })

            return manager
        })
    }
}

module.exports = ManagerRepository