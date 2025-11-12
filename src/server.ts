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

// Track start time for uptime calculation
const START_TIME = new Date();

app.use(pinoHttp({
  logger,
  redact: { paths: ['req.headers.authorization', 'password', 'token'], remove: true },
  genReqId: (req) => req.headers['x-request-id'] as string || Math.random().toString(16).slice(2)
}));

app.use(express.json());

// Health check endpoints
app.get('/health', (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
  res.json({
    status: 'UP',
    version: '1.0.0',
    uptime: uptimeSeconds,
    checks: [
      {
        name: 'Application',
        status: 'UP',
        data: {
          from: START_TIME.toISOString(),
          status: 'RUNNING'
        }
      }
    ]
  });
});

app.get('/health/ready', (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
  
  // For readiness, check critical dependencies (RabbitMQ, Database)
  // TODO: Add actual health checks for RabbitMQ and DB
  const isReady = true; // Placeholder
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'UP' : 'DOWN',
    version: '1.0.0',
    uptime: uptimeSeconds,
    checks: [
      {
        data: {
          from: START_TIME.toISOString(),
          status: 'READY'
        },
        name: 'Readiness check',
        status: isReady ? 'UP' : 'DOWN'
      }
    ]
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME.getTime()) / 1000);
  
  res.json({
    status: 'UP',
    version: '1.0.0',
    uptime: uptimeSeconds,
    checks: [
      {
        data: {
          from: START_TIME.toISOString(),
          status: 'ALIVE'
        },
        name: 'Liveness check',
        status: 'UP'
      }
    ]
  });
});

app.use("/api/v1/users", userRoutes);

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
