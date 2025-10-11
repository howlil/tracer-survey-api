const BaseRepository = require("../../shared/base/base.repository")


class RolePermissionRepository extends BaseRepository {
    constructor(prisma, logger) {
        super(prisma.role, logger)
        this.prismaClient = prisma
        this.permission = prisma.permission
    }

    async permissions() {
        try {
            return await this.permission.findMany({
                select: {
                    id: true,
                    permissionName: true,
                    resource: true,
                    action: true
                }
            })

        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async rolePermissions() {
        try {
            return await this.prisma.findMany({
                select: {
                    id: true,
                    roleName: true,
                    rolePermission: {
                        select: {
                            permission: {
                                select: {
                                    id: true,
                                    permissionName: true,
                                    resource: true,
                                    action: true
                                }
                            }
                        }
                    }
                }
            })

        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async update(options) {
        try {
            const { where, data } = options
            const { rolePermission, ...roleData } = data

            if (rolePermission) {
                return await this.prismaClient.$transaction(async (tx) => {
                    const result = await tx.role.update({
                        where,
                        data: {
                            ...roleData,
                            rolePermission: {
                                create: rolePermission?.create?.map(p => ({
                                    permissionId: p.permissionId
                                })) || []
                            }
                        }
                    })

                    if (rolePermission?.delete?.length > 0) {
                        const permissionIds = rolePermission.delete.map(p => p.permissionId)

                        await tx.rolePermission.deleteMany({
                            where: {
                                roleId: where.id,
                                permissionId: { in: permissionIds }
                            }
                        })
                    }

                    return result
                })
            }

            return await super.update({
                where,
                data
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
                    roleName: true,
                    description: true
                }
            })

        } catch (error) {
            throw error
        }
    }


}

module.exports = RolePermissionRepository