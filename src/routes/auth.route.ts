import express from 'express';
import { loginUser } from '../controller/auth.controller';

const router = express.Router();

router.post('/login', loginUser);
