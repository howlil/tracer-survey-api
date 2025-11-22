const prisma = require("../../shared/configs/prisma.config")

async function seedSurvey(logger) {
    try {
        logger.info('🌱 Starting Survey seeding...')

        // Get faculties and majors for survey rules
        const faculties = await prisma.faculty.findMany()
        if (faculties.length === 0) {
            logger.warn('⚠️  No faculties found. Please run faculty-major seed first.')
            return
        }

        logger.info(`📚 Found ${faculties.length} faculties`)

        // Create Survey 1: Tracer Study for ALUMNI
        logger.info('📝 Creating Tracer Study Survey for ALUMNI...')
        const tracerStudySurvey = await prisma.survey.upsert({
            where: {
                id: 'tracer-study-alumni-2024'
            },
            update: {},
            create: {
                id: 'tracer-study-alumni-2024',
                greetingOpening: {
                    title: 'Selamat Datang di Tracer Study',
                    message: 'Terima kasih telah meluangkan waktu untuk mengisi survey tracer study ini. Data yang Anda berikan sangat penting untuk pengembangan kualitas pendidikan di universitas kami.',
                    instruction: 'Mohon isi semua pertanyaan dengan jujur dan lengkap. Survey ini memakan waktu sekitar 15-20 menit.'
                },
                greetingClosing: {
                    title: 'Terima Kasih',
                    message: 'Terima kasih atas partisipasi Anda dalam tracer study ini. Data yang Anda berikan akan sangat membantu pengembangan kualitas pendidikan.',
                    instruction: 'Jika ada pertanyaan atau masukan, silakan hubungi kami melalui email tracerstudy@university.ac.id'
                },
                description: 'Survey Tracer Study untuk Alumni - Mengumpulkan data tentang karir dan pekerjaan alumni setelah lulus',
                targetRole: 'ALUMNI',
                status: 'PUBLISHED'
            }
        })

        logger.info(`✅ Created Survey: ${tracerStudySurvey.id}`)

        // Create Survey Rules for ALUMNI survey
        logger.info('📋 Creating Survey Rules...')
        const surveyRules = []
        for (const faculty of faculties) {
            const majors = await prisma.major.findMany({
                where: { facultyId: faculty.id }
            })

            // Create rule for all majors in faculty
            surveyRules.push({
                surveyId: tracerStudySurvey.id,
                facultyId: faculty.id,
                majorId: null,
                degree: 'S1'
            })

            // Create rules for specific majors if they exist
            if (majors.length > 0) {
                for (const major of majors.slice(0, 2)) { // Limit to first 2 majors per faculty
                    surveyRules.push({
                        surveyId: tracerStudySurvey.id,
                        facultyId: faculty.id,
                        majorId: major.id,
                        degree: 'S1'
                    })
                }
            }
        }

        for (const rule of surveyRules) {
            await prisma.surveyRules.create({
                data: rule
            })
        }
        logger.info(`✅ Created ${surveyRules.length} Survey Rules`)

        // Create Code Questions
        logger.info('🔢 Creating Code Questions...')
        const codeQuestions = [
            { code: 'A', surveyId: tracerStudySurvey.id }, // Data Pribadi & Akademik
            { code: 'B', surveyId: tracerStudySurvey.id }, // Data Pekerjaan
            { code: 'C', surveyId: tracerStudySurvey.id }, // Kesesuaian Bidang Kerja
            { code: 'D', surveyId: tracerStudySurvey.id }, // Kompetensi
            { code: 'E', surveyId: tracerStudySurvey.id }  // Penilaian Pendidikan
        ]

        for (const codeQ of codeQuestions) {
            await prisma.codeQuestion.upsert({
                where: { code: codeQ.code },
                update: {},
                create: codeQ
            })
        }
        logger.info(`✅ Created ${codeQuestions.length} Code Questions`)

        // Create Group Questions
        logger.info('📦 Creating Group Questions...')
        const groupQuestionsData = [
            { groupName: 'Data Identitas dan Akademik' },
            { groupName: 'Informasi Pekerjaan' },
            { groupName: 'Kesesuaian Pekerjaan dengan Bidang Studi' },
            { groupName: 'Penilaian Kompetensi' },
            { groupName: 'Evaluasi Program Studi' },
            { groupName: 'Rekomendasi dan Saran' }
        ]

        const groupQuestions = []
        for (const groupData of groupQuestionsData) {
            const group = await prisma.groupQuestion.create({
                data: groupData
            })
            groupQuestions.push(group)
        }
        logger.info(`✅ Created ${groupQuestions.length} Group Questions`)

        // Get code questions
        const codeA = await prisma.codeQuestion.findUnique({ where: { code: 'A' } })
        const codeB = await prisma.codeQuestion.findUnique({ where: { code: 'B' } })
        const codeC = await prisma.codeQuestion.findUnique({ where: { code: 'C' } })
        const codeD = await prisma.codeQuestion.findUnique({ where: { code: 'D' } })
        const codeE = await prisma.codeQuestion.findUnique({ where: { code: 'E' } })

        // Create Questions
        logger.info('❓ Creating Questions...')

        let sortOrder = 1
        const questions = []

        // ===== GROUP 1: Data Identitas dan Akademik =====
        // Question A1: Status Pekerjaan
        const qA1 = await prisma.question.create({
            data: {
                codeId: codeA.code,
                groupQuestionId: groupQuestions[0].id,
                questionText: 'Bagaimana status pekerjaan Anda saat ini?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih salah satu',
                searchplaceholder: ''
            }
        })
        questions.push(qA1)

        const qA1Options = await createAnswerOptions(qA1.id, [
            { text: 'Bekerja (Full Time)', order: 1 },
            { text: 'Bekerja (Part Time)', order: 2 },
            { text: 'Wiraswasta', order: 3 },
            { text: 'Belum Bekerja', order: 4 },
            { text: 'Melanjutkan Pendidikan', order: 5 },
            { text: 'Lainnya', order: 6, isTriggered: true, placeholder: 'Sebutkan' }
        ])

        // Question A2: Tanggal Mulai Bekerja (conditional - if working)
        const qA2 = await prisma.question.create({
            data: {
                codeId: codeA.code,
                groupQuestionId: groupQuestions[0].id,
                parentId: qA1.id,
                questionText: 'Kapan Anda mulai bekerja?',
                questionType: 'COMBO_BOX',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Pilih bulan dan tahun',
                searchplaceholder: ''
            }
        })
        questions.push(qA2)

        // Question A3: Nama Perusahaan
        const qA3 = await prisma.question.create({
            data: {
                codeId: codeA.code,
                groupQuestionId: groupQuestions[0].id,
                parentId: qA1.id,
                questionText: 'Nama perusahaan atau instansi tempat Anda bekerja?',
                questionType: 'LONG_TEST',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Masukkan nama perusahaan/instansi',
                searchplaceholder: ''
            }
        })
        questions.push(qA3)

        // Question A4: Alamat Perusahaan
        const qA4 = await prisma.question.create({
            data: {
                codeId: codeA.code,
                groupQuestionId: groupQuestions[0].id,
                parentId: qA1.id,
                questionText: 'Alamat lengkap perusahaan/instansi tempat bekerja?',
                questionType: 'ESSAY',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Masukkan alamat lengkap',
                searchplaceholder: ''
            }
        })
        questions.push(qA4)

        // Question A5: Provinsi
        const qA5 = await prisma.question.create({
            data: {
                codeId: codeA.code,
                groupQuestionId: groupQuestions[0].id,
                parentId: qA1.id,
                questionText: 'Provinsi tempat bekerja?',
                questionType: 'COMBO_BOX',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Pilih provinsi',
                searchplaceholder: 'Cari provinsi'
            }
        })
        questions.push(qA5)

        // Create QuestionTree: If "Bekerja" selected in A1, show A2, A3, A4, A5
        const workingOptions = qA1Options.filter(opt =>
            opt.answerText.includes('Bekerja') || opt.answerText === 'Wiraswasta'
        )
        for (const workingOption of workingOptions) {
            for (const childQ of [qA2, qA3, qA4, qA5]) {
                await prisma.questionTree.create({
                    data: {
                        questionTriggerId: qA1.id,
                        answerQuestionTriggerId: workingOption.id,
                        questionPointerToId: childQ.id
                    }
                })
            }
        }

        // ===== GROUP 2: Informasi Pekerjaan =====
        // Question B1: Jabatan
        const qB1 = await prisma.question.create({
            data: {
                codeId: codeB.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Jabatan atau posisi Anda saat ini?',
                questionType: 'LONG_TEST',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Contoh: Software Engineer, Marketing Manager, dll',
                searchplaceholder: ''
            }
        })
        questions.push(qB1)

        // Question B2: Bidang Pekerjaan
        const qB2 = await prisma.question.create({
            data: {
                codeId: codeB.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Bidang pekerjaan/perusahaan Anda termasuk ke dalam kategori?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih salah satu',
                searchplaceholder: ''
            }
        })
        questions.push(qB2)

        const qB2Options = await createAnswerOptions(qB2.id, [
            { text: 'Pemerintahan/PNS', order: 1 },
            { text: 'Swasta Nasional', order: 2 },
            { text: 'Swasta Multinasional', order: 3 },
            { text: 'BUMN', order: 4 },
            { text: 'Lembaga Non Profit', order: 5 },
            { text: 'Lainnya', order: 6, isTriggered: true, placeholder: 'Sebutkan' }
        ])

        // Question B3: Gaji
        const qB3 = await prisma.question.create({
            data: {
                codeId: codeB.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Berapa gaji/penghasilan utama Anda per bulan?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih range gaji',
                searchplaceholder: ''
            }
        })
        questions.push(qB3)

        await createAnswerOptions(qB3.id, [
            { text: 'Kurang dari Rp 2.000.000', order: 1 },
            { text: 'Rp 2.000.000 - Rp 4.000.000', order: 2 },
            { text: 'Rp 4.000.000 - Rp 6.000.000', order: 3 },
            { text: 'Rp 6.000.000 - Rp 8.000.000', order: 4 },
            { text: 'Rp 8.000.000 - Rp 10.000.000', order: 5 },
            { text: 'Rp 10.000.000 - Rp 15.000.000', order: 6 },
            { text: 'Lebih dari Rp 15.000.000', order: 7 }
        ])

        // Question B4: Cara Mendapatkan Pekerjaan
        const qB4 = await prisma.question.create({
            data: {
                codeId: codeB.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Bagaimana cara Anda mendapatkan pekerjaan pertama setelah lulus?',
                questionType: 'MULTIPLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih semua yang sesuai',
                searchplaceholder: ''
            }
        })
        questions.push(qB4)

        await createAnswerOptions(qB4.id, [
            { text: 'Melamar melalui iklan lowongan', order: 1 },
            { text: 'Melamar tanpa iklan lowongan', order: 2 },
            { text: 'Melalui hubungan keluarga/teman', order: 3 },
            { text: 'Melalui perusahaan tempat magang/KP', order: 4 },
            { text: 'Melalui alumni', order: 5 },
            { text: 'Melalui kampus/perguruan tinggi', order: 6 },
            { text: 'Membangun usaha sendiri/wiraswasta', order: 7 },
            { text: 'Lainnya', order: 8, isTriggered: true, placeholder: 'Sebutkan' }
        ])

        // Question B5: Waktu Tunggu Mendapatkan Pekerjaan
        const qB5 = await prisma.question.create({
            data: {
                codeId: codeB.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Berapa lama waktu yang Anda butuhkan untuk mendapatkan pekerjaan pertama setelah lulus?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih salah satu',
                searchplaceholder: ''
            }
        })
        questions.push(qB5)

        await createAnswerOptions(qB5.id, [
            { text: 'Sebelum lulus', order: 1 },
            { text: '0-3 bulan', order: 2 },
            { text: '4-6 bulan', order: 3 },
            { text: '7-12 bulan', order: 4 },
            { text: 'Lebih dari 12 bulan', order: 5 },
            { text: 'Saya belum bekerja', order: 6 }
        ])

        // ===== GROUP 3: Kesesuaian Pekerjaan dengan Bidang Studi =====
        // Question C1: Kesesuaian Bidang
        const qC1 = await prisma.question.create({
            data: {
                codeId: codeC.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Seberapa besar pekerjaan Anda saat ini sesuai dengan bidang studi yang Anda pelajari di perguruan tinggi?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih tingkat kesesuaian',
                searchplaceholder: ''
            }
        })
        questions.push(qC1)

        await createAnswerOptions(qC1.id, [
            { text: 'Sangat Sesuai', order: 1 },
            { text: 'Sesuai', order: 2 },
            { text: 'Kurang Sesuai', order: 3 },
            { text: 'Tidak Sesuai', order: 4 }
        ])

        // Question C2: Alasan Tidak Sesuai (conditional)
        const qC2 = await prisma.question.create({
            data: {
                codeId: codeC.code,
                groupQuestionId: groupQuestions[2].id,
                parentId: qC1.id,
                questionText: 'Apa alasan utama pekerjaan Anda tidak sesuai dengan bidang studi?',
                questionType: 'MULTIPLE_CHOICE',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Pilih semua yang sesuai',
                searchplaceholder: ''
            }
        })
        questions.push(qC2)

        const qC2Options = await createAnswerOptions(qC2.id, [
            { text: 'Tidak ada lowongan di bidang yang sesuai', order: 1 },
            { text: 'Gaji lebih baik di bidang ini', order: 2 },
            { text: 'Lebih tertarik di bidang ini', order: 3 },
            { text: 'Kualifikasi yang diminta lebih tinggi', order: 4 },
            { text: 'Lainnya', order: 5, isTriggered: true, placeholder: 'Sebutkan' }
        ])

        // Create QuestionTree for C2
        const notSuitableOptions = await prisma.answerOptionQuestion.findMany({
            where: {
                questionId: qC1.id,
                answerText: { in: ['Kurang Sesuai', 'Tidak Sesuai'] }
            }
        })
        for (const option of notSuitableOptions) {
            await prisma.questionTree.create({
                data: {
                    questionTriggerId: qC1.id,
                    answerQuestionTriggerId: option.id,
                    questionPointerToId: qC2.id
                }
            })
        }

        // ===== GROUP 4: Penilaian Kompetensi =====
        // Question D1: Penilaian Kompetensi (Matrix)
        const qD1 = await prisma.question.create({
            data: {
                codeId: codeD.code,
                groupQuestionId: groupQuestions[3].id,
                questionText: 'Seberapa besar tingkat kompetensi yang Anda kuasai sekarang?',
                questionType: 'MATRIX_SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih tingkat kompetensi untuk setiap item',
                searchplaceholder: ''
            }
        })
        questions.push(qD1)

        await createAnswerOptions(qD1.id, [
            { text: 'Sangat Tinggi', order: 1 },
            { text: 'Tinggi', order: 2 },
            { text: 'Sedang', order: 3 },
            { text: 'Rendah', order: 4 },
            { text: 'Sangat Rendah', order: 5 }
        ])

        // Question D2: Sub-items untuk matrix (parent-child relationship)
        const matrixItems = [
            'Pengetahuan di bidang ilmu',
            'Keahlian di bidang tertentu',
            'Komunikasi verbal',
            'Komunikasi tertulis',
            'Bekerja dalam tim',
            'Kepemimpinan',
            'Pengambilan keputusan',
            'Pemecahan masalah',
            'Bahasa Inggris',
            'Penggunaan teknologi informasi'
        ]

        for (let i = 0; i < matrixItems.length; i++) {
            await prisma.question.create({
                data: {
                    codeId: codeD.code,
                    groupQuestionId: groupQuestions[3].id,
                    parentId: qD1.id,
                    questionText: matrixItems[i],
                    questionType: 'SINGLE_CHOICE',
                    isRequired: true,
                    sortOrder: sortOrder++,
                    placeholder: 'Pilih tingkat kompetensi',
                    searchplaceholder: ''
                }
            })
        }

        // ===== GROUP 5: Evaluasi Program Studi =====
        // Question E1: Relevansi Kurikulum
        const qE1 = await prisma.question.create({
            data: {
                codeId: codeE.code,
                groupQuestionId: groupQuestions[4].id,
                questionText: 'Seberapa relevan kurikulum yang Anda pelajari dengan kebutuhan dunia kerja?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih tingkat relevansi',
                searchplaceholder: ''
            }
        })
        questions.push(qE1)

        await createAnswerOptions(qE1.id, [
            { text: 'Sangat Relevan', order: 1 },
            { text: 'Relevan', order: 2 },
            { text: 'Kurang Relevan', order: 3 },
            { text: 'Tidak Relevan', order: 4 }
        ])

        // Question E2: Mata Kuliah Paling Bermanfaat
        const qE2 = await prisma.question.create({
            data: {
                codeId: codeE.code,
                groupQuestionId: groupQuestions[4].id,
                questionText: 'Mata kuliah apa yang paling bermanfaat untuk pekerjaan Anda saat ini?',
                questionType: 'MULTIPLE_CHOICE',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Pilih semua yang sesuai',
                searchplaceholder: 'Cari mata kuliah'
            }
        })
        questions.push(qE2)

        await createAnswerOptions(qE2.id, [
            { text: 'Mata kuliah teori dasar', order: 1 },
            { text: 'Mata kuliah praktikum/lab', order: 2 },
            { text: 'Mata kuliah yang relevan dengan pekerjaan', order: 3 },
            { text: 'Mata kuliah soft skills', order: 4 },
            { text: 'Mata kuliah magang/KP', order: 5 },
            { text: 'Lainnya', order: 6, isTriggered: true, placeholder: 'Sebutkan' }
        ])

        // Question E3: Kualitas Pengajaran
        const qE3 = await prisma.question.create({
            data: {
                codeId: codeE.code,
                groupQuestionId: groupQuestions[4].id,
                questionText: 'Bagaimana penilaian Anda terhadap kualitas pengajaran di program studi Anda?',
                questionType: 'MATRIX_SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Beri penilaian untuk setiap aspek',
                searchplaceholder: ''
            }
        })
        questions.push(qE3)

        const qualityOptions = await createAnswerOptions(qE3.id, [
            { text: 'Sangat Baik', order: 1 },
            { text: 'Baik', order: 2 },
            { text: 'Cukup', order: 3 },
            { text: 'Kurang', order: 4 }
        ])

        const qualityAspects = [
            'Kualitas dosen pengajar',
            'Metode pengajaran',
            'Fasilitas laboratorium/praktikum',
            'Perpustakaan',
            'Akses ke internet',
            'Sarana olahraga',
            'Sarana kesehatan'
        ]

        for (const aspect of qualityAspects) {
            const aspectQ = await prisma.question.create({
                data: {
                    codeId: codeE.code,
                    groupQuestionId: groupQuestions[4].id,
                    parentId: qE3.id,
                    questionText: aspect,
                    questionType: 'SINGLE_CHOICE',
                    isRequired: true,
                    sortOrder: sortOrder++,
                    placeholder: 'Pilih penilaian',
                    searchplaceholder: ''
                }
            })

            // Link same options to parent
            for (const opt of qualityOptions) {
                await prisma.answerOptionQuestion.create({
                    data: {
                        questionId: aspectQ.id,
                        answerText: opt.answerText,
                        sortOrder: opt.sortOrder,
                        isTriggered: opt.isTriggered || false,
                        otherOptionPlaceholder: opt.otherOptionPlaceholder
                    }
                })
            }
        }

        // ===== GROUP 6: Rekomendasi dan Saran =====
        // Question F1: Rekomendasi untuk Alumni Lain
        const qF1 = await prisma.question.create({
            data: {
                codeId: codeE.code,
                groupQuestionId: groupQuestions[5].id,
                questionText: 'Apakah Anda akan merekomendasikan program studi Anda kepada calon mahasiswa baru?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih salah satu',
                searchplaceholder: ''
            }
        })
        questions.push(qF1)

        await createAnswerOptions(qF1.id, [
            { text: 'Sangat Merekomendasikan', order: 1 },
            { text: 'Merekomendasikan', order: 2 },
            { text: 'Kurang Merekomendasikan', order: 3 },
            { text: 'Tidak Merekomendasikan', order: 4 }
        ])

        // Question F2: Saran untuk Peningkatan
        const qF2 = await prisma.question.create({
            data: {
                codeId: codeE.code,
                groupQuestionId: groupQuestions[5].id,
                questionText: 'Apa saran Anda untuk meningkatkan kualitas program studi?',
                questionType: 'ESSAY',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Tuliskan saran Anda di sini...',
                searchplaceholder: ''
            }
        })
        questions.push(qF2)

        logger.info(`✅ Created ${questions.length} Questions`)

        // Create Survey 2: User Survey for MANAGER
        logger.info('📝 Creating User Survey for MANAGER...')
        const managerSurvey = await prisma.survey.upsert({
            where: {
                id: 'user-survey-manager-2024'
            },
            update: {},
            create: {
                id: 'user-survey-manager-2024',
                greetingOpening: {
                    title: 'Selamat Datang di User Survey',
                    message: 'Terima kasih telah meluangkan waktu untuk mengisi survey tentang kualitas lulusan universitas kami.',
                    instruction: 'Survey ini bertujuan untuk mendapatkan feedback dari pemberi kerja tentang kualitas alumni yang bekerja di tempat Anda.'
                },
                greetingClosing: {
                    title: 'Terima Kasih',
                    message: 'Terima kasih atas partisipasi Anda. Feedback Anda sangat berharga untuk pengembangan kualitas pendidikan.',
                    instruction: 'Jika ada pertanyaan, silakan hubungi kami melalui email tracerstudy@university.ac.id'
                },
                description: 'Survey untuk Manager - Mengumpulkan feedback dari pemberi kerja tentang kualitas alumni',
                targetRole: 'MANAGER',
                status: 'PUBLISHED'
            }
        })

        logger.info(`✅ Created Survey: ${managerSurvey.id}`)

        // Create Code Questions for Manager Survey
        const managerCodes = [
            { code: 'M1', surveyId: managerSurvey.id }, // Informasi Perusahaan
            { code: 'M2', surveyId: managerSurvey.id }, // Penilaian Alumni
            { code: 'M3', surveyId: managerSurvey.id }  // Rekomendasi
        ]

        for (const codeQ of managerCodes) {
            await prisma.codeQuestion.upsert({
                where: { code: codeQ.code },
                update: {},
                create: codeQ
            })
        }

        // Create Group Questions for Manager
        const managerGroups = [
            { groupName: 'Informasi Perusahaan dan Alumni' },
            { groupName: 'Penilaian Kualitas Alumni' },
            { groupName: 'Rekomendasi dan Harapan' }
        ]

        const managerGroupQuestions = []
        for (const groupData of managerGroups) {
            const group = await prisma.groupQuestion.create({
                data: groupData
            })
            managerGroupQuestions.push(group)
        }

        // Get manager code questions
        const codeM1 = await prisma.codeQuestion.findUnique({ where: { code: 'M1' } })
        const codeM2 = await prisma.codeQuestion.findUnique({ where: { code: 'M2' } })
        const codeM3 = await prisma.codeQuestion.findUnique({ where: { code: 'M3' } })

        sortOrder = 1
        // Manager Questions
        const mQ1 = await prisma.question.create({
            data: {
                codeId: codeM1.code,
                groupQuestionId: managerGroupQuestions[0].id,
                questionText: 'Berapa jumlah alumni dari universitas kami yang bekerja di perusahaan Anda?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih jumlah',
                searchplaceholder: ''
            }
        })

        await createAnswerOptions(mQ1.id, [
            { text: '1-5 orang', order: 1 },
            { text: '6-10 orang', order: 2 },
            { text: '11-20 orang', order: 3 },
            { text: 'Lebih dari 20 orang', order: 4 }
        ])

        const mQ2 = await prisma.question.create({
            data: {
                codeId: codeM2.code,
                groupQuestionId: managerGroupQuestions[1].id,
                questionText: 'Bagaimana penilaian Anda terhadap kompetensi alumni dalam bekerja?',
                questionType: 'MATRIX_SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Beri penilaian untuk setiap aspek',
                searchplaceholder: ''
            }
        })

        const managerRatingOptions = await createAnswerOptions(mQ2.id, [
            { text: 'Sangat Baik', order: 1 },
            { text: 'Baik', order: 2 },
            { text: 'Cukup', order: 3 },
            { text: 'Kurang', order: 4 }
        ])

        const managerAspects = [
            'Pengetahuan teknis',
            'Kemampuan komunikasi',
            'Kerja sama tim',
            'Inisiatif dan kreativitas',
            'Etos kerja',
            'Kepemimpinan'
        ]

        for (const aspect of managerAspects) {
            const aspectQ = await prisma.question.create({
                data: {
                    codeId: codeM2.code,
                    groupQuestionId: managerGroupQuestions[1].id,
                    parentId: mQ2.id,
                    questionText: aspect,
                    questionType: 'SINGLE_CHOICE',
                    isRequired: true,
                    sortOrder: sortOrder++,
                    placeholder: 'Pilih penilaian',
                    searchplaceholder: ''
                }
            })

            for (const opt of managerRatingOptions) {
                await prisma.answerOptionQuestion.create({
                    data: {
                        questionId: aspectQ.id,
                        answerText: opt.answerText,
                        sortOrder: opt.sortOrder
                    }
                })
            }
        }

        const mQ3 = await prisma.question.create({
            data: {
                codeId: codeM3.code,
                groupQuestionId: managerGroupQuestions[2].id,
                questionText: 'Apakah Anda bersedia merekrut alumni dari universitas kami di masa depan?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih salah satu',
                searchplaceholder: ''
            }
        })

        await createAnswerOptions(mQ3.id, [
            { text: 'Ya, sangat bersedia', order: 1 },
            { text: 'Ya', order: 2 },
            { text: 'Mungkin', order: 3 },
            { text: 'Tidak', order: 4 }
        ])

        const mQ4 = await prisma.question.create({
            data: {
                codeId: codeM3.code,
                groupQuestionId: managerGroupQuestions[2].id,
                questionText: 'Apa saran Anda untuk meningkatkan kualitas lulusan universitas kami?',
                questionType: 'ESSAY',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Tuliskan saran Anda...',
                searchplaceholder: ''
            }
        })

        logger.info('✅ Created Manager Survey Questions')

        logger.info('🎉 Survey seeding completed successfully!')
        logger.info(`📊 Summary:`)
        logger.info(`   - ${await prisma.survey.count()} Surveys`)
        logger.info(`   - ${await prisma.codeQuestion.count()} Code Questions`)
        logger.info(`   - ${await prisma.groupQuestion.count()} Group Questions`)
        logger.info(`   - ${await prisma.question.count()} Questions`)
        logger.info(`   - ${await prisma.answerOptionQuestion.count()} Answer Options`)
        logger.info(`   - ${await prisma.questionTree.count()} Question Trees`)

    } catch (error) {
        logger.error('❌ Error seeding Survey:', error)
        throw error
    }
}

async function createAnswerOptions(questionId, options) {
    const createdOptions = []
    for (const option of options) {
        const opt = await prisma.answerOptionQuestion.create({
            data: {
                questionId: questionId,
                answerText: option.text,
                sortOrder: option.order,
                isTriggered: option.isTriggered || false,
                otherOptionPlaceholder: option.placeholder || null
            }
        })
        createdOptions.push(opt)
    }
    return createdOptions
}

module.exports = seedSurvey

