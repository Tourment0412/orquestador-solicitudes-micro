import { v4 as uuid } from 'uuid';
import { CreateUserInput, User } from '../models/user.model';
import { Evento } from '../models/evento.model';

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

export async function registroUsuario(event: Evento) {
  console.log("registroUsuario");
}

export async function recuperacionContrasena(event: Evento) {
  console.log("recuperacionContrasena");
}

export async function autenticacionClaves(event: Evento) {
  console.log("autenticacionClaves");
}

export async function autenticacion(event: Evento) {
  console.log("autenticacion");
}
