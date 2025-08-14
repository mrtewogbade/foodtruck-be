import { Request, Response, NextFunction } from 'express';
import AppError from '../error/AppError';
import { IUser } from '../interface/user.interface';




function CheckRole(allowedRoles: string | string[]) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser;

        if (user) {
            // Check if user has a valid role in User
            if (
                ("role" in user && rolesArray.includes(user.role))
            ) {
                return next();
            }
        }

        return next(new AppError("You are not authorized to perform this action.", 403));
    };
}


export default CheckRole;
