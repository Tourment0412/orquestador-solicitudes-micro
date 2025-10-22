// src/server.ts
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import pinoHttp from 'pino-http';
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middlewares/error.middleware";

import { connectRabbit } from "./infrastructure/rabbitmq";
import { startConsumer } from "./infrastructure/consumer";
import { logger } from './infrastructure/logger';

dotenv.config();

const app = express();

app.use(pinoHttp({
  logger,
  redact: { paths: ['req.headers.authorization', 'password', 'token'], remove: true },
  genReqId: (req) => req.headers['x-request-id'] as string || Math.random().toString(16).slice(2)
}));

// ejemplo de log de negocio
app.get('/health', (req, res) => {
  req.log.info({ component: 'health' }, 'health_checked');
  res.json({ status: 'ok' });
});

app.use(express.json());

app.use("/api/v1/users", userRoutes);

// health
app.get("/health", (req: Request, res: Response) => res.json({ ok: true }));

// Endpoints de notificaciones (RESTful)
app.post("/api/v1/notifications", (req: Request, res: Response) => {
  res.json({ message: "Endpoint de notificaciones - implementar lógica de orquestación" });
});

app.post("/api/v1/notifications/multi", (req: Request, res: Response) => {
  res.json({ message: "Endpoint de notificaciones multi-canal - implementar lógica de orquestación" });
});

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  logger.info({ msg: 'server_listening', url: `http://localhost:${PORT}` });

  try {
    await connectRabbit();
    await startConsumer();
    logger.info({ msg: 'rabbit_connected' });
  } catch (err) {
    logger.error({ msg: 'rabbit_connect_error', err });
  }
});
