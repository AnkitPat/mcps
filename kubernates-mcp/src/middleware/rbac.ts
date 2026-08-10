import { Request, Response, NextFunction } from 'express';

export function requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Assuming auth middleware attaches user info to req.user
        const userRole = (req as any).user?.role;
        if (userRole && allowedRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
    };
}
