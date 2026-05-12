// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateToken } from "../utils/common";
import mongoose from 'mongoose';

const authController = {
    register: async (req: Request, res: Response) => {
      try {
        const { name, email, password, userType, phoneNumber, businessName, eventCategory, state, city } = req.body;
        

        const userExists = await User.findOne({ email });
        if (userExists) {
          return res.status(400).json({ message: "Email already used, please login or forgot password" });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        let data = {
            name,
            email,
            password: hashedPassword,
            userType,
            phoneNumber,
            ...userType === 'vendor' ? { eventCategory, city , state, businessName } : {},
        }
        const user = await User.create(data);
    
        return res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id.toString()),
        });
    
      } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server error" });
      }
    },
    
    login: async (req: Request, res: Response) => {
      try {
        const { email, password, userType } = req.body;
        console.log(req.body, 'request')
        console.log("DB Name:", mongoose.connection.name);
        console.log(await User.find());
        const user = await User.findOne({
            email: { $eq: email },
            userType: { $eq: userType }
          });
        console.log(user, 'user')
        if (user && (await bcrypt.compare(password, user.password))) {
          return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id.toString()),
          });
        }
    
        return res.status(401).json({ message: "Invalid credentials" });
    
      } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error });
      }
    }
}

export default authController;