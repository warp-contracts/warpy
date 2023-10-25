import express from 'express';
import { usernames } from '../routes/listener/usernames';

const router = express.Router();

router.get('/v1/handlers', usernames);

export default router;
