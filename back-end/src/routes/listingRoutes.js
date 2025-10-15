// routes/listingRoutes.js
import express from 'express';
import { verifyUser } from '../middleware/auth.js';
import {
  getListingById,
  createListing,
  getS3UploadUrl,
  upvoteListing,
  addComment,
  deleteListing,
  editListing,
  markListingAsSold
} from '../controllers/listingController.js';

const router = express.Router();

router.get('/s3-upload-url', getS3UploadUrl);
router.get('/:id', getListingById);
router.post('/create-listing', verifyUser, createListing);
router.post('/:id/upvote', verifyUser, upvoteListing);
router.post('/:id/comments', verifyUser, addComment);
router.post('/:id/sell', verifyUser, markListingAsSold);
router.delete('/:id', verifyUser, deleteListing);
router.put('/:id', verifyUser, editListing);

export default router;