import { Request, Response } from "express";
import mongoose from "mongoose";
import eventCategories from "../models/eventCategories";

const eventCategoriesController = {
    addEventCategory: async (req: Request, res: Response) => {
        try {
            const { name } = req.body;


            const eventCategoryExists = await eventCategories.findOne({ name });
            if (eventCategoryExists) {
                return res.status(409).json({ message: "Event category already exists" });
            }

            const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            let data = {
                name,
                slug,
            }
            const eventCategory = await eventCategories.create(data);

            return res.status(201).json({
                _id: eventCategory._id,
                name: eventCategory.name,
                slug: eventCategory.slug,
            });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Server error" });
        }
    },

    listEventCategories: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.body.page as string) || 1;
            const perPage = parseInt(req.body.perPage as string) || 10;

            const pageNumber = Math.max(1, page);
            const limitNumber = Math.max(1, perPage);
            const skip = (pageNumber - 1) * limitNumber;

            const total = await eventCategories.countDocuments({});
            const categories = await eventCategories.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber);

            return res.json({
                categories,
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

    deleteEventCategory: async (req: Request, res: Response) => {
        try {
            const { id } = req.body;
            if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid category ID format" });
            }

            const deletedCategory = await eventCategories.findByIdAndDelete(id);
            if (!deletedCategory) {
                return res.status(404).json({ message: "Event category not found" });
            }

            return res.json({ message: "Event category deleted successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    }
}

export default eventCategoriesController;