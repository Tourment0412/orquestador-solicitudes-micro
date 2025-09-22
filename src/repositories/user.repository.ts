import prisma from '../prisma/client';
import type { EntityUser, Evento as PrismaEvento } from '@prisma/client';

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

  async createEvento(data: {
    id: string;
    tipoAccion: string;
    timestamp: string;
    usuario: string;
    correo: string | null;
    numeroTelefono: string | null;
    codigo: string | null;
    fecha: Date | null;
  }): Promise<PrismaEvento> {
    return prisma.evento.create({
      data: {
        id: data.id,
        tipoAccion: data.tipoAccion,
        timestamp: data.timestamp,
        usuario: data.usuario ?? undefined,            // acepta string | null
        correo: data.correo ?? undefined,              // acepta string | null
        numeroTelefono: data.numeroTelefono ?? undefined,
        codigo: data.codigo ?? undefined,
        fecha: data.fecha ?? undefined,                // Date | null
      },
    });
  }

}
