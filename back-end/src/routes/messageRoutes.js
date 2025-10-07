// routes/messageRoutes.js
import express from 'express';
import { verifyUser } from '../middleware/auth.js';
import {
  startConversation,
  getAllThreads,
  getThreadById,
  sendMessage,
  markThreadAsRead,
  deleteThread
} from '../controllers/messageController.js';

const router = express.Router();

router.post('/start', verifyUser, startConversation);
router.get('/', verifyUser, getAllThreads);
router.get('/:id', verifyUser, getThreadById);
router.post('/:id/messages', verifyUser, sendMessage);
router.post('/:id/read', verifyUser, markThreadAsRead);
router.delete('/:id', verifyUser, deleteThread);

export default router;