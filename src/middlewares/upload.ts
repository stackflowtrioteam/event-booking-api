import multer from "multer";
import path from "path";
import fs from "fs";

// ─── Shared file filter (images only) ────────────────────────────────────────
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValid =
        allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
        allowedTypes.test(file.mimetype);
    if (isValid) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed"));
    }
};

// ─── Portfolio upload (vendor) ────────────────────────────────────────────────
const portfolioUploadDir = path.join(process.cwd(), "uploads", "portfolio");
if (!fs.existsSync(portfolioUploadDir)) {
    fs.mkdirSync(portfolioUploadDir, { recursive: true });
}

const portfolioStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, portfolioUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `portfolio-${uniqueSuffix}${ext}`);
    },
});

export const portfolioUpload = multer({
    storage: portfolioStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
}).array("portfolioImages", 10); // up to 10 images

// ─── Event reference images upload (customer) ─────────────────────────────────
const eventUploadDir = path.join(process.cwd(), "uploads", "events");
if (!fs.existsSync(eventUploadDir)) {
    fs.mkdirSync(eventUploadDir, { recursive: true });
}

const eventStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, eventUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `event-${uniqueSuffix}${ext}`);
    },
});

export const eventImagesUpload = multer({
    storage: eventStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
}).array("referenceImages", 10); // up to 10 reference images
