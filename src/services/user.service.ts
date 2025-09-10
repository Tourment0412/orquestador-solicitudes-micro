import { v4 as uuid } from 'uuid';
import { CreateUserInput, User } from '../models/user.model';

const users: User[] = [];

export async function createUser(payload: CreateUserInput): Promise<User> {
  const user: User = {
    id: uuid(),
    name: payload.name,
    email: payload.email,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  return users;
}
