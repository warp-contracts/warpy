import express from 'express';
import { health } from './routes/health';
import { handlers } from './routes/handlers';

const router = express.Router();

router.get('/v1/health', health);
router.get('/v1/handlers', handlers);

export default router;
