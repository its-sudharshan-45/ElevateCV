import { Router } from 'express';
import { aiModelsRouter } from '../modules/ai-models/ai-models.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { notificationRouter } from '../modules/notification/notification.routes.js';
import { profileRouter } from '../modules/profile/profile.routes.js';
import { resumeRouter } from '../modules/resume/resume.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/resumes', resumeRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/ai/models', aiModelsRouter);


