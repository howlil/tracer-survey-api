const BaseRepository = require("../../shared/base/base.repository")

class AdminRepository extends BaseRepository {
    constructor({ prisma, logger }) {
        super(prisma.admin, logger)
    }

    async createAdmin(data) {
        try {
            return await this.prisma.create({
                data,
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            })
        } catch (error) {
            this.logger.error('Error in AdminRepository.createAdmin:', error)
            throw error
        }
    }

    async findByEmail(email) {
        try {
            return await this.prisma.findUnique({
                where: { email }
            })
        } catch (error) {
            this.logger.error('Error in AdminRepository.findByEmail:', error)
            throw error
        }
    }

    async findByUsername(username) {
        try {
            return await this.prisma.findUnique({
                where: { username }
            })
        } catch (error) {
            this.logger.error('Error in AdminRepository.findByUsername:', error)
            throw error
        }
    }

}

module.exports = AdminRepository