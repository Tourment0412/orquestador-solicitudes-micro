// src/infrastructure/rabbitmq/eventDispatcher.ts
import * as userService from "../services/user.service";

export async function handleEvent(event: any) {
  switch (event.type) {
    case "CREATE_USER":
      console.log("➡️ Dispatcher: creando usuario...");
      return userService.createUser(event.payload);

    case "DELETE_USER":
      console.log("➡️ Dispatcher: eliminando usuario...");
      //return userService.deleteUser(event.payload.id);
      return userService.createUser(event.payload);//Hasta que se cambie por el de eliminar

    default:
      console.warn("⚠️ Tipo de evento no reconocido:", event.type);
  }
}
