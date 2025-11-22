const prisma = require("../../shared/configs/prisma.config")
const PermissionUtil = require("../../shared/utils/permission.util")
const PasswordUtil = require("../../shared/utils/password.util")

async function seedSuperAdmin(logger) {
    try {
        logger.info("🌱 Starting Super Admin seeding...")

        logger.info("📝 Step 1: Seeding permissions...")
        const permissions = PermissionUtil.generatePermision()
        logger.info(`   Found ${permissions.length} permissions to seed`)

        const createdPermissions = []
        for (const permission of permissions) {
            const result = await prisma.permission.upsert({
                where: { permissionName: permission.permissionName },
                update: {
                    resource: permission.resource,
                    action: permission.action
                },
                create: {
                    permissionName: permission.permissionName,
                    resource: permission.resource,
                    action: permission.action
                }
            })
            createdPermissions.push(result)
        }
        logger.info(`   ✅ ${createdPermissions.length} permissions ready`)

        logger.info("📝 Step 2: Creating Super Admin role...")
        let superAdminRole = await prisma.role.findFirst({
            where: { roleName: "Super Admin" }
        })

        if (superAdminRole) {
            superAdminRole = await prisma.role.update({
                where: { id: superAdminRole.id },
                data: {
                    description: "Full access to all system resources and permissions",
                    isSuperAdmin: true
                }
            })
            logger.info(`   ✅ Super Admin role updated: ${superAdminRole.id}`)
        } else {
            superAdminRole = await prisma.role.create({
                data: {
                    roleName: "Super Admin",
                    description: "Full access to all system resources and permissions",
                    isSuperAdmin: true
                }
            })
            logger.info(`   ✅ Super Admin role created: ${superAdminRole.id}`)
        }

        logger.info("📝 Step 3: Assigning all permissions to Super Admin role...")
        await prisma.rolePermission.deleteMany({
            where: { roleId: superAdminRole.id }
        })

        const rolePermissions = createdPermissions.map(permission => ({
            roleId: superAdminRole.id,
            permissionId: permission.id
        }))

        await prisma.rolePermission.createMany({
            data: rolePermissions,
            skipDuplicates: true
        })
        logger.info(`   ✅ Assigned ${rolePermissions.length} permissions to Super Admin role`)

        logger.info("📝 Step 4: Creating Super Admin account...")
        const adminEmail = "superadmin@unand.ac.id"
        const adminUsername = "superadmin"
        const adminPassword = "SuperAdmin123!"

        const hashedPassword = await PasswordUtil.hashPassword(adminPassword)

        const existingAdmin = await prisma.admin.findUnique({
            where: { email: adminEmail }
        })

        let admin
        if (existingAdmin) {
            logger.info(`   ⚠️  Admin with email ${adminEmail} already exists, updating...`)
            admin = await prisma.admin.update({
                where: { email: adminEmail },
                data: {
                    username: adminUsername,
                    password: hashedPassword,
                    name: "Super Administrator",
                    isActive: true
                }
            })

            await prisma.adminRole.deleteMany({
                where: { adminId: admin.id }
            })

            await prisma.adminRole.create({
                data: {
                    adminId: admin.id,
                    roleId: superAdminRole.id
                }
            })
        } else {
            admin = await prisma.admin.create({
                data: {
                    username: adminUsername,
                    password: hashedPassword,
                    name: "Super Administrator",
                    email: adminEmail,
                    isActive: true,
                    roles: {
                        create: {
                            roleId: superAdminRole.id
                        }
                    }
                }
            })
        }

        logger.info(`   ✅ Super Admin account created: ${admin.id}`)

        logger.info("\n" + "=".repeat(60))
        logger.info("🎉 Super Admin seeding completed successfully!")
        logger.info("=".repeat(60))
        logger.info("\n📋 Super Admin Credentials:")
        logger.info(`   Email    : ${adminEmail}`)
        logger.info(`   Username : ${adminUsername}`)
        logger.info(`   Password : ${adminPassword}`)
        logger.info(`   Role     : Super Admin (Full Access)`)
        logger.info("\n⚠️  IMPORTANT: Change this password after first login!")
        logger.info("=".repeat(60) + "\n")

        return {
            admin,
            role: superAdminRole,
            permissions: createdPermissions
        }

    } catch (error) {
        logger.error('❌ Error seeding Super Admin:', error)
        throw error
    }
}

module.exports = seedSuperAdmin

