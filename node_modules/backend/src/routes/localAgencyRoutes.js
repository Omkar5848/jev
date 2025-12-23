// backend/src/routes/localAgencyRoutes.js
import { Router } from 'express';
import { list, create, update, remove } from '../controllers/localAgencyController.js';

const router = Router();

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
