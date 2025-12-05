const prisma = require("../../shared/configs/prisma.config")

const facultyData = [
    {
        facultyName: "Fakultas Hukum",
        major: [
            { majorName: "Ilmu Hukum" }
        ]
    },
    {
        facultyName: "Fakultas Pertanian",
        major: [
            { majorName: "Agroteknologi" },
            { majorName: "Agribisnis" },
            { majorName: "Ilmu Tanah" },
            { majorName: "Proteksi Tanaman" },
            { majorName: "Penyuluhan Pertanian" },
            { majorName: "Agroekoteknologi (Kampus III Dharmasraya)" }
        ]
    },
    {
        facultyName: "Fakultas Kedokteran",
        major: [
            { majorName: "Kedokteran" },
            { majorName: "Psikologi" },
            { majorName: "Kebidanan" },
            { majorName: "Ilmu Biomedis" }
        ]
    },
    {
        facultyName: "Fakultas Matematika dan Ilmu Pengetahuan Alam (MIPA)",
        major: [
            { majorName: "Kimia" },
            { majorName: "Biologi" },
            { majorName: "Matematika" },
            { majorName: "Fisika" }
        ]
    },
    {
        facultyName: "Fakultas Ekonomi dan Bisnis",
        major: [
            { majorName: "Ekonomi / Ilmu Ekonomi" },
            { majorName: "Manajemen" },
            { majorName: "Akuntansi" },
            { majorName: "Ekonomi (Kampus Payakumbuh)" },
            { majorName: "Manajemen (Kampus Payakumbuh)" },
            { majorName: "Ekonomi Pembangunan" }
        ]
    },
    {
        facultyName: "Fakultas Peternakan",
        major: [
            { majorName: "Peternakan" }
        ]
    },
    {
        facultyName: "Fakultas Ilmu Budaya",
        major: [
            { majorName: "Sejarah / Ilmu Sejarah" },
            { majorName: "Sastra Indonesia" },
            { majorName: "Sastra Inggris" },
            { majorName: "Sastra Jepang" },
            { majorName: "Sastra Minangkabau" }
        ]
    },
    {
        facultyName: "Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)",
        major: [
            { majorName: "Sosiologi" },
            { majorName: "Ilmu Komunikasi" },
            { majorName: "Ilmu Politik" },
            { majorName: "Administrasi Publik / Negara" },
            { majorName: "Hubungan Internasional" },
            { majorName: "Antropologi Sosial" }
        ]
    },
    {
        facultyName: "Fakultas Teknik",
        major: [
            { majorName: "Teknik Sipil" },
            { majorName: "Teknik Mesin" },
            { majorName: "Teknik Industri" },
            { majorName: "Teknik Lingkungan" },
            { majorName: "Teknik Elektro" },
            { majorName: "Arsitektur" }
        ]
    },
    {
        facultyName: "Fakultas Farmasi",
        major: [
            { majorName: "Farmasi" }
        ]
    },
    {
        facultyName: "Fakultas Teknologi Pertanian",
        major: [
            { majorName: "Teknik Pertanian dan Biosistem" },
            { majorName: "Teknologi Pangan dan Hasil Pertanian" },
            { majorName: "Teknologi Industri Pertanian" }
        ]
    },
    {
        facultyName: "Fakultas Kesehatan Masyarakat",
        major: [
            { majorName: "Kesehatan Masyarakat" },
            { majorName: "Gizi" }
        ]
    },
    {
        facultyName: "Fakultas Keperawatan",
        major: [
            { majorName: "Ilmu Keperawatan" }
        ]
    },
    {
        facultyName: "Fakultas Kedokteran Gigi",
        major: [
            { majorName: "Kedokteran Gigi" }
        ]
    },
    {
        facultyName: "Fakultas Teknologi Informasi",
        major: [
            { majorName: "Teknik Komputer" },
            { majorName: "Sistem Informasi" },
            { majorName: "Informatika" }
        ]
    }
];

async function seedFacultyAndMajor(logger) {
    try {
        logger.info('🌱 Starting Faculty and Major seeding...');

        // Clear existing data (harus menghapus yang reference dulu)
        // Urutan: Hapus data yang mereferensikan Major dan Faculty terlebih dahulu
        
        // 1. Hapus PinAlumni yang reference ke Alumni
        await prisma.pinAlumni.deleteMany();
        
        // 2. Hapus Alumni yang reference ke Major
        await prisma.alumni.deleteMany();
        
        // 3. Hapus Major
        await prisma.major.deleteMany();
        
        // 4. Hapus Role yang reference ke faculty
        await prisma.role.updateMany({
            where: { facultyId: { not: null } },
            data: { facultyId: null }
        });
        
        // 5. Hapus SurveyRules yang reference ke faculty (hapus semua karena akan di-reseed)
        await prisma.surveyRules.deleteMany();
        
        // 6. Hapus Faculty
        await prisma.faculty.deleteMany();
        
        logger.info('✅ Cleared existing Faculty and Major data');

        let facultyCount = 0;
        let majorCount = 0;

        for (const facultyItem of facultyData) {
            logger.info(`📚 Creating Faculty: ${facultyItem.facultyName}`);

            const faculty = await prisma.faculty.create({
                data: {
                    facultyName: facultyItem.facultyName,
                }
            });

            logger.info(`✅ Created Faculty: ${faculty.facultyName} (ID: ${faculty.id})`);
            facultyCount++;

            for (const majorItem of facultyItem.major) {
                logger.info(`  📖 Creating Major: ${majorItem.majorName}`);

                const major = await prisma.major.create({
                    data: {
                        majorName: majorItem.majorName,
                        degree: 'S1',
                        facultyId: faculty.id
                    }
                });

                logger.info(`  ✅ Created Major: ${major.majorName} (ID: ${major.id})`);
                majorCount++;
            }
        }

        logger.info('🎉 Faculty and Major seeding completed successfully!');
        logger.info(`📊 Summary: ${facultyCount} Faculties, ${majorCount} Majors created`);

    } catch (error) {
        logger.error('❌ Error seeding Faculty and Major:', error)
        throw error
    }
}

module.exports = seedFacultyAndMajor;
