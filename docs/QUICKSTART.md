# Guía de Inicio Rápido - Orquestador de Solicitudes Microservice

Esta guía te permitirá poner en marcha el orquestador de solicitudes en tu entorno local y ejecutar pruebas básicas.

## Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- PostgreSQL 12 o superior
- RabbitMQ 3.8 o superior
- Docker y Docker Compose (opcional)

## Instalación Rápida

### 1. Clonar e Instalar Dependencias

```bash
cd orquestador-solicitudes-micro
npm install
```

### 2. Configurar Base de Datos

#### Opción A: PostgreSQL Local

```sql
CREATE DATABASE orchestrator;
CREATE USER orchestrator_user WITH PASSWORD 'orchestrator_pass';
GRANT ALL PRIVILEGES ON DATABASE orchestrator TO orchestrator_user;
```

#### Opción B: PostgreSQL con Docker

```bash
docker run -d --name postgres-orchestrator \
  -e POSTGRES_DB=orchestrator \
  -e POSTGRES_USER=orchestrator_user \
  -e POSTGRES_PASSWORD=orchestrator_pass \
  -p 5432:5432 \
  postgres:15
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://orchestrator_user:orchestrator_pass@localhost:5432/orchestrator

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_EXCHANGE=dominio.events
RABBITMQ_QUEUE=orchestrator.queue
RABBITMQ_ROUTING_KEY=auth.*

# Notifications
NOTIFICATIONS_EXCHANGE=orquestador.events
NOTIFICATIONS_ROUTING_KEY=notifications.created

# Logging
LOG_LEVEL=info
```

### 4. Ejecutar Migraciones de Base de Datos

```bash
npm run prisma:migrate
```

O si es la primera vez:
```bash
npx prisma migrate dev
```

### 5. Generar Cliente Prisma

```bash
npx prisma generate
```

### 6. Ejecutar Servidor Localmente

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### 7. Ejecutar Worker (en otra terminal)

```bash
npm run worker:dev
```

## Verificación Inicial

### Health Check

```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "UP",
  "uptime": 123,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Pruebas Básicas

### 1. Crear Usuario

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "testuser",
    "correo": "test@example.com",
    "numeroTelefono": "+573001234567"
  }'
```

Respuesta esperada: HTTP 201 con datos del usuario creado

### 2. Listar Usuarios

```bash
curl http://localhost:3000/users
```

Respuesta esperada: HTTP 200 con lista de usuarios

### 3. Verificar Conexión a RabbitMQ

El worker debe mostrar en logs:
```
Connected to RabbitMQ
Consuming from orchestrator.queue
```

## Probar Procesamiento de Eventos

### 1. Publicar Evento de Prueba en RabbitMQ

Usando la UI de RabbitMQ Management (`http://localhost:15672`):

1. Ir a Exchanges > `dominio.events`
2. Publicar mensaje con routing key `auth.created`:
```json
{
  "id": "evt_123",
  "tipoAccion": "REGISTRO_USUARIO",
  "fechaCreacion": "2024-01-01T12:00:00Z",
  "payload": {
    "usuario": "testuser",
    "correo": "test@example.com",
    "numeroTelefono": "+573001234567"
  }
}
```

### 2. Verificar Procesamiento

El worker debe procesar el evento y mostrar logs como:
```
Evento recibido: REGISTRO_USUARIO
Procesando registro de usuario: testuser
```

## Ejecutar Tests

### Tests Unitarios

```bash
npm test
```

### Tests con Cobertura

```bash
npm test -- --coverage
```

### Tests en Modo Watch

```bash
npm run test:watch
```

## Verificar Base de Datos

### Usar Prisma Studio

```bash
npm run prisma:studio
```

Esto abrirá una interfaz web en `http://localhost:5555` para explorar la base de datos.

### Consultar con psql

```bash
psql -h localhost -U orchestrator_user -d orchestrator
```

```sql
SELECT * FROM "User";
```

## Compilar para Producción

```bash
npm run build
```

Esto generará los archivos JavaScript en `dist/`.

### Ejecutar Versión Compilada

```bash
npm start
npm run worker:start
```

## Troubleshooting

### Error: Cannot find module

Asegurarse de que las dependencias estén instaladas:
```bash
npm install
```

### Error: Prisma Client no generado

Generar el cliente Prisma:
```bash
npx prisma generate
```

### Error: Connection refused a PostgreSQL

Verificar que PostgreSQL esté corriendo:
```bash
psql -h localhost -U postgres -c "SELECT version();"
```

### Error: Connection refused a RabbitMQ

Verificar que RabbitMQ esté corriendo:
```bash
curl http://localhost:15672
```

O iniciar con Docker:
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  rabbitmq:3-management
```

### Error: Puerto 3000 ya en uso

Cambiar el puerto en `.env`:
```env
PORT=3001
```

### Error: Worker no procesa eventos

Verificar que:
1. El worker esté corriendo
2. La cola `orchestrator.queue` exista en RabbitMQ
3. El exchange `dominio.events` esté configurado
4. Los routing keys coincidan con la configuración

## Próximos Pasos

- Revisar `docs/IMPLEMENTATION.md` para detalles de arquitectura
- Configurar plantillas Handlebars para notificaciones
- Integrar con el servicio de notificaciones
- Revisar logs estructurados con Pino

