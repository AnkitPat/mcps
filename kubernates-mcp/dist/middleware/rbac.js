export function requireRole(allowedRoles) {
    return (req, res, next) => {
        // Assuming auth middleware attaches user info to req.user
        const userRole = req.user?.role;
        if (userRole && allowedRoles.includes(userRole)) {
            next();
        }
        else {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
    };
}
