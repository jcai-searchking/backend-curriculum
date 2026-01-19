import { Router } from 'express';
import { getMe } from './users.controller';

const router = Router();

router.get('/me', getMe);

export default router;
