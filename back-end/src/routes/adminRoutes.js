// routes/adminRoutes.js
import express from 'express';
import { verifyUser } from '../middleware/auth.js';
import { checkIfAdmin, requireAdmin } from '../middleware/admin.js';
import {
  deleteUserByUid,
  deleteUserByBody,
  disableUser,
  enableUser,
  listAllUsers,
  searchUserByEmail
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', verifyUser, checkIfAdmin, requireAdmin, listAllUsers);
router.get('/search-user', verifyUser, checkIfAdmin, requireAdmin, searchUserByEmail);
router.delete('/users/:uid', verifyUser, checkIfAdmin, requireAdmin, deleteUserByUid);
router.post('/delete-user', verifyUser, checkIfAdmin, requireAdmin, deleteUserByBody);
router.post('/disable-user', verifyUser, checkIfAdmin, requireAdmin, disableUser);
router.post('/enable-user', verifyUser, checkIfAdmin, requireAdmin, enableUser);

export default router;