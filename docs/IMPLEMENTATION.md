# Orquestador de Solicitudes Microservice - Documentación de Implementación

## Descripción General

El microservicio Orquestador de Solicitudes es una aplicación desarrollada en Node.js con TypeScript y Express que actúa como orquestador central para la gestión de eventos de dominio y notificaciones. Consume eventos de RabbitMQ, aplica reglas de negocio, selecciona canales de notificación y publica mensajes listos para entrega.

## Arquitectura

### Componentes Principales

El microservicio está estructurado en los siguientes componentes:

1. **API Express**: Endpoints HTTP para gestión de usuarios y configuración
2. **Event Dispatcher**: Distribuidor de eventos según tipo de acción
3. **Services**: Lógica de negocio para procesamiento de eventos
4. **Consumer**: Consumidor de RabbitMQ que recibe eventos de dominio
5. **Worker**: Procesador de tareas asíncronas
6. **Infrastructure**: Configuración de RabbitMQ, logging y validación

### Tecnologías Utilizadas

- **Node.js**: Runtime de JavaScript
- **TypeScript**: Superset tipado de JavaScript
- **Express**: Framework web minimalista
- **Prisma**: ORM moderno para TypeScript
- **PostgreSQL**: Base de datos relacional
- **amqplib**: Cliente para RabbitMQ
- **Handlebars**: Motor de plantillas
- **Zod**: Validación de esquemas
- **Pino**: Logger estructurado de alto rendimiento
- **UUID**: Generación de identificadores únicos

## Modelo de Datos

### Evento

Modelo que representa un evento de dominio recibido de RabbitMQ.

- **id** (String): Identificador único del evento (UUID)
- **tipoAccion** (String): Tipo de acción (REGISTRO_USUARIO, AUTENTICACION, etc.)
- **fechaCreacion** (String): Fecha de creación en formato ISO-8601
- **payload** (Object): Datos específicos del evento

### Usuario

Modelo de usuario para gestión interna (si aplica).

- **id** (String): Identificador único
- **usuario** (String): Nombre de usuario
- **correo** (String): Correo electrónico
- **createdAt** (DateTime): Fecha de creación
- **updatedAt** (DateTime): Fecha de actualización

## Endpoints de la API

### Gestión de Usuarios

#### Crear Usuario

- **Endpoint**: `POST /users`
- **Descripción**: Crea un nuevo usuario en el sistema
- **Autenticación**: No requerida (o según configuración)
- **Request Body**:
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
- **Response**: Array de usuarios

### Health Checks

#### Health Endpoint

