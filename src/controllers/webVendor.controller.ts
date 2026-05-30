import { Response } from "express";
import path from "path";
import fs from "fs";
import User from "../models/user.model";

// Base URL for serving uploaded files (e.g. http://localhost:5000)
const BASE_URL = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');

/**
 * Deletes a portfolio image from disk given its stored full URL.
 * e.g. "http://localhost:5000/uploads/portfolio/portfolio-123.jpg"
 *       → deletes <cwd>/uploads/portfolio/portfolio-123.jpg
 * Silently ignores if file does not exist.
 */
function deletePhysicalFile(imageUrl: string): void {
    try {
        // Strip the base URL prefix to get the relative path, then resolve to absolute
        const relativePath = imageUrl.replace(BASE_URL, '');
        const absolutePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }
    } catch (err) {
        console.warn(`Failed to delete file: ${imageUrl}`, err);
    }
}

const webVendorController = {
    /**
     * POST /api/web/vendor/portfolio
     * Vendor adds or updates their portfolio.
     * Accepts multipart/form-data — text fields + up to 10 image files.
     *
     * Text fields:
     *   businessName, eventCategory, city    → saved on user root document
     *   description, startingPrice, servicesOffered → saved inside portfolio subdoc
     *
     * File fields:
     *   portfolioImages[]  → saved to uploads/portfolio/, paths stored in DB
     *                        If new images are uploaded, old ones are deleted from disk first.
     *
     * Auth: Bearer JWT → req.user.id
     */
    addOrUpdatePortfolio: async (req: any, res: Response) => {
        try {
            const vendorId = req.user?.id;
            if (!vendorId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const vendor = await User.findById(vendorId);
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            if (vendor.userType !== 'vendor') {
                return res.status(403).json({ message: "Only vendors can submit a portfolio" });
            }

            const {
                businessName,
                eventCategory,
                city,
                description,
                startingPrice,
                servicesOffered,
            } = req.body;

            // Build root-level updates (business info fields)
            const rootUpdate: any = {};
            if (businessName !== undefined) rootUpdate.businessName = businessName;
            if (eventCategory !== undefined) rootUpdate.eventCategory = eventCategory;
            if (city !== undefined) rootUpdate.city = city;

            // Build portfolio subdoc update
            // Use .toObject() to get a plain JS object — spreading a Mongoose subdocument
            // directly copies internal Mongoose metadata ($__, $isNew, etc.) which causes
            // MongoDB to silently ignore the portfolio field update.
            const existingPortfolio = vendor.portfolio
                ? (vendor.portfolio as any).toObject
                    ? (vendor.portfolio as any).toObject()
                    : { ...(vendor.portfolio as any) }
                : {};

            const portfolioUpdate: any = { ...existingPortfolio };
            if (description !== undefined) portfolioUpdate.description = description;
            if (startingPrice !== undefined) portfolioUpdate.startingPrice = Number(startingPrice);
            if (servicesOffered !== undefined) portfolioUpdate.servicesOffered = servicesOffered;

            // Handle uploaded images — multer places them in req.files
            if (req.files && (req.files as Express.Multer.File[]).length > 0) {
                // Delete all previously stored images from disk to free storage
                const oldImages: string[] = existingPortfolio.portfolioImages || [];
                for (const imageUrl of oldImages) {
                    deletePhysicalFile(imageUrl);
                }

                // Store only the new images (replace, not append)
                portfolioUpdate.portfolioImages = (req.files as Express.Multer.File[]).map(
                    (file) => `${BASE_URL}/uploads/portfolio/${file.filename}`
                );
            }

            // Use explicit dot-notation keys for each portfolio sub-field to guarantee
            // MongoDB applies all changes, including portfolioImages, even if the
            // top-level portfolio subdoc was previously undefined.
            const dbSet: any = { ...rootUpdate };
            if (portfolioUpdate.description !== undefined) dbSet['portfolio.description'] = portfolioUpdate.description;
            if (portfolioUpdate.startingPrice !== undefined) dbSet['portfolio.startingPrice'] = portfolioUpdate.startingPrice;
            if (portfolioUpdate.servicesOffered !== undefined) dbSet['portfolio.servicesOffered'] = portfolioUpdate.servicesOffered;
            if (portfolioUpdate.portfolioImages !== undefined) dbSet['portfolio.portfolioImages'] = portfolioUpdate.portfolioImages;

            const updatedVendor = await User.findByIdAndUpdate(
                vendorId,
                { $set: dbSet },
                { new: true, upsert: false }
            ).select('-password');

            return res.json({
                message: "Portfolio updated successfully",
                vendor: {
                    _id: updatedVendor?._id,
                    name: updatedVendor?.name,
                    email: updatedVendor?.email,
                    businessName: updatedVendor?.businessName,
                    eventCategory: updatedVendor?.eventCategory,
                    city: updatedVendor?.city,
                    kycStatus: updatedVendor?.kycStatus,
                    portfolio: updatedVendor?.portfolio,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    /**
     * DELETE /api/web/vendor/portfolio/image
     * Vendor removes a specific image from their portfolio.
     * Body: { imageUrl: "http://localhost:5000/uploads/portfolio/filename.jpg" }
     */
    removePortfolioImage: async (req: any, res: Response) => {
        try {
            const vendorId = req.user?.id;
            if (!vendorId) return res.status(401).json({ message: "Unauthorized" });

            const { imageUrl } = req.body;
            if (!imageUrl) return res.status(400).json({ message: "imageUrl is required" });

            const vendor = await User.findById(vendorId);
            if (!vendor) return res.status(404).json({ message: "Vendor not found" });
            if (vendor.userType !== 'vendor') return res.status(403).json({ message: "Forbidden" });

            const existingImages: string[] = (vendor.portfolio as any)?.portfolioImages || [];
            const updatedImages = existingImages.filter((img) => img !== imageUrl);

            // Delete the physical file from disk
            deletePhysicalFile(imageUrl);

            await User.findByIdAndUpdate(vendorId, {
                $set: { 'portfolio.portfolioImages': updatedImages },
            });

            return res.json({ message: "Image removed successfully", portfolioImages: updatedImages });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    /**
     * GET /api/web/vendor/portfolio
     * Authenticated vendor views their own portfolio.
     */
    getMyPortfolio: async (req: any, res: Response) => {
        try {
            const vendorId = req.user?.id;
            if (!vendorId) return res.status(401).json({ message: "Unauthorized" });

            const vendor = await User.findById(vendorId).select('-password');
            if (!vendor) return res.status(404).json({ message: "Vendor not found" });
            if (vendor.userType !== 'vendor') return res.status(403).json({ message: "Forbidden" });

            return res.json({
                vendor: {
                    _id: vendor._id,
                    name: vendor.name,
                    email: vendor.email,
                    phoneNumber: vendor.phoneNumber,
                    businessName: vendor.businessName,
                    eventCategory: vendor.eventCategory,
                    city: vendor.city,
                    state: vendor.state,
                    kycStatus: vendor.kycStatus,
                    kycRemark: vendor.kycRemark,
                    isActive: vendor.isActive,
                    portfolio: vendor.portfolio,
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },
};

export default webVendorController;
