import * as amqp from "amqplib";

const RABBIT_URL = process.env.RABBITMQ_URL ?? "amqp://orchestrator_user:orch_pass@localhost:5672/foro";

let connection: any = null; // intentionally any to avoid mismatched-declaration issues
let channel: any = null;

export async function connectRabbit(): Promise<amqp.Channel> {
  if (channel) return channel as amqp.Channel;

  try {
    // obtén la conexión (la implementación real tiene createChannel, pero el .d.ts a veces no coincide)
    const rawConn = await amqp.connect(RABBIT_URL);
    connection = rawConn as any; // as any para evitar error de "ChannelModel vs Connection"

    // ahora sí creamos el canal usando la implementación real (sin que TS se queje)
    channel = await (connection as any).createChannel();

    // aseguramos colas
    await (channel as amqp.Channel).assertQueue("orquestador.queue", { durable: true });
    await (channel as amqp.Channel).assertQueue("notifications.queue", {
      durable: true,
      arguments: { "x-dead-letter-exchange": "dlx" },
    });

    // prefetch opcional
    if (typeof (channel as amqp.Channel).prefetch === "function") {
      (channel as amqp.Channel).prefetch(5);
    }

    // cierre ordenado en señales
    process.once("SIGINT", closeRabbit);
    process.once("SIGTERM", closeRabbit);

    console.log(`✔️ Conectado a RabbitMQ en ${RABBIT_URL}`);
    return channel as amqp.Channel;
  } catch (err) {
    // limpiamos referencias para reintentos
    connection = null;
    channel = null;
    console.error("❌ Error conectando a RabbitMQ:", err);
    throw err;
  }
}

export function getChannel(): amqp.Channel {
  if (!channel) throw new Error("RabbitMQ no está conectado. Llama a connectRabbit() primero.");
  return channel as amqp.Channel;
}

export function getConnection(): amqp.Connection {
  if (!connection) throw new Error("RabbitMQ no está conectado. Llama a connectRabbit() primero.");
  return connection as amqp.Connection;
}

export async function closeRabbit(): Promise<void> {
  try {
    if (channel) {
      await (channel as amqp.Channel).close();
      channel = null;
    }
    if (connection) {
      // usamos any para evitar "Property 'close' does not exist on type 'Connection'"
      await (connection as any).close();
      connection = null;
    }
    console.log("🔌 Conexión RabbitMQ cerrada.");
  } catch (err) {
    console.warn("⚠️ Error cerrando RabbitMQ:", err);
  }
}
