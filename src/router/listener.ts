import express from 'express';
import { usernames } from '../routes/listener/usernames';
import { health } from '../routes/listener/health';
import { userRoles } from '../routes/listener/userRoles';

const router = express.Router();

router.get('/v1/usernames', usernames);
router.get('/v1/userRoles', userRoles);
router.get('/v1/health', health);

export default router;
