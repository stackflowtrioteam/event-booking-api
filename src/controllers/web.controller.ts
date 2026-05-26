import { Request, Response } from "express";
import eventCategories from "../models/eventCategories";
import City from "../models/city";

const webController = {
    listEventCategories: async (req: Request, res: Response) => {
        try {
            const categories = await eventCategories.find({ isActive: true }).sort({ name: 1 });
            return res.json({
                categories
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    listCities: async (req: Request, res: Response) => {
        try {
            const cities = await City.find({ isActive: true }).sort({ name: 1 });
            return res.json({
                cities
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    }
};

export default webController;
