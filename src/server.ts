import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/users', userRoutes);

// health
app.get('/health', (req: Request, res: Response) => res.json({ ok: true }));

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
