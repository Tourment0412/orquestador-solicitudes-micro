import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (
  schema: ZodSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[property as keyof Request]);
      // Sobrescribimos el valor con los datos validados
      (req as any)[property] = parsed;
      next();
    } catch (err: any) {
      return res.status(400).json({
        errors: err.errors ?? err.message,
      });
    }
  };
};
