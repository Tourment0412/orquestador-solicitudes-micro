/**
 * handleEvent - por ahora solo imprime el evento recibido.
 * Más adelante puedes convertir esto en un dispatch a handlers específicos.
 */
export async function handleEvent(event: any): Promise<void> {
  console.log("🔎 eventDispatcher - evento recibido:");
  console.log(JSON.stringify(event, null, 2));
  // Aquí podrías llamar a tus services (userService, etc.) según event.tipoAccion / routingKey
}
