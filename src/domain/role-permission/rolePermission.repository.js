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

    async findManyWithPagination(options = {}) {
        try {
            const { page = 1, limit = 10, search } = options

            const where = {}
            if (search) {
                where.roleName = { contains: search, mode: 'insensitive' }
            }

            // Use getAll from base repository
            const result = await this.getAll({
                page,
                limit,
                where,
                include: {
                    rolePermission: {
                        include: {
                            permission: {
                                select: {
                                    id: true,
                                    resource: true,
                                    action: true,
                                    createdAt: true,
                                    updatedAt: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            const formattedRoles = result.data.map(role => ({
                id: role.id,
                roleName: role.roleName,
                description: role.description,
                isSuperAdmin: role.isSuperAdmin || false,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
                permissions: role.rolePermission.map(rp => ({
                    id: rp.permission.id,
                    permissionName: `${rp.permission.resource}.${rp.permission.action}`,
                    resource: rp.permission.resource,
                    action: rp.permission.action,
                    createdAt: rp.permission.createdAt,
                    updatedAt: rp.permission.updatedAt
                }))
            }))

            return {
                roles: formattedRoles,
                meta: result.meta
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async findUniqueWithPermissions(options = {}) {
        try {
            const role = await this.prisma.findUnique({
                ...options,
                include: {
                    rolePermission: {
                        include: {
                            permission: {
                                select: {
                                    id: true,
                                    resource: true,
                                    action: true,
                                    createdAt: true,
                                    updatedAt: true
                                }
                            }
                        }
                    }
                }
            })

            if (!role) {
                throw new Error('Role not found')
            }

            return {
                id: role.id,
                roleName: role.roleName,
                description: role.description,
                isSuperAdmin: role.isSuperAdmin || false,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
                permissions: role.rolePermission.map(rp => ({
                    id: rp.permission.id,
                    permissionName: `${rp.permission.resource}.${rp.permission.action}`,
                    resource: rp.permission.resource,
                    action: rp.permission.action,
                    createdAt: rp.permission.createdAt,
                    updatedAt: rp.permission.updatedAt
                }))
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async createWithPermissions(options = {}) {
        try {
            const { roleData, permissions = [] } = options

            const result = await this.prismaClient.$transaction(async (tx) => {
                // Get or create permissions
                const permissionIds = await this.getOrCreatePermissions(tx, permissions)

                // Create role
                const role = await tx.role.create({
                    data: {
                        roleName: roleData.name,
                        description: roleData.description,
                        rolePermission: {
                            create: permissionIds.map(permissionId => ({
                                permissionId
                            }))
                        }
                    },
                    include: {
                        rolePermission: {
                            include: {
                                permission: {
                                    select: {
                                        id: true,
                                        resource: true,
                                        action: true,
                                        createdAt: true,
                                        updatedAt: true
                                    }
                                }
                            }
                        }
                    }
                })

                return {
                    id: role.id,
                    roleName: role.roleName,
                    description: role.description,
                    isSuperAdmin: role.isSuperAdmin || false,
                    createdAt: role.createdAt,
                    updatedAt: role.updatedAt,
                    permissions: role.rolePermission.map(rp => ({
                        id: rp.permission.id,
                        permissionName: `${rp.permission.resource}.${rp.permission.action}`,
                        resource: rp.permission.resource,
                        action: rp.permission.action,
                        createdAt: rp.permission.createdAt,
                        updatedAt: rp.permission.updatedAt
                    }))
                }
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async updateWithPermissions(options = {}) {
        try {
            const { where, roleData, permissions } = options

            // Check if role exists first
            const existingRole = await this.prisma.findUnique({ where })
            if (!existingRole) {
                throw new Error(`Role with id ${where.id} not found`)
            }

            const result = await this.prismaClient.$transaction(async (tx) => {
                // Update role data
                const updateData = {}
                if (roleData.name !== undefined) updateData.roleName = roleData.name
                if (roleData.description !== undefined) updateData.description = roleData.description

                if (Object.keys(updateData).length > 0) {
                    await tx.role.update({
                        where,
                        data: updateData
                    })
                }

                // Update permissions if provided
                if (permissions !== undefined) {
                    // Delete existing permissions
                    await tx.rolePermission.deleteMany({
                        where: { roleId: where.id }
                    })

                    // Get or create new permissions
                    if (permissions.length > 0) {
                        const permissionIds = await this.getOrCreatePermissions(tx, permissions)

                        // Create new permissions
                        await tx.rolePermission.createMany({
                            data: permissionIds.map(permissionId => ({
                                roleId: where.id,
                                permissionId
                            }))
                        })
                    }
                }

                // Fetch updated role with permissions
                const role = await tx.role.findUnique({
                    where,
                    include: {
                        rolePermission: {
                            include: {
                                permission: {
                                    select: {
                                        id: true,
                                        resource: true,
                                        action: true,
                                        createdAt: true,
                                        updatedAt: true
                                    }
                                }
                            }
                        }
                    }
                })

                if (!role) {
                    throw new Error('Role not found')
                }

                return {
                    id: role.id,
                    roleName: role.roleName,
                    description: role.description,
                    isSuperAdmin: role.isSuperAdmin || false,
                    createdAt: role.createdAt,
                    updatedAt: role.updatedAt,
                    permissions: role.rolePermission.map(rp => ({
                        id: rp.permission.id,
                        permissionName: `${rp.permission.resource}.${rp.permission.action}`,
                        resource: rp.permission.resource,
                        action: rp.permission.action,
                        createdAt: rp.permission.createdAt,
                        updatedAt: rp.permission.updatedAt
                    }))
                }
            })

            return result
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    async getAvailableResources() {
        try {
            // Return static list from API spec
            return {
                admin: {
                    name: "admin",
                    actions: ["create", "read", "update", "delete"]
                },
                role: {
                    name: "role",
                    actions: ["create", "read", "update", "delete"]
                },
                survey: {
                    name: "survey",
                    actions: ["create", "read", "update", "delete", "publish", "archive"]
                },
                question: {
                    name: "question",
                    actions: ["create", "read", "update", "delete"]
                },
                respondent: {
                    name: "respondent",
                    actions: ["create", "read", "update", "delete", "import"]
                },
                email: {
                    name: "email",
                    actions: ["create", "read", "update", "delete", "send"]
                },
                response: {
                    name: "response",
                    actions: ["read", "export", "delete"]
                },
                faculty: {
                    name: "faculty",
                    actions: ["manage"]
                },
                major: {
                    name: "major",
                    actions: ["manage"]
                },
                faq: {
                    name: "faq",
                    actions: ["manage"]
                }
            }
        } catch (error) {
            this.logger.error(error)
            throw error
        }
    }

    // Helper method to group permissions by resource
    groupPermissionsByResource(rolePermissions) {
        const grouped = {}
        rolePermissions.forEach(rp => {
            const resource = rp.permission.resource
            const action = rp.permission.action
            if (!grouped[resource]) {
                grouped[resource] = []
            }
            if (!grouped[resource].includes(action)) {
                grouped[resource].push(action)
            }
        })

        return Object.keys(grouped).map(resource => ({
            resource,
            actions: grouped[resource]
        }))
    }

    // Helper method to get or create permissions
    async getOrCreatePermissions(tx, permissions) {
        const permissionIds = []

        for (const permString of permissions) {
            // Split "resource.action" format
            const [resource, action] = permString.split('.')

            // Try to find existing permission
            let permission = await tx.permission.findFirst({
                where: {
                    resource,
                    action
                }
            })

            // Create if not exists
            if (!permission) {
                permission = await tx.permission.create({
                    data: {
                        permissionName: `${resource}.${action}`,
                        resource,
                        action
                    }
                })
            }

            permissionIds.push(permission.id)
        }

        return permissionIds
    }


}

module.exports = RolePermissionRepository