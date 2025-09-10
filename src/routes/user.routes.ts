import { Router } from 'express';
import { createUserHandler, listUsersHandler } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema } from '../models/user.model';

const router = Router();

router.post('/', validate(createUserSchema, 'body'), createUserHandler);
router.get('/', listUsersHandler);

export default router;
