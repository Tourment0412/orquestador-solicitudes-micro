// src/infrastructure/rabbitmq/publisher.ts
import { getChannel } from "./rabbitmq";

/**
 * publishMessage - publica un mensaje a una cola (notifications.queue por defecto).
 * Imprime en consola el mensaje que se está enviando.
 */
export async function publishMessage(queue = "notifications.queue", message: any) {
  const channel = await getChannel();
  await channel.assertQueue("notifications.queue", {
    durable: true,
    arguments: { "x-dead-letter-exchange": "dlx" }
  });

  const payload = Buffer.from(JSON.stringify(message));

  const ok = channel.sendToQueue(queue, payload, {
    persistent: true,
    contentType: "application/json",
  });

  // Log claro de lo que se envió
  console.log(`📤 Mensaje enviado a ${queue}:`);
  console.log(JSON.stringify(message, null, 2));

  if (!ok) {
    // sendToQueue devuelve boolean; si es false, el buffer está "lleno" y el mensaje se quedó en memoria
    console.warn("⚠️ sendToQueue returned false (buffered). El mensaje quedará en buffer hasta reconexión o flushing.");
  }
}
