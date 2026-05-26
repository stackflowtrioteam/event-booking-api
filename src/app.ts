import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import adminUserRoutes from './routes/adminUsers.routes';
import adminEventCategoriesRoutes from './routes/adminEventCategories.routes';
import adminCitiesRoutes from './routes/adminCities.routes';
import adminVendorsRoutes from './routes/adminVendors.routes';
import authRoutes from './routes/auth.routes';
import webRoutes from './routes/web.routes';
import webVendorRoutes from './routes/webVendor.routes';

const app: Application = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
].filter(Boolean) as string[];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    })
);

app.use(express.json());

// Serve uploaded portfolio images as static files
// Access via: http://localhost:5000/uploads/portfolio/<filename>
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

//Admin API Routes
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/eventCategories', adminEventCategoriesRoutes);
app.use('/api/admin/cities', adminCitiesRoutes);
app.use('/api/admin/vendors', adminVendorsRoutes);
//Website API Routes
app.use('/api/auth', authRoutes);
app.use('/api/web', webRoutes);
app.use('/api/web/vendor', webVendorRoutes);

export default app; 