import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user.model";

const adminVendorsController = {
    /**
     * POST /api/admin/vendors/list
     * Paginated list of vendors with optional kycStatus filter and name/email search.
     */
    listVendors: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.body.page) || 1;
            const perPage = parseInt(req.body.perPage) || 10;
            const { kycStatus, search } = req.body;

            const pageNumber = Math.max(1, page);
            const limitNumber = Math.max(1, perPage);
            const skip = (pageNumber - 1) * limitNumber;

            const filter: any = { userType: 'vendor' };
            if (kycStatus && ['pending', 'approved', 'rejected'].includes(kycStatus)) {
                filter.kycStatus = kycStatus;
            }
            if (search && search.trim() !== '') {
                filter.$or = [
                    { name: { $regex: search.trim(), $options: 'i' } },
                    { email: { $regex: search.trim(), $options: 'i' } },
                    { businessName: { $regex: search.trim(), $options: 'i' } },
                ];
            }

            const total = await User.countDocuments(filter);
            const vendors = await User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber);

            return res.json({
                vendors,
                total,
                page: pageNumber,
                perPage: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    /**
     * POST /api/admin/vendors/kyc
     * Approve or reject a vendor's KYC. On rejection, kycRemark is required.
     */
    updateKycStatus: async (req: Request, res: Response) => {
        try {
            const { id, kycStatus, kycRemark } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid vendor ID" });
            }

            const vendor = await User.findOne({ _id: id, userType: 'vendor' });
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            const updateData: any = { kycStatus };
            if (kycStatus === 'rejected' && kycRemark) {
                updateData.kycRemark = kycRemark;
            } else if (kycStatus === 'approved') {
                // Clear any previous rejection remark on approval
                updateData.kycRemark = '';
            }

            const updatedVendor = await User.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            ).select('-password');

            return res.json({
                message: `Vendor KYC ${kycStatus} successfully`,
                vendor: updatedVendor,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    /**
     * POST /api/admin/vendors/toggle
     * Enable or disable a vendor account.
     */
    toggleVendorStatus: async (req: Request, res: Response) => {
        try {
            const { id, isActive } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid vendor ID" });
            }

            const vendor = await User.findOne({ _id: id, userType: 'vendor' });
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            const updatedVendor = await User.findByIdAndUpdate(
                id,
                { $set: { isActive } },
                { new: true }
            ).select('-password');

            return res.json({
                message: `Vendor ${isActive ? 'enabled' : 'disabled'} successfully`,
                vendor: updatedVendor,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    /**
     * POST /api/admin/vendors/delete
     * Permanently delete a vendor.
     */
    deleteVendor: async (req: Request, res: Response) => {
        try {
            const { id } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid vendor ID" });
            }

            const deletedVendor = await User.findOneAndDelete({ _id: id, userType: 'vendor' });
            if (!deletedVendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            return res.json({ message: "Vendor deleted successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },

    /**
     * POST /api/admin/vendors/portfolio
     * View a vendor's full profile including their portfolio.
     */
    viewVendorPortfolio: async (req: Request, res: Response) => {
        try {
            const { id } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid vendor ID" });
            }

            const vendor = await User.findOne({ _id: id, userType: 'vendor' }).select('-password');
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }

            return res.json({ vendor });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },
};

export default adminVendorsController;
