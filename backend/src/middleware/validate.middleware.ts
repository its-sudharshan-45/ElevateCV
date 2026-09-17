import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects, ZodTypeAny } from 'zod';

type ZodSchema = AnyZodObject | ZodEffects<ZodTypeAny>;

type RequestLocation = 'body' | 'query' | 'params';

export function validateRequest(schema: ZodSchema, location: RequestLocation = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      next(result.error);
      return;
    }

    req[location] = result.data;
    next();
  };
}
