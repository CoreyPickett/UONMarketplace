// routes/marketplaceRoutes.js
import express from 'express';
import {
  getAllListings,
  searchListings
} from '../controllers/marketplaceController.js';

const router = express.Router();

router.get('/', getAllListings);
router.get('/search', searchListings);

export default router;