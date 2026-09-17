import { Request, Response } from 'express';
import { AppError } from '../../utils/errors.js';
import { getRouteParam } from '../../utils/route-params.js';
import {
  compareVersionsQuerySchema,
  createResumeVersionSchema,
} from './resume-version.schema.js';
import { resumeVersionService } from './resume-version.service.js';

export async function createVersion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const resumeId = getRouteParam(req.params, 'resumeId');
  const body = createResumeVersionSchema.parse(req.body);

  const version = await resumeVersionService.createVersion({
    resumeId,
    userId: req.user.id,
    title: body.title,
    changesSummary: body.changesSummary,
  });

  res.status(201).json({ version });
}

export async function listVersions(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const resumeId = getRouteParam(req.params, 'resumeId');
  const versions = await resumeVersionService.listVersions(resumeId, req.user.id);

  res.status(200).json({ versions });
}

export async function getVersion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const versionId = getRouteParam(req.params, 'versionId');
  const version = await resumeVersionService.getVersion(versionId, req.user.id);

  res.status(200).json({ version });
}

export async function compareVersions(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const query = compareVersionsQuerySchema.parse(req.query);
  const comparison = await resumeVersionService.compareVersions(
    query.versionA,
    query.versionB,
    req.user.id,
  );

  res.status(200).json({ comparison });
}

export async function deleteVersion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_ERROR');
  }

  const versionId = getRouteParam(req.params, 'versionId');
  await resumeVersionService.deleteVersion(versionId, req.user.id);

  res.status(204).send();
}
