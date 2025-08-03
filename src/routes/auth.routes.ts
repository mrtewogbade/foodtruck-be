import express from 'express';
import { registerHandler } from '../controller/auth.controller';
import Limiter from '../middleware/rateLimit';
import validate from '../middleware/validateZod';
import { registerSchema } from '../validations/authValidation';

const router = express.Router();

router.post('/register', Limiter, validate(registerSchema), registerHandler);



export default router;
