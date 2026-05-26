import { Request, Response } from "express";
import mongoose from "mongoose";
import City from "../models/city";

const citiesController = {
    addCity: async (req: Request, res: Response) => {
        try {
            const { name } = req.body;

            const cityExists = await City.findOne({ name });
            if (cityExists) {
                return res.status(409).json({ message: "City already exists" });
            }

            const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            let data = {
                name,
                slug,
            }
            const city = await City.create(data);

            return res.status(201).json({
                _id: city._id,
                name: city.name,
                slug: city.slug,
            });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Server error" });
        }
    },

    listCities: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.body.page as string) || 1;
            const perPage = parseInt(req.body.perPage as string) || 10;

            const pageNumber = Math.max(1, page);
            const limitNumber = Math.max(1, perPage);
            const skip = (pageNumber - 1) * limitNumber;

            const total = await City.countDocuments({});
            const cities = await City.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber);

            return res.json({
                cities,
                total,
                page: pageNumber,
                perPage: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    deleteCity: async (req: Request, res: Response) => {
        try {
            const { id } = req.body;
            if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid city ID format" });
            }

            const deletedCity = await City.findByIdAndDelete(id);
            if (!deletedCity) {
                return res.status(404).json({ message: "City not found" });
            }

            return res.json({ message: "City deleted successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    }
}

export default citiesController;
