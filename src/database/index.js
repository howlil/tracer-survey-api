const permissionSeed = require("./seeds/permission.seed")
const logger = require("../shared/configs/logger.config")
const facultyMajorSeed = require("./seeds/faculty-major.seed")
const superAdminSeed = require("./seeds/super-admin.seed")

class DatabaseSeeder {
    constructor(seeds = []) {
        this.seeds = seeds;
        this.logger = logger;
    }

    async seed() {
        try {
            this.logger.info("Seeding database...");

            for (const seedFn of this.seeds) {
                await seedFn(this.logger);
            }

            this.logger.info("Database seeded successfully");
        } catch (error) {
            this.logger.error("Error seeding database:", error);
            throw error;
        }
    }
}

const seeder = new DatabaseSeeder([superAdminSeed, facultyMajorSeed]);

if (require.main === module) {
    seeder.seed()
        .then(() => {
            logger.info("Seeding completed");
            process.exit(0);
        })
        .catch((error) => {
            logger.error("Seeding failed:", error);
            process.exit(1);
        });
}

module.exports = seeder;

