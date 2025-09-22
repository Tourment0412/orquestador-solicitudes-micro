import prisma from '../prisma/client';
import type { EntityUser,Evento as PrismaEvento } from '../generated/prisma';

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

  async createEvento (data: {
    id: string;
    tipoAccion: string;
    timestamp: string;
    usuario: string;
    correo: string;
    numeroTelefono: string;
    codigo: string;
    fecha: Date;
  }): Promise<PrismaEvento> {
    return prisma.evento.create({
      data: {
        id: data.id,
        tipoAccion: data.tipoAccion,
        timestamp: data.timestamp,
        usuario: data.usuario,
        correo: data.correo,
        numeroTelefono: data.numeroTelefono,
        codigo: data.codigo,
        fecha: data.fecha,
      },
    });
  };

}
