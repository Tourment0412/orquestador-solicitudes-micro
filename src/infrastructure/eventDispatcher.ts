import { Evento } from '../models/evento.model';
import { registroUsuario,recuperacionContrasena,autenticacionClaves,autenticacion } from '../services/user.service';

export async function handleEvent(event: Evento): Promise<void> {
  console.log("🔎 eventDispatcher - evento recibido:");
  console.log(event);
  switch (event.tipoAccion) {
    case "REGISTRO_USUARIO":
      registroUsuario(event);
      break;

    case "RECUPERAR_PASSWORD":
      recuperacionContrasena(event);
      break;

    case "AUTENTICACION_CLAVES":
      autenticacionClaves(event);
      break;

    case "AUTENTICACION":
      autenticacion(event);
      break;

    default:
      console.warn(`⚠️ Acción desconocida: ${event.tipoAccion}`);
      break;
  }
}
