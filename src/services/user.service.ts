import { v4 as uuid } from 'uuid';
import { CreateUserInput, User } from '../models/user.model';
import { Evento } from '../models/evento.model';
import { publishMessage } from "../infrastructure/publisher";
import { UtilidadesService } from "./utilities.service";

const users: User[] = [];

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

  await publishMessage("notifications.queue", {
    destination: {
    email: event.payload.correo
  },
  message: {
    email: UtilidadesService.renderTemplate("registration_confirmation.html", {
      usuario: event.payload.usuario,
      correo: event.payload.correo
    })
  },
  subject: "Confirmacion de activacion de cuenta"
  });
}

export async function autenticacion(event: Evento) {
  console.log("autenticacion");
  
  await publishMessage("notifications.queue", {
    destination: {
    email: event.payload.correo,
    sms: event.payload.numeroTelefono
  },
  message: {
    email: UtilidadesService.renderTemplate("security_alert.html", {
      usuario: event.payload.usuario,
      correo: event.payload.correo,
      fecha: formatearFechaGeneral(event.payload.fecha)
    }),
    sms: "Mensaje de texto para SMS"
  },
  subject: "Inicio de sesión realizado en la cuenta"
  });
}

export async function recuperacionContrasena(event: Evento) {
  console.log("recuperacionContrasena");

  await publishMessage("notifications.queue", {
    destination: {
    email: event.payload.correo
  },
  message: {
    email: UtilidadesService.renderTemplate("change_request.html", {
      usuario: event.payload.usuario,
      correo: event.payload.correo,
      codigo: event.payload.codigo
    })
  },
  subject: "Solicitud de Cambio de Contraseña"
  });
}

export async function autenticacionClaves(event: Evento) {
  console.log("autenticacionClaves");

  await publishMessage("notifications.queue", {
    destination: {
    email: event.payload.correo,
    sms: event.payload.numeroTelefono
  },
  message: {
    email: UtilidadesService.renderTemplate("system_notification.html", {
      usuario: event.payload.usuario,
      correo: event.payload.correo,
      fecha: formatearFechaGeneral(event.payload.fecha)
    }),
    sms: "Mensaje de texto para SMS"
  },
  subject: "Cambio de Contraseña"
  });
}


