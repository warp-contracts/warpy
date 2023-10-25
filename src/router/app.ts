import express from 'express';
import { health } from '../routes/app/health';

const router = express.Router();

router.get('/v1/health', health);

export default router;
