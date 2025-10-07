// routes/userRoutes.js
import express from 'express';
import { verifyUser } from '../middleware/auth.js';
import {
  setUsername,
  updateUsername
} from '../controllers/profileController.js'; // or split into userController.js if preferred

const router = express.Router();

router.post('/setUsername', verifyUser, setUsername);
router.put('/updateUsername', verifyUser, updateUsername);

export default router;