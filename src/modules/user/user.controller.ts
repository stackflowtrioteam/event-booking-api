import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AdminUser from "../../model/AdminUser";
import { IAdminUser } from "../../model/AdminUser";
interface LoginBody {
    email: string;
    password: string;
}

interface LoginResponse {
    statusCode: number,
    message: string,
    result: IAdminUser | {}
}

const user = {
    login: async (req: Request<{}, LoginResponse, LoginBody>, res: Response<LoginResponse>) => {
        let response = {
            statusCode: 0,
            message: "Login failed",
            result: {}
        };
        const data = req.body;
        const user = await AdminUser.findOne({ email: data.email });
        if (user && await bcrypt.compare(data.password, user.passwordHash)) {
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET is not defined");
            }
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            const userObj = user.toObject();

            delete userObj.password;
            delete userObj.__v;
            response = {
                statusCode: 1,
                message: "Login successfully",
                result: { ...userObj, token }
            }
        } else {
            response = {
                statusCode: 0,
                message: "Please provide correct email and password.",
                result: {}
            }
        }

        res.json(response);
    },

    fetchUserData: async (req: Request, res: Response<LoginResponse>) => {
        let response = {
            statusCode: 0,
            message: "User data not found",
            result: {}
        };
        try {
            const user = await AdminUser.findById(req.body.user_id);
            response = {
                statusCode: 1,
                message: "User data fetched successfully",
                result: user
            }
        } catch (error) {
            console.log(error);
        }
        res.json(response);
    }
};

export default user;