import { v4 as uuid } from 'uuid';
import { CreateUserInput, User } from '../models/user.model';
import { Evento } from '../models/evento.model';
import { publishMessage } from "../infrastructure/publisher";
import { UtilidadesService } from "./utilities.service";
import {UserRepository} from '../repositories/user.repository';
import { log } from 'console';
import { MessageTemplates } from '../templates/messageTemplates';

const users: User[] = [];
const repo = new UserRepository();
const undefinedToNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

function formatearFechaISO(iso: string, timeZone = "UTC"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid ISO date string: " + iso);

  // 'es-CO' produce día/mes/año en el orden deseado (17/09/2025)
  const fmt = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  });

  return fmt.format(d); // -> "17/09/2025"
}

function formatearHoraISO(iso: string, timeZone = "UTC"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid ISO date string: " + iso);

  // Usamos formatToParts para obtener 'hour', 'minute' y 'dayPeriod' de forma portable
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).formatToParts(d);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dayPeriodRaw = parts.find((p) => p.type === "dayPeriod")?.value ?? "";

  // Normalizamos dayPeriod a 'a.m' o 'p.m' (minúsculas, sin punto final extra)
  const isPM = /p/i.test(dayPeriodRaw);
  const ampm = isPM ? "p.m" : "a.m";

  // Resultado ejemplo: "4:38 p.m"
  return `${hour}:${minute} ${ampm}`;
}

function formatearFechaGeneral(fecha:string) : string {
  const fechaStr = formatearFechaISO(fecha);
  const horaStr = formatearHoraISO(fecha);
  return `${fechaStr} a las ${horaStr}`;
}

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
  const data: any = (event as any).payload ?? event;
  guardarEvento(event);
  await publishMessage("notifications.queue", {
    destination: {
    email: data.correo
  },
  message: {
    email: UtilidadesService.renderTemplate("registration_confirmation.html", {
      usuario: data.usuario,
      correo: data.correo
    })
  },
  subject: MessageTemplates.SUBJECT_REGISTRATION
  });
}

export async function autenticacion(event: Evento) {
  console.log("autenticacion");
  const data: any = (event as any).payload ?? event;
  guardarEvento(event);
  await publishMessage("notifications.queue", {
    destination: {
    email: data.correo,
    sms: data.numeroTelefono
  },
  message: {
    email: UtilidadesService.renderTemplate("security_alert.html", {
      usuario: data.usuario,
      correo: data.correo,
      fecha: formatearFechaGeneral(data.fecha)
    }),
    sms: UtilidadesService.renderStringTemplate(MessageTemplates.LOGIN_MESSAGE, {
      usuario: data.usuario,
      correo: data.correo,
      fecha: formatearFechaGeneral(data.fecha)
    })
  },
  subject: MessageTemplates.SUBJECT_LOGIN
  });
}

export async function recuperacionContrasena(event: Evento) {
  console.log("recuperacionContrasena");
  const data: any = (event as any).payload ?? event;
  guardarEvento(event);
  await publishMessage("notifications.queue", {
    destination: {
    email: data.correo
  },
  message: {
    email: UtilidadesService.renderTemplate("change_request.html", {
      usuario: data.usuario,
      correo: data.correo,
      codigo: data.codigo
    })
  },
  subject: MessageTemplates.SUBJECT_PASSWORD_CHANGE_REQUEST
  });
}

export async function autenticacionClaves(event: Evento) {
  console.log("autenticacionClaves");
  const data: any = (event as any).payload ?? event;
  guardarEvento(event);
  await publishMessage("notifications.queue", {
    destination: {
    email: data.correo,
    sms: data.numeroTelefono
  },
  message: {
    email: UtilidadesService.renderTemplate("system_notification.html", {
      usuario: data.usuario,
      correo: data.correo,
      fecha: formatearFechaGeneral(data.fecha)
    }),
    sms: UtilidadesService.renderStringTemplate(MessageTemplates.PASSWORD_CHANGE_MESSAGE, {
      usuario: data.usuario,
      correo: data.correo,
      fecha: formatearFechaGeneral(data.fecha)
    })
  },
  subject: MessageTemplates.SUBJECT_PASSWORD_CHANGE
  });
}

export async function guardarEvento(evt: Evento) {
  const payloadData: any = (evt as any).payload ?? evt;
  console.log(payloadData);
  const { usuario, correo, numeroTelefono, codigo, fecha } = payloadData;
  let fechaDate;
  if (fecha !== undefined && fecha !== null) {
    const parsed = new Date(fecha);
    fechaDate = parsed;
    if (!isNaN(parsed.getTime())) {
      fechaDate = parsed;
    } else {
      throw new Error('fecha no es válida');
    }
  }
  
  const record = {
    id: evt.id,
    tipoAccion: evt.tipoAccion,
    timestamp: evt.timestamp,
    usuario,
    correo: undefinedToNull(correo),
    numeroTelefono: undefinedToNull(numeroTelefono),
    codigo: undefinedToNull(codigo),
    fecha: undefinedToNull(fechaDate),
  };

  // Llamada al repo
  const saved = await repo.createEvento(record);
  return saved;
}
