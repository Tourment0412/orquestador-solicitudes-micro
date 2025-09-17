// src/infrastructure/rabbitmq/publisher.ts
import { getChannel } from "./rabbitmq";

//------------------------------------------------------------------------------------------
//TODO Se debe cambiar este codigo


export async function publishMessage(queue: string, message: any) {
  const channel = await getChannel();
  await channel.assertQueue(queue, { durable: true });

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });

  console.log(`📤 Mensaje publicado en ${queue}:`, message);
}

