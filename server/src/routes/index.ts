import { Router } from 'express';
import { search } from './Search';

// Search route
const searchRouter = Router();
searchRouter.post('/search', search);

// Export the base-router
const baseRouter = Router();
baseRouter.use('/search', searchRouter);
export default baseRouter;
