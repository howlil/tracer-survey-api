const ErrorHttp = require('../http/error.http')

function getAccessibleFacultyIds(req) {
    if (req.isSuperAdmin) {
        return null
    }
    return Array.isArray(req.accessibleFacultyIds) ? req.accessibleFacultyIds : []
}

function assertFacultyAccess(req, facultyId, entityName = 'resource') {
    const allowed = getAccessibleFacultyIds(req)
    if (allowed === null) {
        return
    }
    if (!facultyId || !allowed.includes(facultyId)) {
        throw new ErrorHttp(403, `Anda tidak memiliki akses ke ${entityName} dengan fakultas ini`)
    }
}

module.exports = {
    getAccessibleFacultyIds,
    assertFacultyAccess,
}

