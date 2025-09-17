import amqp from "amqplib";

const RABBIT_URL = "amqp://orchestrator:orchestrator_password@localhost:5672"; 
const QUEUE_NAME = "orchestrator.queue";

let channel: amqp.Channel;

export async function connectRabbit() {
  const conn = await amqp.connect(RABBIT_URL);
  channel = await conn.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log(`✔️ Conectado a RabbitMQ, escuchando la cola: ${QUEUE_NAME}`);
  return channel;
}

export function consumeMessages(onMessage: (msg: any) => void) {
  if (!channel) throw new Error("RabbitMQ no está inicializado");
  
  channel.consume(
    QUEUE_NAME,
    (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        try {
          const parsed = JSON.parse(content);
          console.log("📥 Mensaje recibido:", parsed);

          onMessage(parsed);

          // Confirmar que el mensaje fue procesado
          channel.ack(msg);
        } catch (err) {
          console.error("❌ Error procesando mensaje:", err);
          // Rechazar y mandar a DLX si está configurado
          channel.nack(msg, false, false);
        }
      }
    },
    { noAck: false }
  );
}