const logger = require("../shared/configs/logger.config")
const prisma = require("../shared/configs/prisma.config")
const permissionSeed = require("./seeds/permission.seed")
const facultyMajorSeed = require("./seeds/faculty-major.seed")
const superAdminSeed = require("./seeds/super-admin.seed")
const surveySeed = require("./seeds/survey.seed")

class DatabaseSeeder {
    constructor(seeds = []) {
        this.seeds = seeds
        this.logger = logger
    }

    async seed() {
        try {
            this.logger.info('🌱 Starting Database Seeding...')
            this.logger.info(`📦 Total seeders to run: ${this.seeds.length}`)

            for (let i = 0; i < this.seeds.length; i++) {
                const seedFn = this.seeds[i]
                this.logger.info(`\n[${i + 1}/${this.seeds.length}] Running seeder...`)
                await seedFn(this.logger)
            }

            this.logger.info('\n🎉 Database seeded successfully!')

        } catch (error) {
            this.logger.error('❌ Error seeding database:', error)
            throw error
        } finally {
            await prisma.$disconnect()
            this.logger.info('🔌 Database connection closed')
        }
    }
}

// Semua seeder dalam urutan yang benar:
// 1. Permission (harus pertama untuk super admin)
// 2. Faculty & Major (harus sebelum survey rules)
// 3. Super Admin (membutuhkan permission dan role)
// 4. Survey (membutuhkan faculty dan major untuk survey rules)
const seeder = new DatabaseSeeder([
    // permissionSeed,
    // facultyMajorSeed,
    // superAdminSeed,
    surveySeed
])

if (require.main === module) {
    seeder.seed()
        .then(() => {
            logger.info('✅ All seeding completed')
            process.exit(0)
        })
        .catch((error) => {
            logger.error('❌ Seeding failed:', error)
            process.exit(1)
        })
}

module.exports = seeder

