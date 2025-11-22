const DegreeMap = {
    S1: 'S1',
    S2: 'PASCA',
    S3: 'PASCA',
    PASCA: 'PASCA',
    D3: 'VOKASI',
    VOKASI: 'VOKASI',
    PROFESI: 'PROFESI',
}

function normalizeDegree(input) {
    if (!input) return null
    const upper = String(input).toUpperCase()
    return DegreeMap[upper] || null
}

module.exports = {
    normalizeDegree,
}

