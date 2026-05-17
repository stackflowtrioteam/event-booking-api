// import { jwt } from "jsonwebtoken";
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
const validateUser = {
    validateToken: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bypassMethods = ["login"];
            if (bypassMethods.includes(path.basename(req.originalUrl))) {
                next();
            } else {
                const token = req.headers.token as string;
                if (!token) {
                    res.status(401).json({ message: "Unauthorized" });
                    return;
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
                req.body.user_id = decoded._id;
                next();
            }
        } catch (e) {
            console.log("error", e);
        }
    }
}

export default validateUser;