- **Endpoint**: `GET /health`
- **Descripción**: Verifica el estado de salud del servicio
- **Autenticación**: No requerida
- **Response**:
```json
{
  "status": "UP",
  "uptime": 3600,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Componentes de Implementación

### Server (server.ts)

Aplicación Express principal que configura middleware y rutas.

**Funcionalidades**:
- Configuración de Express
- Middleware de logging (Pino HTTP)
- Middleware de parsing (JSON, URL encoded)
- Middleware de CORS
- Configuración de rutas
- Manejo global de errores
- Conexión a RabbitMQ al iniciar
- Inicio de consumidor de eventos

### Event Dispatcher (eventDispatcher.ts)

Distribuidor de eventos que enruta eventos según su tipo de acción.

**Tipos de eventos soportados**:
- **REGISTRO_USUARIO**: Procesa registro de nuevos usuarios
- **AUTENTICACION**: Procesa eventos de autenticación
- **RECUPERAR_PASSWORD**: Procesa solicitudes de recuperación de contraseña
- **AUTENTICACION_CLAVES**: Procesa eventos de cambio de contraseña

**Flujo**:
1. Recibe evento de tipo `Evento`
2. Identifica `tipoAccion`
3. Llama al servicio correspondiente según el tipo
4. Maneja errores y eventos desconocidos

### Services

#### User Service (user.service.ts)

Servicio que contiene la lógica de negocio para procesamiento de eventos de usuario.

**Funciones principales**:
- `registroUsuario()`: Procesa eventos de registro de usuario
  - Aplica reglas de orquestación
  - Selecciona canal de notificación (email, sms, etc.)
  - Resuelve plantillas de mensaje
  - Publica mensaje listo para entrega en RabbitMQ
- `autenticacion()`: Procesa eventos de autenticación
- `recuperacionContrasena()`: Procesa solicitudes de recuperación
- `autenticacionClaves()`: Procesa cambios de contraseña

**Lógica de orquestación**:
- Determina qué notificaciones enviar según el evento
- Selecciona canales apropiados (email, sms, whatsapp, push)
- Resuelve plantillas con datos del evento
- Construye mensajes listos para entrega

### Consumer (consumer.ts)

Consumidor de RabbitMQ que recibe eventos de dominio.

**Funcionalidades**:
- Conecta a RabbitMQ
- Consume mensajes de cola configurada
- Deserializa mensajes JSON
- Envía eventos a Event Dispatcher
- Maneja errores y reconexión

**Configuración**:
- Exchange: `dominio.events` (tipo topic)
- Queue: Cola configurada para orquestador
- Routing Keys: `auth.*`, `user.*`, etc.

### Worker (worker.ts)

Procesador de tareas asíncronas (si aplica).

**Funcionalidades**:
- Procesa tareas en background
- Gestiona colas de trabajo
- Ejecuta tareas programadas

### Infrastructure

#### RabbitMQ (rabbitmq.ts)

Configuración y gestión de conexión a RabbitMQ.

**Funcionalidades**:
- Conexión a RabbitMQ
- Creación de canal
- Configuración de exchanges y colas
- Publicación de mensajes
- Obtención de canal para uso en otros módulos

#### Logger (logger.ts)

Configuración de logging estructurado con Pino.

**Funcionalidades**:
- Configuración de niveles de log
- Formato estructurado (JSON)
- Integración con Pino HTTP para requests
- Pretty printing en desarrollo

#### Validation (validate.middleware.ts)

Middleware de validación usando Zod.

**Funcionalidades**:
- Validación de esquemas Zod
- Validación de body, query, params
- Retorno de errores de validación estructurados

### Routes

#### User Routes (user.routes.ts)

Rutas para gestión de usuarios.

**Rutas**:
- `POST /users`: Crear usuario
- `GET /users`: Listar usuarios

### Controllers

#### User Controller (user.controller.ts)

Controladores para operaciones de usuario.

**Handlers**:
- `createUserHandler`: Crea nuevo usuario
- `listUsersHandler`: Lista usuarios

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

### Flujo de Recuperación de Contraseña

1. Domain Service publica evento `RECUPERAR_PASSWORD`
2. Orquestador recibe evento
3. `recuperacionContrasena()` se ejecuta:
   - Determina que debe enviar código de verificación
   - Selecciona canales según preferencias (email, sms)
   - Resuelve plantilla con código generado
   - Construye mensajes multi-canal
4. Publica mensajes en RabbitMQ
5. Notifications Service envía notificaciones

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

### Prisma Schema

Configuración de base de datos con Prisma:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  usuario   String   @unique
  correo    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
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

## Plantillas

### Handlebars Templates

El sistema utiliza Handlebars para resolver plantillas de mensajes:

- **Plantillas de email**: HTML con datos del usuario
- **Plantillas de SMS**: Texto plano con datos del usuario
- **Plantillas de WhatsApp**: Texto con emojis y formato
- **Plantillas de Push**: Título y cuerpo con datos

### Resolución de Plantillas

1. Identifica plantilla según tipo de evento
2. Carga plantilla Handlebars
3. Resuelve variables con datos del evento
4. Genera mensaje final listo para envío

## Testing

### Estructura de Tests

- **Unit Tests**: Pruebas de servicios y lógica de negocio
- **Integration Tests**: Pruebas de endpoints con Supertest
- **Mocking**: Uso de mocks para RabbitMQ y servicios externos

### Cobertura de Tests

El proyecto incluye tests para:
- Servicios de usuario (23 tests)
- Utilidades y helpers
- Validación de esquemas
- Procesamiento de eventos

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

### Health Checks

- **Health Endpoint**: `/health` - Estado general del servicio
- **Uptime**: Tiempo de ejecución del servicio
- **Timestamp**: Fecha y hora actual

## Consideraciones de Seguridad

1. **Validación de entrada**: Validación exhaustiva con Zod
2. **Sanitización**: Limpieza de datos de entrada
3. **Rate Limiting**: Considerar implementar límites de solicitudes
4. **Autenticación**: Validación de tokens JWT si aplica
5. **HTTPS**: Usar en producción para proteger datos en tránsito

## Mejoras Futuras

1. **Métricas**: Integración con Prometheus/Grafana
2. **Trazabilidad**: Distributed tracing con OpenTelemetry
3. **Caché**: Cachear plantillas y configuraciones
4. **Retry Logic**: Reintentos para publicación de mensajes
5. **Dead Letter Queue**: Manejo de mensajes fallidos
6. **Multi-tenancy**: Soporte para múltiples tenants
7. **A/B Testing**: Pruebas A/B de plantillas y canales

