const BaseRepository = require("../../shared/base/base.repository")

class ManagerRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.manager, logger)
        this.prismaClient = prisma
    }

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search, company, position } = options

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
}

module.exports = ManagerRepository