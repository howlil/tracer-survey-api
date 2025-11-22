const XLSX = require('xlsx')

function bufferToJson(buffer) {
    if (!buffer) {
        return []
    }
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const [firstSheetName] = workbook.SheetNames
    if (!firstSheetName) {
        return []
    }
    const worksheet = workbook.Sheets[firstSheetName]
    return XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
    })
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

module.exports = {
    bufferToJson,
    rowsToCsv,
}

