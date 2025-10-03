const RESOURCES = {
    ADMIN: {
        name: 'admin',
        actions: ['create', 'read', 'update', 'delete']
    },
    ROLE: {
        name: 'role',
        actions: ['create', 'read', 'update', 'delete']
    },
    SURVEY: {
        name: 'survey',
        actions: ['create', 'read', 'update', 'delete', 'publish', 'archive']
    },
    QUESTION: {
        name: 'question',
        actions: ['create', 'read', 'update', 'delete']
    },
    RESPONDENT: {
        name: 'respondent',
        actions: ['create', 'read', 'update', 'delete', 'import']
    },
    EMAIL: {
        name: 'email',
        actions: ['create', 'read', 'update', 'delete', 'send'],
        subResources: {
            TEMPLATE: {
                name: 'email.template',
                actions: ['manage']
            }
        }
    },
    RESPONSE: {
        name: 'response',
        actions: ['read', 'export', 'delete']
    },
    FACULTY: {
        name: 'faculty',
        actions: ['manage']
    },
    MAJOR: {
        name: 'major',
        actions: ['manage']
    },
    FAQ: {
        name: 'faq',
        actions: ['manage']
    }
};

module.exports = RESOURCES;