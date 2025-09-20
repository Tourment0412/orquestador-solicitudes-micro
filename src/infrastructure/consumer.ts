// src/infrastructure/rabbitmq/consumer.ts
import { getChannel } from "./rabbitmq";
import { handleEvent } from "./eventDispatcher";
import { ConsumeMessage } from "amqplib";

const QUEUE_NAME = "orquestador.queue"; // ajustado a definitions.json

export async function startConsumer() {
  const channel = await getChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`📥 Escuchando mensajes en ${QUEUE_NAME}...`);

  await channel.consume(
    QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const raw = msg.content.toString();
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          // si no es JSON válido, lo dejamos como string
          parsed = raw;
        }

        // Imprimimos lo recibido (de forma legible)
        console.log("📩 Mensaje recibido (raw):", raw);
        console.log("📩 Mensaje recibido (parsed):", JSON.stringify(parsed, null, 2));

        // Llamamos al dispatcher (en este caso sólo imprime)
        await handleEvent(parsed);

        // Confirmamos
        channel.ack(msg);
      } catch (err) {
        console.error("❌ Error procesando mensaje:", err);
        // Rechazamos sin requeue -> irá a DLX si la cola lo tiene configurado
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}
