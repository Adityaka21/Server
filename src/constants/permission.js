const permission = {
    admin: [
        'user:create',
        'user:delete',
        'user:update',
        'user:read',
        'link:create',
        'link:delete',
        'link:update',
        'link:read',
        'payment:create',
    ],
    developer: [
        'link:read'
    ],
    viewer: [
        'link:read',
        'user:read'
    ]
}

module.exports = permission;