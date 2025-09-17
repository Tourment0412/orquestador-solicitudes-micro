
import { connect } from "amqplib";


const RABBIT_URL = "amqp://orchestrator_user:orch_pass@localhost:5672";
const QUEUE_NAME = "orquestador.queue";

let connection: any;
let channel: any;
// Exponer la conexión si se necesita en otros módulos
export function getConnection() {
  if (!connection) throw new Error("❌ RabbitMQ no está conectado aún.");
  return connection;
}

export async function connectRabbit() {
  if (channel) return channel;

  connection = await connect(RABBIT_URL);   // 👈 ahora sí es un Connection
  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`✔️ Conectado a RabbitMQ (cola: ${QUEUE_NAME})`);
  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("❌ RabbitMQ no está conectado aún.");
  return channel;
}

export async function closeRabbit() {
  if (channel) await channel.close();
  if (connection) await connection.close();
  console.log("🔌 Conexión RabbitMQ cerrada.");
}
