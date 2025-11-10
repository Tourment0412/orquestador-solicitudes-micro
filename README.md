# Orquestador de Solicitudes Microservice

Microservicio desarrollado en Node.js con TypeScript y Express que actúa como orquestador central para la gestión de eventos de dominio y notificaciones. Consume eventos de RabbitMQ, aplica reglas de negocio, selecciona canales de notificación y publica mensajes listos para entrega.

## Descripción General

El Orquestador de Solicitudes es el componente central que procesa eventos de dominio provenientes de los microservicios, aplica reglas de orquestación, selecciona canales de notificación apropiados, resuelve plantillas de mensajes y publica mensajes listos para entrega en RabbitMQ para que el servicio de notificaciones los procese.

## Funcionalidades

- Consumo de eventos de dominio desde RabbitMQ
- Procesamiento de eventos según tipo de acción
- Aplicación de reglas de orquestación
- Selección de canales de notificación
- Resolución de plantillas de mensajes
- Publicación de mensajes listos para entrega

## Arquitectura

### Componentes Principales

- **API Express**: Endpoints HTTP para gestión de usuarios y configuración
- **Event Dispatcher**: Distribuidor de eventos según tipo de acción
- **Services**: Lógica de negocio para procesamiento de eventos
- **Consumer**: Consumidor de RabbitMQ que recibe eventos de dominio
- **Worker**: Procesador de tareas asíncronas
- **Infrastructure**: Configuración de RabbitMQ, logging y validación

### Tecnologías

- Node.js
- TypeScript
- Express
- Prisma (ORM)
- PostgreSQL
- amqplib (Cliente RabbitMQ)
- Handlebars (Motor de plantillas)
- Zod (Validación de esquemas)
- Pino (Logger estructurado)
- UUID

## Endpoints de la API

### Gestión de Usuarios

#### Crear Usuario

- **Endpoint**: `POST /users`
- **Descripción**: Crea un nuevo usuario en el sistema
- **Autenticación**: No requerida (o según configuración)

**Request Body**:
```json
{
  "usuario": "testuser",
  "correo": "test@example.com",
  "numeroTelefono": "+573001234567"
}
```

#### Listar Usuarios

- **Endpoint**: `GET /users`
- **Descripción**: Lista todos los usuarios registrados
- **Autenticación**: No requerida (o según configuración)

### Health Checks

#### Health Endpoint

- **Endpoint**: `GET /health`
- **Descripción**: Verifica el estado de salud del servicio
- **Autenticación**: No requerida

**Response**:
```json
{
  "status": "UP",
  "uptime": 3600,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Tipos de Eventos Procesados

El orquestador procesa los siguientes tipos de eventos:

- **REGISTRO_USUARIO**: Procesa registro de nuevos usuarios
- **AUTENTICACION**: Procesa eventos de autenticación
- **RECUPERAR_PASSWORD**: Procesa solicitudes de recuperación de contraseña
- **AUTENTICACION_CLAVES**: Procesa eventos de cambio de contraseña

## Configuración

### Variables de Entorno

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/orchestrator

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=orchestrator_user
RABBITMQ_PASSWORD=orch_pass
RABBITMQ_VHOST=foro
RABBITMQ_EXCHANGE=dominio.events
RABBITMQ_QUEUE=orchestrator.queue
RABBITMQ_ROUTING_KEY=auth.*

# Notifications
NOTIFICATIONS_EXCHANGE=orquestador.events
NOTIFICATIONS_ROUTING_KEY=notifications.created

# Logging
LOG_LEVEL=info
```

## Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar worker
npm run worker:dev
```

### Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar servidor
npm start

# Ejecutar worker
npm run worker:start
```

## Estructura del Proyecto

