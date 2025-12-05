const XLSX = require('xlsx')
const ExcelJS = require('exceljs')

function bufferToJson(buffer) {
    if (!buffer) {
        return []
    }
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    // Cari sheet dengan nama "Template" terlebih dahulu
    let sheetName = null
    if (workbook.SheetNames.includes('Template')) {
        sheetName = 'Template'
    } else if (workbook.SheetNames.length > 0) {
        // Fallback ke sheet pertama jika Template tidak ditemukan
        sheetName = workbook.SheetNames[0]
    }
    
    if (!sheetName) {
        return []
    }
    
    const worksheet = workbook.Sheets[sheetName]
    // Read data with header row, case-insensitive and handle various formats
    const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
        header: 1, // Get raw data first
    })
    
    if (data.length < 2) {
        return [] // No data rows (only header or empty)
    }
    
    // Get header row (first row)
    const headers = data[0].map((h) => String(h || '').toLowerCase().trim())
    
    // Map data rows to objects with normalized keys
    const result = []
    for (let i = 1; i < data.length; i++) {
        const row = data[i]
        const rowObj = {}
        
        headers.forEach((header, index) => {
            if (header) {
                const value = String(row[index] || '').trim()
                // Store with original header name
                rowObj[header] = value
                // Also store with common variations for compatibility
                if (header === 'nim') {
                    rowObj['NIM'] = value
                }
                if (header === 'full_name') {
                    rowObj['fullName'] = value
                }
                if (header === 'faculty_name') {
                    rowObj['facultyId'] = value
                    rowObj['faculty_name'] = value
                }
                if (header === 'major_name') {
                    rowObj['majorId'] = value
                    rowObj['major_name'] = value
                }
                if (header === 'graduated_year') {
                    rowObj['graduatedYear'] = value
                }
                if (header === 'graduate_periode') {
                    rowObj['graduatePeriode'] = value
                }
            }
        })
        
        // Only add row if it has at least one non-empty value (skip completely empty rows)
        const hasData = Object.values(rowObj).some(v => v !== '' && v !== null && v !== undefined)
        
        if (hasData) {
            result.push(rowObj)
        }
    }
    
    console.log(`Parsed ${result.length} valid rows from sheet "${sheetName}"`)
    if (result.length > 0) {
        console.log('First row sample:', JSON.stringify(result[0], null, 2))
    }
    return result
}

function rowsToCsv(headers = [], rows = []) {
    const normalizedHeaders = headers.map((header) => `"${header}"`)
    const csvRows = rows.map((row) =>
        headers
            .map((header) => {
                const value = row[header] ?? ''
                return `"${String(value).replace(/"/g, '""')}"`
            })
            .join(',')
    )
    return [normalizedHeaders.join(','), ...csvRows].join('\n')
}

