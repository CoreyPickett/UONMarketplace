// routes/saveRoutes.js
import express from 'express';
import { verifyUser } from '../middleware/auth.js';
import {
  getSavedItems,
  saveItem,
  unsaveItem
} from '../controllers/saveController.js';

const router = express.Router();

router.get('/', verifyUser, getSavedItems);
router.post('/:id', verifyUser, saveItem);
router.delete('/:id', verifyUser, unsaveItem);

export default router;