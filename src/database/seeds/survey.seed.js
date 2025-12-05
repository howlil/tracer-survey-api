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

        // Use fixed UUIDs for surveys to ensure consistency across seed runs
        // Tracer Study Survey UUID
        const tracerStudySurveyId = '550e8400-e29b-41d4-a716-446655440001'
        logger.info(`📝 Using UUID for Tracer Study Survey: ${tracerStudySurveyId}`)

        // Create Survey 1: Tracer Study for ALUMNI
        logger.info('📝 Creating Tracer Study Survey for ALUMNI...')
        const tracerStudySurvey = await prisma.survey.upsert({
            where: {
                id: tracerStudySurveyId
            },
            update: {},
            create: {
                id: tracerStudySurveyId,
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

        // Delete existing survey rules for this survey
        await prisma.surveyRules.deleteMany({
            where: { surveyId: tracerStudySurvey.id }
        })

        // Create Survey Rules for ALUMNI survey
        logger.info('📋 Creating Survey Rules...')
        const surveyRules = []
        // Create rule for S1 degree (applies to all faculties and majors)
        surveyRules.push({
            surveyId: tracerStudySurvey.id,
            degree: 'S1'
        })

        for (const rule of surveyRules) {
            await prisma.surveyRules.upsert({
                where: {
                    surveyId_degree: {
                        surveyId: rule.surveyId,
                        degree: rule.degree
                    }
                },
                update: {},
                create: rule
            })
        }
        logger.info(`✅ Created ${surveyRules.length} Survey Rules`)

        // Delete existing code questions and questions for this survey first
        logger.info('🗑️  Cleaning up existing Code Questions and Questions...')
        
        // Get all code questions for this survey
        const existingCodeQuestions = await prisma.codeQuestion.findMany({
            where: { surveyId: tracerStudySurvey.id },
            select: { code: true }
        })
        
        const codeIds = existingCodeQuestions.map(cq => cq.code)
        
        // Get all questions that use these codeIds (including any duplicates)
        const allQuestions = codeIds.length > 0 
            ? await prisma.question.findMany({
                where: { codeId: { in: codeIds } },
                select: { id: true }
            })
            : []
        
        const allQuestionIds = allQuestions.map(q => q.id)
        
        if (allQuestionIds.length > 0) {
            // Delete in correct order to avoid foreign key constraint violations
            // 1. Delete QuestionTree (references Question via questionTriggerId and questionPointerToId)
            await prisma.questionTree.deleteMany({
                where: {
                    OR: [
                        { questionTriggerId: { in: allQuestionIds } },
                        { questionPointerToId: { in: allQuestionIds } }
                    ]
                }
            })
            
            // 2. Delete AnswerMultipleChoice (references Question)
            await prisma.answerMultipleChoice.deleteMany({
                where: { questionId: { in: allQuestionIds } }
            })
            
            // 3. Delete Answer (references Question)
            await prisma.answer.deleteMany({
                where: { questionId: { in: allQuestionIds } }
            })
            
            // 4. Delete AnswerOptionQuestion (references Question)
            await prisma.answerOptionQuestion.deleteMany({
                where: { questionId: { in: allQuestionIds } }
            })
            
            // 5. Delete Questions (children first, then parents)
            // Delete children questions first (those with parentId)
            await prisma.question.deleteMany({
                where: {
                    id: { in: allQuestionIds },
                    parentId: { not: null }
                }
            })
            
            // Then delete parent questions
            await prisma.question.deleteMany({
                where: {
                    id: { in: allQuestionIds },
                    parentId: null
                }
            })
        }
        
        // Delete code questions (this will also ensure no orphaned code questions)
        await prisma.codeQuestion.deleteMany({
            where: { surveyId: tracerStudySurvey.id }
        })
        logger.info('✅ Cleaned up existing data')

        // Helper function to create CodeQuestion for each question
        // Format: {questionCode} (e.g., A1, A2, B1, B2) - version is stored separately
        // Since code is @id (primary key), we need to make it unique per survey
        // Format: {questionCode}-{surveyId} to ensure uniqueness
        const createCodeQuestion = async (questionCode, surveyId) => {
            // Use survey ID to make code unique per survey
            // The questionCode part (A1, A2, etc.) is the actual code, version is in survey
            const code = `${questionCode}-${surveyId}`
            return await prisma.codeQuestion.upsert({
                where: { code },
                update: {},
                create: {
                    code,
                    surveyId
                }
            })
        }

        // Create Group Questions based on mock data structure
        logger.info('📦 Creating Group Questions...')
        const groupQuestionsData = [
            { groupName: 'Data Pribadi' },
            { groupName: 'Informasi Kontak' },
            { groupName: 'Status Kerja' },
            { groupName: 'Penilaian Kompetensi' },
            { groupName: 'Kepuasan Pendidikan' },
            { groupName: 'Saran dan Harapan' }
        ]

        const groupQuestions = []
        for (const groupData of groupQuestionsData) {
            const group = await prisma.groupQuestion.create({
                data: groupData
            })
            groupQuestions.push(group)
        }
        logger.info(`✅ Created ${groupQuestions.length} Group Questions`)

        // Create Questions based on mock data
        logger.info('❓ Creating Questions...')

        let sortOrder = 1
        const questions = []

        // ===== PAGE 1: Data Pribadi =====
        const pageNumber1 = 1
        // Question A1: Nama Lengkap
        const codeA1 = await createCodeQuestion('A1', tracerStudySurvey.id)
        const qA1 = await prisma.question.create({
            data: {
                codeId: codeA1.code,
                groupQuestionId: groupQuestions[0].id,
                questionText: 'Nama Lengkap',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Masukkan nama lengkap sesuai ijazah',
                searchplaceholder: '',
                pageNumber: pageNumber1
            }
        })
        questions.push(qA1)

        // Question A2: NIM
        const codeA2 = await createCodeQuestion('A2', tracerStudySurvey.id)
        const qA2 = await prisma.question.create({
            data: {
                codeId: codeA2.code,
                groupQuestionId: groupQuestions[0].id,
                questionText: 'NIM (Nomor Induk Mahasiswa)',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Masukkan NIM Anda',
                searchplaceholder: '',
                pageNumber: pageNumber1
            }
        })
        questions.push(qA2)

        // Question A3: Program Studi
        const codeA3 = await createCodeQuestion('A3', tracerStudySurvey.id)
        const qA3 = await prisma.question.create({
            data: {
                codeId: codeA3.code,
                groupQuestionId: groupQuestions[0].id,
                questionText: 'Program Studi',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Masukkan program studi Anda',
                searchplaceholder: '',
                pageNumber: pageNumber1
            }
        })
        questions.push(qA3)

        // Question A4: Tahun Lulus
        const codeA4 = await createCodeQuestion('A4', tracerStudySurvey.id)
        const qA4 = await prisma.question.create({
            data: {
                codeId: codeA4.code,
                groupQuestionId: groupQuestions[0].id,
                questionText: 'Tahun Lulus',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Contoh: 2023',
                searchplaceholder: '',
                pageNumber: pageNumber1
            }
        })
        questions.push(qA4)

        // Question A5: Jenis Kelamin
        const codeA5 = await createCodeQuestion('A5', tracerStudySurvey.id)
        const qA5 = await prisma.question.create({
            data: {
                codeId: codeA5.code,
                groupQuestionId: groupQuestions[0].id,
                questionText: 'Jenis Kelamin',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih jenis kelamin',
                searchplaceholder: '',
                pageNumber: pageNumber1
            }
        })
        questions.push(qA5)

        await createAnswerOptions(qA5.id, [
            { text: 'Laki-laki', order: 1 },
            { text: 'Perempuan', order: 2 }
        ])

        // ===== PAGE 2: Informasi Kontak =====
        const pageNumber2 = 2
        // Question B1: Email
        const codeB1 = await createCodeQuestion('B1', tracerStudySurvey.id)
        const qB1 = await prisma.question.create({
            data: {
                codeId: codeB1.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Alamat Email',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'contoh@email.com',
                searchplaceholder: '',
                pageNumber: pageNumber2
            }
        })
        questions.push(qB1)

        // Question B2: Telepon
        const codeB2 = await createCodeQuestion('B2', tracerStudySurvey.id)
        const qB2 = await prisma.question.create({
            data: {
                codeId: codeB2.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Nomor Telepon/WhatsApp',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: '08xxxxxxxxxx',
                searchplaceholder: '',
                pageNumber: pageNumber2
            }
        })
        questions.push(qB2)

        // Question B3: Alamat Tinggal
        const codeB3 = await createCodeQuestion('B3', tracerStudySurvey.id)
        const qB3 = await prisma.question.create({
            data: {
                codeId: codeB3.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Alamat Tempat Tinggal Saat Ini',
                questionType: 'LONG_TEST',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Masukkan alamat lengkap tempat tinggal',
                searchplaceholder: '',
                pageNumber: pageNumber2
            }
        })
        questions.push(qB3)

        // Question B4: Provinsi
        const codeB4 = await createCodeQuestion('B4', tracerStudySurvey.id)
        const qB4 = await prisma.question.create({
            data: {
                codeId: codeB4.code,
                groupQuestionId: groupQuestions[1].id,
                questionText: 'Provinsi',
                questionType: 'COMBO_BOX',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih provinsi tempat tinggal',
                searchplaceholder: 'Cari provinsi...',
                pageNumber: pageNumber2
            }
        })
        questions.push(qB4)

        // Provinsi options
        const provinsiOptions = [
            'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau',
            'Jambi', 'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung',
            'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
            'Banten', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
            'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
            'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
            'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat'
        ]
        await createAnswerOptions(qB4.id, provinsiOptions.map((p, i) => ({ text: p, order: i + 1 })))

        // ===== PAGE 3: Status Kerja =====
        const pageNumber3 = 3
        // Question C1: Status Kerja
        const codeC1 = await createCodeQuestion('C1', tracerStudySurvey.id)
        const qC1 = await prisma.question.create({
            data: {
                codeId: codeC1.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Status Kerja Saat Ini',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih status kerja',
                searchplaceholder: '',
                pageNumber: pageNumber3
            }
        })
        questions.push(qC1)

        const qC1Options = await createAnswerOptions(qC1.id, [
            { text: 'Bekerja (Full Time)', order: 1, isTriggered: true },
            { text: 'Bekerja (Part Time)', order: 2, isTriggered: true },
            { text: 'Wiraswasta', order: 3, isTriggered: true },
            { text: 'Tidak Bekerja', order: 4, isTriggered: true },
            { text: 'Melanjutkan Studi', order: 5, isTriggered: true },
            { text: 'Lainnya', order: 6, isTriggered: true, placeholder: 'Sebutkan status lainnya...' }
        ])

        // Question C2: Bidang Kerja/Usaha
        const codeC2 = await createCodeQuestion('C2', tracerStudySurvey.id)
        const qC2 = await prisma.question.create({
            data: {
                codeId: codeC2.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Bidang Kerja/Usaha',
                questionType: 'ESSAY',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Contoh: Teknologi Informasi, Pendidikan, dll',
                searchplaceholder: '',
                pageNumber: pageNumber3
            }
        })
        questions.push(qC2)

        // Question C3: Nama Perusahaan/Instansi (Conditional - appears when "Bekerja" is selected)
        const codeC3 = await createCodeQuestion('C3', tracerStudySurvey.id)
        const qC3 = await prisma.question.create({
            data: {
                codeId: codeC3.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Nama Perusahaan/Instansi',
                questionType: 'ESSAY',
                isRequired: true, // Changed to required for manager generation
                sortOrder: sortOrder++,
                placeholder: 'Masukkan nama perusahaan atau instansi',
                searchplaceholder: '',
                pageNumber: pageNumber3
            }
        })
        questions.push(qC3)

        // Question C4: Jabatan/Posisi
        const codeC4 = await createCodeQuestion('C4', tracerStudySurvey.id)
        const qC4 = await prisma.question.create({
            data: {
                codeId: codeC4.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Jabatan/Posisi',
                questionType: 'ESSAY',
                isRequired: true, // Changed to required for manager generation
                sortOrder: sortOrder++,
                placeholder: 'Masukkan jabatan atau posisi Anda',
                searchplaceholder: '',
                pageNumber: pageNumber3
            }
        })
        questions.push(qC4)

        // Question C5: Nama Atasan/Manager (Conditional - appears when "Bekerja" is selected)
        const codeC5 = await createCodeQuestion('C5', tracerStudySurvey.id)
        const qC5 = await prisma.question.create({
            data: {
                codeId: codeC5.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Nama Atasan/Manager',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Masukkan nama lengkap atasan atau manager Anda',
                searchplaceholder: '',
                pageNumber: pageNumber3
            }
        })
        questions.push(qC5)

        // Question C6: Email Atasan/Manager (Conditional - appears when "Bekerja" is selected)
        const codeC6 = await createCodeQuestion('C6', tracerStudySurvey.id)
        const qC6 = await prisma.question.create({
            data: {
                codeId: codeC6.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Email Atasan/Manager',
                questionType: 'ESSAY',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'contoh@email.com',
                searchplaceholder: '',
                pageNumber: pageNumber3
            }
        })
        questions.push(qC6)

        // Question C7: Nomor Telepon Atasan/Manager (Conditional - appears when "Bekerja" is selected)
        const codeC7 = await createCodeQuestion('C7', tracerStudySurvey.id)
        const qC7 = await prisma.question.create({
            data: {
                codeId: codeC7.code,
                groupQuestionId: groupQuestions[2].id,
                questionText: 'Nomor Telepon Atasan/Manager',
                questionType: 'ESSAY',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: '08xxxxxxxxxx',
                searchplaceholder: '',
                pageNumber: pageNumber3
            }
        })
        questions.push(qC7)

        // Create QuestionTree for conditional questions
        // These questions (C5, C6, C7) will appear when user selects "Bekerja (Full Time)", "Bekerja (Part Time)", or "Wiraswasta"
        logger.info('🌳 Creating QuestionTree for conditional manager questions...')
        
        // Get answer options for C1 (Status Kerja)
        const c1AnswerOptions = await prisma.answerOptionQuestion.findMany({
            where: { questionId: qC1.id },
            orderBy: { sortOrder: 'asc' }
        })

        // Find the answer options for "Bekerja" status
        const bekerjaFullTimeOption = c1AnswerOptions.find(opt => opt.answerText === 'Bekerja (Full Time)')
        const bekerjaPartTimeOption = c1AnswerOptions.find(opt => opt.answerText === 'Bekerja (Part Time)')
        const wiraswastaOption = c1AnswerOptions.find(opt => opt.answerText === 'Wiraswasta')

        // Create QuestionTree entries for each "Bekerja" option to show C3, C4, C5, C6, C7
        // C3 (Perusahaan) and C4 (Posisi) are also conditional for manager data
        const questionTreeEntries = []
        
        if (bekerjaFullTimeOption) {
            // C3: Nama Perusahaan/Instansi
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaFullTimeOption.id,
                questionPointerToId: qC3.id
            })
            // C4: Jabatan/Posisi
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaFullTimeOption.id,
                questionPointerToId: qC4.id
            })
            // C5: Nama Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaFullTimeOption.id,
                questionPointerToId: qC5.id
            })
            // C6: Email Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaFullTimeOption.id,
                questionPointerToId: qC6.id
            })
            // C7: Nomor Telepon Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaFullTimeOption.id,
                questionPointerToId: qC7.id
            })
        }

        if (bekerjaPartTimeOption) {
            // C3: Nama Perusahaan/Instansi
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaPartTimeOption.id,
                questionPointerToId: qC3.id
            })
            // C4: Jabatan/Posisi
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaPartTimeOption.id,
                questionPointerToId: qC4.id
            })
            // C5: Nama Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaPartTimeOption.id,
                questionPointerToId: qC5.id
            })
            // C6: Email Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaPartTimeOption.id,
                questionPointerToId: qC6.id
            })
            // C7: Nomor Telepon Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: bekerjaPartTimeOption.id,
                questionPointerToId: qC7.id
            })
        }

        if (wiraswastaOption) {
            // C3: Nama Perusahaan/Instansi
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: wiraswastaOption.id,
                questionPointerToId: qC3.id
            })
            // C4: Jabatan/Posisi
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: wiraswastaOption.id,
                questionPointerToId: qC4.id
            })
            // C5: Nama Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: wiraswastaOption.id,
                questionPointerToId: qC5.id
            })
            // C6: Email Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: wiraswastaOption.id,
                questionPointerToId: qC6.id
            })
            // C7: Nomor Telepon Atasan/Manager
            questionTreeEntries.push({
                questionTriggerId: qC1.id,
                answerQuestionTriggerId: wiraswastaOption.id,
                questionPointerToId: qC7.id
            })
        }

        // Delete existing QuestionTree entries for C1 (Status Kerja) to avoid duplicates
        if (questionTreeEntries.length > 0) {
            await prisma.questionTree.deleteMany({
                where: {
                    questionTriggerId: qC1.id
                }
            })
        }
        
        // Create QuestionTree entries
        for (const entry of questionTreeEntries) {
            await prisma.questionTree.create({
                data: entry
            })
        }
        logger.info(`✅ Created ${questionTreeEntries.length} QuestionTree entries for conditional manager questions`)

        // ===== PAGE 4: Penilaian Kompetensi =====
        const pageNumber4 = 4
        // Question D1: Penilaian Kompetensi (Matrix)
        const codeD1 = await createCodeQuestion('D1', tracerStudySurvey.id)
        const qD1 = await prisma.question.create({
            data: {
                codeId: codeD1.code,
                groupQuestionId: groupQuestions[3].id,
                questionText: 'Penilaian Kompetensi yang Didapat dari Perguruan Tinggi',
                questionType: 'MATRIX_SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih tingkat kompetensi untuk setiap item',
                searchplaceholder: '',
                pageNumber: pageNumber4
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
        // Matrix items for kompetensi
        const kompetensiItems = [
            'Keterampilan Komunikasi',
            'Keterampilan Analisis',
            'Berpikir Kritis',
            'Berpikir Kreatif',
            'Keterampilan Kolaborasi',
            'Kepemimpinan',
            'Penguasaan Teknologi',
            'Keterampilan Bahasa Asing'
        ]

        const kompetensiOptions = await createAnswerOptions(qD1.id, [
            { text: 'Sangat Buruk', order: 1 },
            { text: 'Buruk', order: 2 },
            { text: 'Cukup', order: 3 },
            { text: 'Baik', order: 4 },
            { text: 'Sangat Baik', order: 5 }
        ])

        for (let i = 0; i < kompetensiItems.length; i++) {
            const codeDItem = await createCodeQuestion(`D${i + 2}`, tracerStudySurvey.id)
            const itemQ = await prisma.question.create({
                data: {
                    codeId: codeDItem.code,
                    groupQuestionId: groupQuestions[3].id,
                    parentId: qD1.id,
                    questionText: kompetensiItems[i],
                    questionType: 'SINGLE_CHOICE',
                    isRequired: true,
                    sortOrder: sortOrder++,
                    placeholder: 'Pilih tingkat kompetensi',
                    searchplaceholder: '',
                    pageNumber: pageNumber4 // Child questions use same page as parent
                }
            })

            // Link same options to parent
            for (const opt of kompetensiOptions) {
                await prisma.answerOptionQuestion.create({
                    data: {
                        questionId: itemQ.id,
                        answerText: opt.answerText,
                        sortOrder: opt.sortOrder,
                        isTriggered: opt.isTriggered || false,
                        otherOptionPlaceholder: opt.otherOptionPlaceholder
                    }
                })
            }
        }

        // ===== PAGE 5: Kepuasan Pendidikan =====
        const pageNumber5 = 5
        // Question E1: Kepuasan Pendidikan (Matrix)
        const codeE1 = await createCodeQuestion('E1', tracerStudySurvey.id)
        const qE1 = await prisma.question.create({
            data: {
                codeId: codeE1.code,
                groupQuestionId: groupQuestions[4].id,
                questionText: 'Tingkat Kepuasan terhadap Pendidikan di Perguruan Tinggi',
                questionType: 'MATRIX_SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Beri penilaian untuk setiap aspek',
                searchplaceholder: '',
                pageNumber: pageNumber5
            }
        })
        questions.push(qE1)

        const kepuasanOptions = await createAnswerOptions(qE1.id, [
            { text: 'Sangat Tidak Puas', order: 1 },
            { text: 'Tidak Puas', order: 2 },
            { text: 'Netral', order: 3 },
            { text: 'Puas', order: 4 },
            { text: 'Sangat Puas', order: 5 }
        ])

        const kepuasanItems = [
            'Kurikulum',
            'Kualitas Dosen',
            'Fasilitas Pembelajaran',
            'Kegiatan Praktikum',
            'Kegiatan Penelitian',
            'Kegiatan Pengabdian Masyarakat',
            'Pelayanan Administrasi',
            'Fasilitas Perpustakaan'
        ]

        for (let i = 0; i < kepuasanItems.length; i++) {
            const codeEItem = await createCodeQuestion(`E${i + 2}`, tracerStudySurvey.id)
            const itemQ = await prisma.question.create({
                data: {
                    codeId: codeEItem.code,
                    groupQuestionId: groupQuestions[4].id,
                    parentId: qE1.id,
                    questionText: kepuasanItems[i],
                    questionType: 'SINGLE_CHOICE',
                    isRequired: true,
                    sortOrder: sortOrder++,
                    placeholder: 'Pilih penilaian',
                    searchplaceholder: '',
                    pageNumber: pageNumber5 // Child questions use same page as parent
                }
            })

            // Link same options to parent
            for (const opt of kepuasanOptions) {
                await prisma.answerOptionQuestion.create({
                    data: {
                        questionId: itemQ.id,
                        answerText: opt.answerText,
                        sortOrder: opt.sortOrder,
                        isTriggered: opt.isTriggered || false,
                        otherOptionPlaceholder: opt.otherOptionPlaceholder
                    }
                })
            }
        }

        // ===== PAGE 6: Saran dan Harapan =====
        const pageNumber6 = 6
        // Question F1: Saran Perbaikan
        const codeF1 = await createCodeQuestion('F1', tracerStudySurvey.id)
        const qF1 = await prisma.question.create({
            data: {
                codeId: codeF1.code,
                groupQuestionId: groupQuestions[5].id,
                questionText: 'Saran untuk Perbaikan Program Studi',
                questionType: 'LONG_TEST',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Berikan saran untuk perbaikan program studi Anda...',
                searchplaceholder: '',
                pageNumber: pageNumber6
            }
        })
        questions.push(qF1)

        // Question F2: Harapan Masa Depan
        const codeF2 = await createCodeQuestion('F2', tracerStudySurvey.id)
        const qF2 = await prisma.question.create({
            data: {
                codeId: codeF2.code,
                groupQuestionId: groupQuestions[5].id,
                questionText: 'Harapan untuk Masa Depan Program Studi',
                questionType: 'LONG_TEST',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Berikan harapan untuk masa depan program studi...',
                searchplaceholder: '',
                pageNumber: pageNumber6
            }
        })
        questions.push(qF2)

        logger.info(`✅ Created ${questions.length} Questions`)

        // Use fixed UUID for Manager Survey
        const managerSurveyId = '550e8400-e29b-41d4-a716-446655440002'
        logger.info(`📝 Using UUID for Manager Survey: ${managerSurveyId}`)

        // Create Survey 2: User Survey for MANAGER
        logger.info('📝 Creating User Survey for MANAGER...')
        const managerSurvey = await prisma.survey.upsert({
            where: {
                id: managerSurveyId
            },
            update: {},
            create: {
                id: managerSurveyId,
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

        // Delete existing code questions and questions for manager survey first
        logger.info('🗑️  Cleaning up existing Manager Survey Code Questions and Questions...')
        
        // Get all code questions for manager survey
        const existingManagerCodeQuestions = await prisma.codeQuestion.findMany({
            where: { surveyId: managerSurvey.id },
            select: { code: true }
        })
        
        const managerCodeIds = existingManagerCodeQuestions.map(cq => cq.code)
        
        // Get all questions that use these codeIds (including any duplicates)
        const allManagerQuestions = managerCodeIds.length > 0
            ? await prisma.question.findMany({
                where: { codeId: { in: managerCodeIds } },
                select: { id: true }
            })
            : []
        
        const allManagerQuestionIds = allManagerQuestions.map(q => q.id)
        
        if (allManagerQuestionIds.length > 0) {
            // Delete in correct order to avoid foreign key constraint violations
            // 1. Delete QuestionTree (references Question via questionTriggerId and questionPointerToId)
            await prisma.questionTree.deleteMany({
                where: {
                    OR: [
                        { questionTriggerId: { in: allManagerQuestionIds } },
                        { questionPointerToId: { in: allManagerQuestionIds } }
                    ]
                }
            })
            
            // 2. Delete AnswerMultipleChoice (references Question)
            await prisma.answerMultipleChoice.deleteMany({
                where: { questionId: { in: allManagerQuestionIds } }
            })
            
            // 3. Delete Answer (references Question)
            await prisma.answer.deleteMany({
                where: { questionId: { in: allManagerQuestionIds } }
            })
            
            // 4. Delete AnswerOptionQuestion (references Question)
            await prisma.answerOptionQuestion.deleteMany({
                where: { questionId: { in: allManagerQuestionIds } }
            })
            
            // 5. Delete Questions (children first, then parents)
            // Delete children questions first (those with parentId)
            await prisma.question.deleteMany({
                where: {
                    id: { in: allManagerQuestionIds },
                    parentId: { not: null }
                }
            })
            
            // Then delete parent questions
            await prisma.question.deleteMany({
                where: {
                    id: { in: allManagerQuestionIds },
                    parentId: null
                }
            })
        }
        
        // Delete code questions (this will also ensure no orphaned code questions)
        await prisma.codeQuestion.deleteMany({
            where: { surveyId: managerSurvey.id }
        })
        logger.info('✅ Cleaned up existing Manager Survey data')

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

        sortOrder = 1
        // Manager Questions
        // PAGE 1: Informasi Perusahaan dan Alumni
        const managerPageNumber1 = 1
        const codeM1 = await createCodeQuestion('M1', managerSurvey.id)
        const mQ1 = await prisma.question.create({
            data: {
                codeId: codeM1.code,
                groupQuestionId: managerGroupQuestions[0].id,
                questionText: 'Berapa jumlah alumni dari universitas kami yang bekerja di perusahaan Anda?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih jumlah',
                searchplaceholder: '',
                pageNumber: managerPageNumber1
            }
        })

        await createAnswerOptions(mQ1.id, [
            { text: '1-5 orang', order: 1 },
            { text: '6-10 orang', order: 2 },
            { text: '11-20 orang', order: 3 },
            { text: 'Lebih dari 20 orang', order: 4 }
        ])

        // PAGE 2: Penilaian Kualitas Alumni
        const managerPageNumber2 = 2
        const codeM2 = await createCodeQuestion('M2', managerSurvey.id)
        const mQ2 = await prisma.question.create({
            data: {
                codeId: codeM2.code,
                groupQuestionId: managerGroupQuestions[1].id,
                questionText: 'Bagaimana penilaian Anda terhadap kompetensi alumni dalam bekerja?',
                questionType: 'MATRIX_SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Beri penilaian untuk setiap aspek',
                searchplaceholder: '',
                pageNumber: managerPageNumber2
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

        for (let i = 0; i < managerAspects.length; i++) {
            const codeMAspect = await createCodeQuestion(`M2_${i + 1}`, managerSurvey.id)
            const aspectQ = await prisma.question.create({
                data: {
                    codeId: codeMAspect.code,
                    groupQuestionId: managerGroupQuestions[1].id,
                    parentId: mQ2.id,
                    questionText: managerAspects[i],
                    questionType: 'SINGLE_CHOICE',
                    isRequired: true,
                    sortOrder: sortOrder++,
                    placeholder: 'Pilih penilaian',
                    searchplaceholder: '',
                    pageNumber: managerPageNumber2 // Child questions use same page as parent
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

        // PAGE 3: Rekomendasi dan Harapan
        const managerPageNumber3 = 3
        const codeM3 = await createCodeQuestion('M3', managerSurvey.id)
        const mQ3 = await prisma.question.create({
            data: {
                codeId: codeM3.code,
                groupQuestionId: managerGroupQuestions[2].id,
                questionText: 'Apakah Anda bersedia merekrut alumni dari universitas kami di masa depan?',
                questionType: 'SINGLE_CHOICE',
                isRequired: true,
                sortOrder: sortOrder++,
                placeholder: 'Pilih salah satu',
                searchplaceholder: '',
                pageNumber: managerPageNumber3
            }
        })

        await createAnswerOptions(mQ3.id, [
            { text: 'Ya, sangat bersedia', order: 1 },
            { text: 'Ya', order: 2 },
            { text: 'Mungkin', order: 3 },
            { text: 'Tidak', order: 4 }
        ])

        const codeM4 = await createCodeQuestion('M4', managerSurvey.id)
        const mQ4 = await prisma.question.create({
            data: {
                codeId: codeM4.code,
                groupQuestionId: managerGroupQuestions[2].id,
                questionText: 'Apa saran Anda untuk meningkatkan kualitas lulusan universitas kami?',
                questionType: 'ESSAY',
                isRequired: false,
                sortOrder: sortOrder++,
                placeholder: 'Tuliskan saran Anda...',
                searchplaceholder: '',
                pageNumber: managerPageNumber3
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

