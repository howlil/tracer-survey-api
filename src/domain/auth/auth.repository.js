class AuthRepository {
    constructor(prisma, logger) {
        this.prisma = prisma
        this.logger = logger
    }

    async findAdminByEmail(email) {
        try {
            return await this.prisma.admin.findUnique({
                where: { email },
                include: {
                    roles: {
                        include: {
                            role: {
                                include: {
                                    rolePermission: {
                                        include: {
                                            permission: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        } catch (error) {
            this.logger.error('Error finding admin by email:', error)
            throw error
        }
    }

    async findAlumniByPin(pin) {
        try {
            return await this.prisma.pinAlumni.findUnique({
                where: { pin },
                include: {
                    alumni: {
                        include: {
                            respondent: true,
                            major: {
                                include: {
                                    faculty: true
                                }
                            }
                        }
                    }
                }
            })
        } catch (error) {
            this.logger.error('Error finding alumni by pin:', error)
            throw error
        }
    }

    async findManagerByPin(pin) {
        try {
            return await this.prisma.pinAlumni.findUnique({
                where: { pin },
                include: {
                    manager: {
                        include: {
                            respondent: true
                        }
                    },
                    alumni: {
                        include: {
                            respondent: true,
                            major: {
                                include: {
                                    faculty: true
                                }
                            }
                        }
                    }
                }
            })
        } catch (error) {
            this.logger.error('Error finding manager by pin:', error)
            throw error
        }
    }
}

module.exports = AuthRepository

