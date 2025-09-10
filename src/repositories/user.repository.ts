import prisma from '../prisma/client';
import type { EntityUser } from '@prisma/client';

export class UserRepository {
  async createUser(data: { name: string; email: string }): Promise<EntityUser> {
    return prisma.entityUser.create({ data });
  }

  async findAll(): Promise<EntityUser[]> {
    return prisma.entityUser.findMany();
  }

  async findByEmail(email: string): Promise<EntityUser | null> {
    return prisma.entityUser.findUnique({ where: { email } });
  }
}
