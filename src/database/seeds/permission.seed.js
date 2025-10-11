const prisma = require("../../shared/configs/prisma.config")
const PermissionUtil = require("../../shared/utils/permission.util")

async function seedPersmission(logger) {
    try {
        logger.info("'🌱 Starting permission seeding...'")

        const permissions = PermissionUtil.generatePermision()

        logger.info(`📝 Found ${permissions.length} permissions to seed`)

        let created = 0;
        let existing = 0;

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

            if (result.createdAt.getTime() === result.updatedAt.getTime()) {
                created++;
            } else {
                existing++;
            }

        }
        logger.info(`✅ Seeding completed!`);

    } catch (error) {
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

module.exports = seedPersmission 


