import express, { Application } from 'express';
import userRoutes from './modules/user/user.routes';
import validateUser from './middleware/validateUser'
import cors from 'cors'
const app: Application = express();

app.use(cors());
app.use(express.json());
app.use('/api/users', validateUser.validateToken, userRoutes);

export default app;