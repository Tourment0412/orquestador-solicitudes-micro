import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middlewares/error.middleware';
import { connectRabbit, consumeMessages } from './infrastructure/rabbitmq';

dotenv.config();

const app = express();
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/users', userRoutes);

// health
app.get('/health', (req: Request, res: Response) => res.json({ ok: true }));

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  // 🔌 Conectar a RabbitMQ
  try {
    await connectRabbit();

    // 🔔 Configurar consumo de mensajes
    consumeMessages((msg) => {
      // Aquí decides qué hacer con el mensaje recibido
      console.log("Mensaje procesado en server.ts:", msg);

      // Ejemplo: podrías despachar según tipo de evento
      if (msg.type === "CREATE_USER") {
        console.log("➡️ Acción: crear usuario con data", msg.payload);
        // Podrías llamar al userService.createUser(msg.payload) directamente
      }
    });
  } catch (err) {
    console.error("❌ Error inicializando RabbitMQ:", err);
  }
});
