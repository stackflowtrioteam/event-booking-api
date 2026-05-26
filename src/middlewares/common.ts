import { Request, Response, NextFunction } from "express";
import path from 'path';
import jwt from "jsonwebtoken";

export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((err: any) => err.message);
      return res.status(400).json({ errors });
    }

    next();
  };
};

export const validateToken = (req: any, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
};

export const validateAdminToken = (req: Request, res: Response, next: NextFunction) => {
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