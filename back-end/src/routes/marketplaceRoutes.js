// routes/marketplaceRoutes.js
import express from 'express';
import {
  getAllListings,
  searchListings,
  getSoldListings,
  getPurchasedListings
} from '../controllers/marketplaceController.js';

const router = express.Router();

router.get('/', getAllListings);
router.get('/search', searchListings);
router.get('/sold', getSoldListings);
router.get('/purchases', getPurchasedListings);

export default router;