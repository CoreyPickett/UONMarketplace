// Check for valid MongoDB ID to avoid crashes
import { ObjectId } from 'mongodb';

export function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}