// routes/profileRoutes.js
import express from 'express';
import { verifyUser } from '../middleware/auth.js';
import {
  updateProfilePhoto,
  updateProfilePhotoAlt,
  getUserProfile,
  setUsername,
  updateUsername
} from '../controllers/profileController.js';

const router = express.Router();

router.post('/update-photo', verifyUser, updateProfilePhoto);
router.post('/updatePhoto', verifyUser, updateProfilePhotoAlt);
router.get('/:uid', getUserProfile);

export default router;