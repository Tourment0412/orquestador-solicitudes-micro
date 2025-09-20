// src/worker.ts
import { connectRabbit } from "./infrastructure/rabbitmq";
import { startConsumer } from "./infrastructure/consumer";
import { publishMessage } from "./infrastructure/publisher";

(async () => {
  await connectRabbit();   // 1. Conecta a RabbitMQ
  startConsumer();         // 2. Arranca el consumidor para escuchar la cola "orquestador.queue"

  // 3. Ejemplo: envía un mensaje de notificación
  await publishMessage("notifications.queue", {
    channel: "email",
    destination: "user@example.com",
    message: "Contenido",
    subject: "Bienvenido",
    metadata: { tenantId: "acme", template: "welcome" }
  });
})();
