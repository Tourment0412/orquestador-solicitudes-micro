// src/infrastructure/rabbitmq/consumer.ts
import { getChannel } from "./rabbitmq";
import { handleEvent } from "./eventDispatcher";

const QUEUE_NAME = "orchestrator.queue";

export async function startConsumer() {
  const channel = await getChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`📥 Escuchando mensajes en ${QUEUE_NAME}...`);

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handleEvent(event);
          channel.ack(msg);
        } catch (err) {
          console.error("❌ Error procesando mensaje:", err);
          channel.nack(msg, false, false); // rechazar
        }
      }
    },
    { noAck: false }
  );
}