async function rowsToExcel(headers = [], rows = [], options = {}) {
    const { faculties = [], majors = [], graduatePeriods = [], companies = [], positions = [] } = options
    
    // Create workbook dengan ExcelJS
    const workbook = new ExcelJS.Workbook()
    
    // Create dropdown sheets - HARUS dibuat SEBELUM template sheet untuk referensi
    if (faculties.length > 0) {
        const facultySheet = workbook.addWorksheet('Fakultas')
        facultySheet.getColumn(1).width = 50
        facultySheet.getRow(1).values = ['Nama Fakultas']
        facultySheet.getRow(1).font = { bold: true }
        facultySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        }
        faculties.forEach((faculty, index) => {
            facultySheet.getRow(index + 2).values = [faculty.name]
        })
    }

    if (majors.length > 0) {
        const majorSheet = workbook.addWorksheet('Program Studi')
        majorSheet.getColumn(1).width = 50
        majorSheet.getColumn(2).width = 50
        majorSheet.getRow(1).values = ['Nama Program Studi', 'Fakultas']
        majorSheet.getRow(1).font = { bold: true }
        majorSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        }
        
        // Organize majors by faculty - group them together
        const majorsByFaculty = {}
        majors.forEach((major) => {
            const facultyName = major.faculty?.name || 'Unknown'
            if (!majorsByFaculty[facultyName]) {
                majorsByFaculty[facultyName] = []
            }
            majorsByFaculty[facultyName].push(major)
        })
        
        // Write majors grouped by faculty to sheet
        let currentRow = 2
        const facultyRowRanges = {}
        
        Object.keys(majorsByFaculty).sort().forEach((facultyName) => {
            const facultyMajors = majorsByFaculty[facultyName]
            const startRow = currentRow
            const endRow = currentRow + facultyMajors.length - 1
            facultyRowRanges[facultyName] = { startRow, endRow }
            
            facultyMajors.forEach((major) => {
                majorSheet.getRow(currentRow).values = [major.name, facultyName]
                currentRow++
            })
        })
        
        // Create named ranges for each faculty's majors
        Object.keys(facultyRowRanges).forEach((facultyName) => {
            const { startRow, endRow } = facultyRowRanges[facultyName]
            // Named range format: "Fakultas_X" where X is faculty name with special chars replaced by underscores
            const rangeName = `Fakultas_${facultyName.replace(/[^a-zA-Z0-9]/g, '_')}`
            try {
                workbook.definedNames.add(rangeName, `'Program Studi'!$A$${startRow}:$A$${endRow}`)
            } catch (error) {
                // If named range already exists or error, skip it
                console.warn(`Failed to create named range ${rangeName}:`, error.message)
            }
        })
    }

    // Create sheet untuk graduate periods
    if (graduatePeriods.length > 0) {
        const periodSheet = workbook.addWorksheet('Periode Wisuda')
        periodSheet.getColumn(1).width = 30
        periodSheet.getRow(1).values = ['Periode Wisuda']
        periodSheet.getRow(1).font = { bold: true }
        periodSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        }
        graduatePeriods.forEach((period, index) => {
            periodSheet.getRow(index + 2).values = [period]
        })
    }

    // Create sheet untuk companies (untuk manager template)
    if (companies.length > 0) {
        const companySheet = workbook.addWorksheet('Perusahaan')
        companySheet.getColumn(1).width = 50
        companySheet.getRow(1).values = ['Nama Perusahaan']
        companySheet.getRow(1).font = { bold: true }
        companySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        }
        companies.forEach((company, index) => {
            companySheet.getRow(index + 2).values = [company]
        })
    }

    // Create sheet untuk positions (untuk manager template)
    if (positions.length > 0) {
        const positionSheet = workbook.addWorksheet('Posisi')
        positionSheet.getColumn(1).width = 50
        positionSheet.getRow(1).values = ['Nama Posisi']
        positionSheet.getRow(1).font = { bold: true }
        positionSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        }
        positions.forEach((position, index) => {
            positionSheet.getRow(index + 2).values = [position]
        })
    }

    // Create main template sheet
    const templateSheet = workbook.addWorksheet('Template')
    
    // Set column widths
    headers.forEach((header, index) => {
        const col = templateSheet.getColumn(index + 1)
        if (header === 'full_name' || header === 'email') {
            col.width = 30
        } else if (header === 'faculty_name' || header === 'major_name' || header === 'company' || header === 'position') {
            col.width = 40
        } else if (header === 'alumni_pins') {
            col.width = 50
        } else {
            col.width = 20
        }
    })

    // Add header row dengan styling
    const headerRow = templateSheet.getRow(1)
    headerRow.values = headers
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Biru
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Add example row
    if (rows.length > 0) {
        const exampleRow = templateSheet.getRow(2)
        exampleRow.values = headers.map(header => rows[0][header] ?? '')
    }

    // Add empty rows untuk input (10 baris kosong)
    const emptyRowsCount = 10
    for (let i = 0; i < emptyRowsCount; i++) {
        const emptyRow = templateSheet.getRow(rows.length + 2 + i)
        emptyRow.values = headers.map(() => '')
    }

    // Add data validation untuk dropdown
    const facultyNameIndex = headers.indexOf('faculty_name')
    const majorNameIndex = headers.indexOf('major_name')
    const graduatePeriodeIndex = headers.indexOf('graduate_periode')
    const companyIndex = headers.indexOf('company')
    const positionIndex = headers.indexOf('position')
    const lastRow = rows.length + emptyRowsCount + 1
    
    // Data validation untuk faculty_name
    if (facultyNameIndex >= 0 && faculties.length > 0) {
        const facultySheetName = 'Fakultas'
        // Format untuk sheet dengan nama tanpa spasi: SheetName!$A$2:$A$N
        // Format untuk sheet dengan nama mengandung spasi: 'Sheet Name'!$A$2:$A$N
        const facultyRange = `${facultySheetName}!$A$2:$A$${faculties.length + 1}`
        
        // Add data validation untuk semua baris (mulai dari row 2 sampai lastRow)
        for (let i = 2; i <= lastRow; i++) {
            const cell = templateSheet.getCell(i, facultyNameIndex + 1)
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: 'Nilai Tidak Valid',
                error: 'Pilih salah satu fakultas dari daftar',
                formulae: [facultyRange]
            }
        }
    }

    // Data validation untuk major_name
    // Catatan: ExcelJS memiliki keterbatasan dengan INDIRECT untuk dropdown dinamis
    // Untuk sementara menggunakan semua majors untuk dropdown
    // Validasi bahwa major sesuai dengan faculty akan dilakukan di backend saat import
    if (majorNameIndex >= 0 && majors.length > 0) {
        const majorSheetName = 'Program Studi'
        // Gunakan semua majors untuk dropdown (static list)
        // User harus memastikan memilih major yang sesuai dengan faculty yang dipilih
        const majorRange = `'${majorSheetName}'!$A$2:$A$${majors.length + 1}`
        
        // Add data validation untuk semua baris (mulai dari row 2 sampai lastRow)
        for (let i = 2; i <= lastRow; i++) {
            const cell = templateSheet.getCell(i, majorNameIndex + 1)
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: 'Nilai Tidak Valid',
                error: 'Pilih salah satu program studi dari daftar. Pastikan program studi sesuai dengan fakultas yang dipilih.',
                formulae: [majorRange]
            }
        }
    }

    // Data validation untuk graduate_periode
    if (graduatePeriodeIndex >= 0 && graduatePeriods.length > 0) {
        const periodSheetName = 'Periode Wisuda'
        // Sheet dengan spasi perlu tanda kutip
        const periodRange = `'${periodSheetName}'!$A$2:$A$${graduatePeriods.length + 1}`
        
        // Add data validation untuk semua baris (mulai dari row 2 sampai lastRow)
        for (let i = 2; i <= lastRow; i++) {
            const cell = templateSheet.getCell(i, graduatePeriodeIndex + 1)
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: 'Nilai Tidak Valid',
                error: 'Pilih salah satu periode wisuda dari daftar',
                formulae: [periodRange]
            }
        }
    }

    // Data validation untuk company (untuk manager template)
    if (companyIndex >= 0 && companies.length > 0) {
        const companySheetName = 'Perusahaan'
        const companyRange = `'${companySheetName}'!$A$2:$A$${companies.length + 1}`
        
        // Add data validation untuk semua baris (mulai dari row 2 sampai lastRow)
        for (let i = 2; i <= lastRow; i++) {
            const cell = templateSheet.getCell(i, companyIndex + 1)
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: 'Nilai Tidak Valid',
                error: 'Pilih salah satu perusahaan dari daftar',
                formulae: [companyRange]
            }
        }
    }

    // Data validation untuk position (untuk manager template)
    if (positionIndex >= 0 && positions.length > 0) {
        const positionSheetName = 'Posisi'
        const positionRange = `'${positionSheetName}'!$A$2:$A$${positions.length + 1}`
        
        // Add data validation untuk semua baris (mulai dari row 2 sampai lastRow)
        for (let i = 2; i <= lastRow; i++) {
            const cell = templateSheet.getCell(i, positionIndex + 1)
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: 'Nilai Tidak Valid',
                error: 'Pilih salah satu posisi dari daftar',
                formulae: [positionRange]
            }
        }
    }

    // Convert to buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
}

module.exports = {
    bufferToJson,
    rowsToCsv,
    rowsToExcel,
}

