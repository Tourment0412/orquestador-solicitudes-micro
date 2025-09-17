// src/infrastructure/rabbitmq/consumer.ts
import { getChannel } from "./rabbitmq";
import { handleEvent } from "./eventDispatcher";
import { Channel, ConsumeMessage } from "amqplib";

const QUEUE_NAME = "orchestrator.queue";

export async function startConsumer() {
  const channel = await getChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`📥 Escuchando mensajes en ${QUEUE_NAME}...`);

  interface Event {
    // Define the expected structure of your event here
    // For example:
    // type: string;
    // payload: any;
    [key: string]: unknown;
  }

  channel.consume(
    QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const event: Event = JSON.parse(msg.content.toString());
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

