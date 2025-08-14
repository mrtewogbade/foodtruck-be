import express from 'express';
import { registerHandler, loginHandler, verifyEmailHandler} from '../controller/auth.controller';
import Limiter from '../middleware/rateLimit';
import validate from '../middleware/validateZod';
import { registerSchema, loginSchema,  } from '../validations/authValidation';

const router = express.Router();

router.post('/register', Limiter, validate(registerSchema), registerHandler);
router.post('/verify-email', Limiter, verifyEmailHandler);
router.post('/login', Limiter, validate(loginSchema), loginHandler);

export default router;
