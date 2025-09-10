import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { CreateUserInput } from '../models/user.model';

export async function createUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body as CreateUserInput; // ya validado por middleware
    const user = await userService.createUser(payload);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function listUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}