```
orquestador-solicitudes-micro/
├── src/
│   ├── server.ts
│   ├── worker.ts
│   ├── routes/
│   │   └── user.routes.ts
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── services/
│   │   ├── user.service.ts
│   │   └── utilities.service.ts
│   ├── infrastructure/
│   │   ├── rabbitmq.ts
│   │   ├── consumer.ts
│   │   ├── eventDispatcher.ts
│   │   ├── logger.ts
│   │   └── validate.middleware.ts
│   ├── models/
│   │   └── evento.model.ts
│   └── middlewares/
│       └── error.middleware.ts
├── prisma/
│   └── schema.prisma
├── docs/
│   └── IMPLEMENTATION.md
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## Integración con RabbitMQ

### Eventos Consumidos

El orquestador consume eventos del exchange `dominio.events`:

- **REGISTRO_USUARIO**: Routing key `auth.created`
- **AUTENTICACION**: Routing key `auth.login`
- **RECUPERAR_PASSWORD**: Routing key `auth.password_recovery`
- **AUTENTICACION_CLAVES**: Routing key `auth.password_changed`

### Eventos Publicados

El orquestador publica mensajes listos para entrega en `orquestador.events`:

- **Routing Key**: `notifications.created`
- **Formato**: Mensajes multi-canal o simples
- **Destino**: Cola `notifications.queue` del Notifications Service

## Flujos de Procesamiento

### Flujo de Procesamiento de Evento

1. Domain Service publica evento en RabbitMQ (exchange `dominio.events`)
2. Consumer recibe mensaje de la cola
3. Deserializa mensaje JSON a objeto `Evento`
4. Event Dispatcher identifica `tipoAccion`
5. Llama al servicio correspondiente (ej: `registroUsuario()`)
6. Servicio aplica reglas de orquestación:
   - Determina qué notificaciones enviar
   - Selecciona canales (email, sms, etc.)
   - Resuelve plantillas con datos del evento
   - Construye mensajes listos para entrega
7. Publica mensajes en RabbitMQ (exchange `orquestador.events`)
8. Notifications Service consume mensajes y realiza envío

### Flujo de Registro de Usuario

1. Domain Service publica evento `REGISTRO_USUARIO`
2. Orquestador recibe evento
3. `registroUsuario()` se ejecuta:
   - Determina que debe enviar email de bienvenida
   - Selecciona canal "email"
   - Resuelve plantilla "welcome" con datos del usuario
   - Construye mensaje con destino, asunto y cuerpo
4. Publica mensaje en `orquestador.events` con routing key `notifications.created`
5. Notifications Service consume y envía email

## Plantillas

El sistema utiliza Handlebars para resolver plantillas de mensajes:

- **Plantillas de email**: HTML con datos del usuario
- **Plantillas de SMS**: Texto plano con datos del usuario
- **Plantillas de WhatsApp**: Texto con emojis y formato
- **Plantillas de Push**: Título y cuerpo con datos

## Testing

El proyecto incluye tests para:

- Servicios de usuario (23 tests)
- Utilidades y helpers
- Validación de esquemas
- Procesamiento de eventos

Ejecutar tests:
```bash
npm test
```

## Despliegue

### Docker

El microservicio incluye un `Dockerfile` para contenedorización.

### Docker Compose

Configurado en `docker-compose.unified.yml`:
- Puerto: 3000
- Dependencias: PostgreSQL, RabbitMQ
- Health checks configurados

## Monitoreo y Logging

### Logging Estructurado

- **Pino**: Logger de alto rendimiento
- **Formato JSON**: Logs estructurados para análisis
- **Niveles**: DEBUG, INFO, WARN, ERROR
- **Contexto**: Incluye información de request, usuario, etc.

## Consideraciones de Seguridad

1. **Validación de entrada**: Validación exhaustiva con Zod
2. **Sanitización**: Limpieza de datos de entrada
3. **Rate Limiting**: Considerar implementar límites de solicitudes
4. **Autenticación**: Validación de tokens JWT si aplica
5. **HTTPS**: Usar en producción para proteger datos en tránsito

## Notas

- Para documentación detallada, consultar `docs/IMPLEMENTATION.md`
- El orquestador no almacena plantillas fuertes ni reglas; recibe el mensaje ya construido desde el Orquestador
- Los eventos se procesan de forma asíncrona mediante colas de RabbitMQ

