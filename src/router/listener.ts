import express from 'express';
import { usernames } from '../routes/listener/usernames';
import { health } from '../routes/listener/health';
import { userRoles } from '../routes/listener/userRoles';
import { usersRoles } from '../routes/listener/usersRoles';

const router = express.Router();

router.get('/v1/usernames', usernames);
router.get('/v1/userRoles', userRoles);
router.post('/v1/usersRoles', usersRoles);
router.get('/v1/health', health);

export default router;
