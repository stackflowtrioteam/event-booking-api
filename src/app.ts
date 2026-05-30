import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import adminUserRoutes from './routes/adminUsers.routes';
import adminEventCategoriesRoutes from './routes/adminEventCategories.routes';
import adminCitiesRoutes from './routes/adminCities.routes';
import adminVendorsRoutes from './routes/adminVendors.routes';
import adminEventsRoutes from './routes/adminEvents.routes';
import adminQuotationsRoutes from './routes/adminQuotations.routes';
import adminBookingsRoutes from './routes/adminBookings.routes';
import adminReviewsRoutes from './routes/adminReviews.routes';
import authRoutes from './routes/auth.routes';
import webRoutes from './routes/web.routes';
import webVendorRoutes from './routes/webVendor.routes';
import customerEventRoutes from './routes/customerEvent.routes';
import { vendorQuotationRouter, customerQuotationRouter } from './routes/quotation.routes';
import { customerBookingRouter, vendorBookingRouter } from './routes/booking.routes';
import messageRouter from './routes/message.routes';
import { customerReviewRouter, vendorReviewRouter } from './routes/review.routes';
import customerDashboardRouter from './routes/customerDashboard.routes';

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
app.use('/api/admin/events', adminEventsRoutes);
app.use('/api/admin/quotations', adminQuotationsRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/admin/reviews', adminReviewsRoutes);
//Website API Routes
app.use('/api/auth', authRoutes);
app.use('/api/web', webRoutes);
app.use('/api/web/vendor', webVendorRoutes);
app.use('/api/web/vendor/quotations', vendorQuotationRouter);
app.use('/api/web/vendor/bookings', vendorBookingRouter);
app.use('/api/web/customer/events', customerEventRoutes);
app.use('/api/web/customer/quotations', customerQuotationRouter);
app.use('/api/web/customer/bookings', customerBookingRouter);
app.use('/api/web/messages', messageRouter);
app.use('/api/web/customer/reviews', customerReviewRouter);
app.use('/api/web/vendor/reviews', vendorReviewRouter);
app.use('/api/web/customer/dashboard', customerDashboardRouter);

export default app; 