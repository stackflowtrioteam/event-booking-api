import Joi from "joi";

// ─── Web: Vendor Portfolio ────────────────────────────────────────────────────
// Fields match the "Edit Portfolio" UI form:
//   Business Information: businessName, eventCategory, city, description
//   Portfolio Gallery:    portfolioImages (multipart file upload — validated separately)
//   Pricing:              startingPrice, servicesOffered

export const addPortfolioSchema = Joi.object({
    // Business Information
    businessName: Joi.string().max(255).optional(),
    eventCategory: Joi.string().optional(),
    city: Joi.string().optional(),
    description: Joi.string().max(2000).optional(),
    // Pricing
    startingPrice: Joi.number().min(0).optional(),
    servicesOffered: Joi.string().max(1000).optional(),
    // portfolioImages come via multipart — not validated through Joi
});

// ─── Admin: List Vendors ──────────────────────────────────────────────────────

export const adminListVendorsSchema = Joi.object({
    page: Joi.number().min(1).required(),
    perPage: Joi.number().min(1).required(),
    kycStatus: Joi.string().valid('pending', 'approved', 'rejected').optional(),
    search: Joi.string().optional().allow(''),
    user_id: Joi.string().required(),
});

// ─── Admin: KYC Action ────────────────────────────────────────────────────────

export const adminKycActionSchema = Joi.object({
    id: Joi.string().required(),
    kycStatus: Joi.string().valid('approved', 'rejected').required(),
    kycRemark: Joi.when('kycStatus', {
        is: 'rejected',
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow(''),
    }),
    user_id: Joi.string().required(),
});

// ─── Admin: Toggle Vendor Active Status ──────────────────────────────────────

export const adminToggleVendorSchema = Joi.object({
    id: Joi.string().required(),
    isActive: Joi.boolean().required(),
    user_id: Joi.string().required(),
});

// ─── Admin: Delete Vendor ─────────────────────────────────────────────────────

export const adminDeleteVendorSchema = Joi.object({
    id: Joi.string().required(),
    user_id: Joi.string().required(),
});

// ─── Admin: View Vendor Portfolio ─────────────────────────────────────────────

export const adminViewPortfolioSchema = Joi.object({
    id: Joi.string().required(),
    user_id: Joi.string().required(),
});

