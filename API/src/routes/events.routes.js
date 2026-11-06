import { Router } from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  deleteEventImage,
  getStats,
} from '../controllers/events.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { uploadEventImages } from '../middleware/upload.middleware.js';

const router = Router();

router.use(verifyToken);

const imageFields = uploadEventImages.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'gallery', maxCount: 5 },
]);

router.get('/stats', getStats);
router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', imageFields, createEvent);
router.put('/:id', imageFields, updateEvent);
router.patch('/:id/status', updateEventStatus);
router.delete('/:id', deleteEvent);
router.delete('/:id/images/:imageId', deleteEventImage);

export default router;
