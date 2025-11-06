const BaseRepository = require("../../shared/base/base.repository")

class AdminRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.admin, logger)
        this.prismaClient = prisma
    }

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search, isActive, roleId } = options

            const where = {}
            if (search) {
                where.OR = [
                    { username: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            }
            if (isActive !== undefined) {
                where.isActive = isActive
            }
            if (roleId) {
                where.roles = {
                    some: {
                        roleId
                    }
                }
            }

            // Use getAll from base repository
            const result = await this.getAll({
                page,
                limit,
                where,
                include: {
                    roles: {
                        include: {
                            role: {
                                select: {
                                    id: true,
                                    roleName: true,
                                    description: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            const formattedAdmins = result.data.map(admin => ({
                id: admin.id,
                username: admin.username,
                name: admin.name,
                email: admin.email,
                isActive: admin.isActive,
                roles: admin.roles.map(ar => ({
                    adminId: ar.adminId,
                    roleId: ar.roleId,
                    role: ar.role
                }))
            }))

            return {
                admins: formattedAdmins,
                meta: result.meta
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findUniqueWithRoles(options = {}) {
        try {
            const admin = await this.prisma.findUnique({
                ...options,
                include: {
                    roles: {
                        include: {
                            role: {
                                select: {
                                    id: true,
                                    roleName: true,
                                    description: true
                                }
                            }
                        }
                    }
                }
            })

            if (!admin) {
                throw new Error('Admin not found')
            }

            return {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                email: admin.email,
                isActive: admin.isActive,
                roles: admin.roles.map(ar => ({
                    adminId: ar.adminId,
                    roleId: ar.roleId,
                    role: ar.role
                }))
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createWithRoles(options = {}) {
        try {
            const { adminData, roleIds = [] } = options

            const result = await this.prismaClient.$transaction(async (tx) => {
                const admin = await tx.admin.create({
                    data: {
                        ...adminData,
                        roles: {
                            create: roleIds.map(roleId => ({
                                roleId
                            }))
                        }
                    },
                    include: {
                        roles: {
                            include: {
                                role: {
                                    select: {
                                        id: true,
                                        roleName: true,
                                        description: true
                                    }
                                }
                            }
                        }
                    }
                })

                return {
                    id: admin.id,
                    username: admin.username,
                    name: admin.name,
                    email: admin.email,
                    isActive: admin.isActive,
                    roles: admin.roles.map(ar => ({
                        adminId: ar.adminId,
                        roleId: ar.roleId,
                        role: ar.role
                    }))
                }
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateWithRoles(options = {}) {
        try {
            const { where, adminData, roleIds } = options

            const result = await this.prismaClient.$transaction(async (tx) => {
                // Update admin data
                if (Object.keys(adminData).length > 0) {
                    await tx.admin.update({
                        where,
                        data: adminData
                    })
                }

                // Update roles if provided
                if (roleIds !== undefined) {
                    // Delete existing roles
                    await tx.adminRole.deleteMany({
                        where: { adminId: where.id }
                    })

                    // Create new roles
                    if (roleIds.length > 0) {
                        await tx.adminRole.createMany({
                            data: roleIds.map(roleId => ({
                                adminId: where.id,
                                roleId
                            }))
                        })
                    }
                }

                // Fetch updated admin with roles
                const admin = await tx.admin.findUnique({
                    where,
                    include: {
                        roles: {
                            include: {
                                role: {
                                    select: {
                                        id: true,
                                        roleName: true,
                                        description: true
                                    }
                                }
                            }
                        }
                    }
                })

                return {
                    id: admin.id,
                    username: admin.username,
                    name: admin.name,
                    email: admin.email,
                    isActive: admin.isActive,
                    roles: admin.roles.map(ar => ({
                        adminId: ar.adminId,
                        roleId: ar.roleId,
                        role: ar.role
                    }))
                }
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }
}

module.exports = AdminRepository