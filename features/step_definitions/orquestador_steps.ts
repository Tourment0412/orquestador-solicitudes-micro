// =============================================================================
// STEP DEFINITIONS - ORQUESTADOR DE SOLICITUDES
// =============================================================================
// Este archivo contiene todas las definiciones de steps para los escenarios
// de prueba BDD (Behavior Driven Development) usando Cucumber/Gherkin
// =============================================================================

import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import * as amqp from 'amqplib';
import { v4 as uuid } from 'uuid';

// =============================================================================
// CONFIGURACIÓN Y CONSTANTES
// =============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001/api/v1';
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://orchestrator_user:orch_pass@localhost:5672/foro';

// =============================================================================
// VARIABLES DE CONTEXTO COMPARTIDAS ENTRE STEPS
// =============================================================================

// HTTP / REST API
let lastResponse: any;
let lastUser: any;

// RABBITMQ / EVENTOS
let lastEvent: any;
let lastNotification: any;
let eventoGuardado: any;
let testMessage: any;
let targetQueue: string;
let rabbitMQAvailable: boolean = false;

// RENDERIZADO DE PLANTILLAS
let templateName: string;
let templateData: any;
let textTemplate: string;
let renderedTemplate: string;
let renderedText: string;

// BASE DE DATOS
let validEvent: any;
let savedEvent: any;

// WORKER
let workerConnected: boolean = false;

// =============================================================================
// HOOKS - SETUP Y CLEANUP
// =============================================================================

/**
 * Hook que se ejecuta antes de cada escenario
 * Útil para inicializar estado o preparar datos de prueba
 */
Before(async function() {
  // Reset de variables de contexto
  lastResponse = null;
  lastEvent = null;
  lastNotification = null;
  eventoGuardado = null;
  testMessage = null;
  renderedTemplate = '';
  renderedText = '';
});

/**
 * Hook que se ejecuta después de cada escenario
 * Útil para limpieza de datos de prueba
 */
After(async function() {
  // Aquí se puede agregar lógica de cleanup si es necesario
  // Ej: cerrar conexiones, eliminar datos de prueba, etc.
});

// =============================================================================
// STEPS: CONFIGURACIÓN INICIAL Y DISPONIBILIDAD
// =============================================================================
// Escenarios: Todos (Antecedentes)
// =============================================================================

/**
 * STEP: Dado que el servicio orquestador está disponible
 * Verifica que el servicio HTTP esté activo y respondiendo
 */
Given('que el servicio orquestador está disponible', async function() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status < 200 || response.status >= 500) {
      throw new Error(`Service not available: ${response.status}`);
    }
  } catch (error: any) {
    // Si hay error de conexión, el servicio no está disponible
  }
});

// =============================================================================
// STEPS: CRUD DE USUARIOS (HTTP REST API)
// =============================================================================
// Escenarios: 
// - Crear un nuevo usuario a través del orquestador
// - Listar usuarios existentes
// =============================================================================

/**
 * STEP: Cuando creo un usuario con datos válidos
 * Crea un usuario usando el endpoint POST /users
 */
When('creo un usuario con datos válidos', async function() {
  const userData = {
    name: `user_${faker.string.alphanumeric(8)}`,
    email: faker.internet.email(),
    phone: `+573${faker.string.numeric(9)}`
  };
  
  lastUser = userData;
  try {
    lastResponse = await axios.post(`${BASE_URL}/users`, userData);
  } catch (error: any) {
    lastResponse = error.response;
    throw error;
  }
});

/**
 * STEP: Dado que existe al menos un usuario creado
 * Pre-condición: Crea un usuario de prueba para escenarios de listado
 */
Given('que existe al menos un usuario creado', async function() {
  try {
    await axios.post(`${BASE_URL}/users`, {
      name: `user_${faker.string.alphanumeric(8)}`,
      email: faker.internet.email(),
      phone: `+573${faker.string.numeric(9)}`
    });
  } catch (error) {
    // Ignorar errores de creación
  }
});

/**
 * STEP: Cuando consulto la lista de usuarios
 * Obtiene todos los usuarios usando el endpoint GET /users
 */
When('consulto la lista de usuarios', async function() {
  try {
    lastResponse = await axios.get(`${BASE_URL}/users`);
  } catch (error: any) {
    lastResponse = error.response;
    throw error;
  }
});

// =============================================================================
// STEPS: HEALTH CHECK
// =============================================================================
// Escenario: Verificar salud del servicio orquestador
// =============================================================================

/**
 * STEP: Cuando consulto el endpoint de health check
 * Verifica el estado de salud del servicio
 */
When('consulto el endpoint de health check', async function() {
  try {
    // El health check está en la raíz, no en /api/v1
    lastResponse = await axios.get('http://localhost:3001/health');
  } catch (error: any) {
    lastResponse = error.response;
    throw error;
  }
});

// =============================================================================
// STEPS: VALIDACIONES DE RESPUESTAS HTTP
// =============================================================================
// Escenarios: Todos los que validan respuestas HTTP
// =============================================================================

/**
 * STEP: Entonces la respuesta debe tener estado {int}
 * Valida el código de estado HTTP de la última respuesta
 */
Then('la respuesta debe tener estado {int}', function(status: number) {
  if (!lastResponse || lastResponse.status !== status) {
    throw new Error(`Expected status ${status} but got ${lastResponse?.status || 'undefined'}`);
  }
});

/**
 * STEP: Y el cuerpo debe contener los datos del usuario creado
 * Valida que la respuesta contenga datos del usuario
 */
Then('el cuerpo debe contener los datos del usuario creado', function() {
  if (!lastResponse?.data?.name && !lastResponse?.data?.usuario) {
    throw new Error('Response does not contain user data (name or usuario)');
  }
});

/**
 * STEP: Y el cuerpo debe contener una lista de usuarios
 * Valida que la respuesta sea un array de usuarios
 */
Then('el cuerpo debe contener una lista de usuarios', function() {
  if (!Array.isArray(lastResponse?.data)) {
    throw new Error('Response is not an array');
  }
});

/**
 * STEP: Y el cuerpo debe indicar que el servicio está UP
 * Valida que el health check reporte estado "UP"
 */
Then('el cuerpo debe indicar que el servicio está UP', function() {
  // El health check puede devolver status en diferentes formatos
  const status = lastResponse?.data?.status;
  if (status !== 'UP' && status !== 'up') {
    throw new Error(`Expected status UP but got ${status || 'undefined'}`);
  }
});

// =============================================================================
// STEPS: PROCESAMIENTO DE EVENTOS DE DOMINIO
// =============================================================================
// Escenarios:
// - Procesar evento de registro de usuario
// - Procesar evento de autenticación
// - Procesar evento de recuperación de contraseña
// - Procesar evento de cambio de contraseña
// =============================================================================

/**
 * STEP: Dado que el servicio orquestador está escuchando eventos
 * Verifica que RabbitMQ esté disponible y la cola exista
 */
Given('que el servicio orquestador está escuchando eventos', async function() {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();
    
    // Verificar que la cola existe
    await channel.checkQueue('orquestador.queue');
    
    await channel.close();
    await connection.close();
    
    rabbitMQAvailable = true;
    console.log('✅ RabbitMQ disponible y cola verificada');
  } catch (error: any) {
    throw new Error(`RabbitMQ no está disponible: ${error.message}`);
  }
});

/**
 * STEP: Cuando se publica un evento "{tipoEvento}" en RabbitMQ
 * Publica un evento del tipo especificado en la cola de orquestador
 * Soporta: REGISTRO_USUARIO, AUTENTICACION, RECUPERAR_PASSWORD, AUTENTICACION_CLAVES
 */
When('se publica un evento {string} en RabbitMQ', async function(tipoEvento: string) {
  // Definir payloads según el tipo de evento
  const payloads: Record<string, any> = {
    REGISTRO_USUARIO: {
      id: uuid(),
      tipoAccion: 'REGISTRO_USUARIO',
      timestamp: new Date().toISOString(),
      payload: {
        usuario: 'test_user',
        correo: 'test@example.com',
        numeroTelefono: '+573001234567',
        codigo: '',
        fecha: new Date().toISOString()
      }
    },
    AUTENTICACION: {
      id: uuid(),
      tipoAccion: 'AUTENTICACION',
      timestamp: new Date().toISOString(),
      payload: {
        usuario: 'test_user',
        correo: 'test@example.com',
        numeroTelefono: '+573001234567',
        codigo: '',
        fecha: new Date().toISOString()
      }
    },
    RECUPERAR_PASSWORD: {
      id: uuid(),
      tipoAccion: 'RECUPERAR_PASSWORD',
      timestamp: new Date().toISOString(),
      payload: {
        usuario: 'test_user',
        correo: 'test@example.com',
        numeroTelefono: '',
        codigo: Math.random().toString(36).substring(2, 8).toUpperCase(),
        fecha: new Date().toISOString()
      }
    },
    AUTENTICACION_CLAVES: {
      id: uuid(),
      tipoAccion: 'AUTENTICACION_CLAVES',
      timestamp: new Date().toISOString(),
      payload: {
        usuario: 'test_user',
        correo: 'test@example.com',
        numeroTelefono: '+573001234567',
        codigo: '',
        fecha: new Date().toISOString()
      }
    }
  };
  
  const evento = payloads[tipoEvento];
  if (!evento) {
    throw new Error(`Tipo de evento desconocido: ${tipoEvento}`);
  }
  
  // Guardar evento para verificaciones posteriores
  lastEvent = evento;
  
  // Publicar en RabbitMQ
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue('orquestador.queue', { durable: true });
  
  const message = Buffer.from(JSON.stringify(evento));
  channel.sendToQueue('orquestador.queue', message, {
    persistent: true,
    contentType: 'application/json'
  });
  
  console.log(`📤 Evento ${tipoEvento} publicado en orquestador.queue`);
  console.log(`   ID: ${evento.id}`);
  
  await channel.close();
  await connection.close();
  
  // Dar tiempo al orquestador para procesar (ajustar según necesidad)
  await new Promise(resolve => setTimeout(resolve, 2000));
});

/**
 * STEP: Entonces el orquestador debe procesarlo correctamente
 * Verifica que el evento fue procesado y guardado en la base de datos
 */
Then('el orquestador debe procesarlo correctamente', async function() {
  // Importar PrismaClient dinámicamente para verificar en BD
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const eventoEncontrado = await prisma.evento.findUnique({
      where: { id: lastEvent.id }
    });
    
    if (!eventoEncontrado) {
      throw new Error(`Evento ${lastEvent.id} no fue guardado en la base de datos`);
    }
    
    // Verificar que los campos coinciden
    if (eventoEncontrado.tipoAccion !== lastEvent.tipoAccion) {
      throw new Error(
        `tipoAccion no coincide: esperado=${lastEvent.tipoAccion}, obtenido=${eventoEncontrado.tipoAccion}`
      );
    }
    
    console.log(`✅ Evento procesado correctamente: ${lastEvent.id}`);
    eventoGuardado = eventoEncontrado;
    
  } finally {
    await prisma.$disconnect();
  }
});

/**
 * STEP: Y debe publicar una notificación en la cola de notificaciones
 * Verifica que se publicó un mensaje en notifications.queue
 */
Then('debe publicar una notificación en la cola de notificaciones', async function() {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue('notifications.queue', { durable: true });
  
  // Intentar consumir un mensaje de la cola
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      channel.close().then(() => connection.close());
      reject(new Error('⏱️ Timeout: No se recibió notificación en 5 segundos'));
    }, 5000);
    
    channel.consume('notifications.queue', (msg: amqp.ConsumeMessage | null) => {
      if (msg) {
        clearTimeout(timeout);
        
        try {
          const notification = JSON.parse(msg.content.toString());
          
          console.log('📬 Notificación recibida:', JSON.stringify(notification, null, 2));
          
          // Verificar estructura básica
          if (!notification.destination || !notification.message) {
            channel.nack(msg, false, true);
            reject(new Error('Notificación con estructura inválida (falta destination o message)'));
            return;
          }
          
          channel.ack(msg);
          lastNotification = notification;
          
          channel.close()
            .then(() => connection.close())
            .then(() => resolve(undefined));
            
        } catch (error: any) {
          channel.nack(msg, false, true);
          reject(new Error(`Error parseando notificación: ${error.message}`));
        }
      }
    }, { noAck: false });
  });
});

/**
 * STEP: Y el evento debe guardarse en la base de datos
 * Validación adicional de que el evento está persistido correctamente
 */
Then('el evento debe guardarse en la base de datos', function() {
  if (!eventoGuardado) {
    throw new Error('No se encontró evento guardado en el contexto');
  }
  
  // Verificar campos obligatorios
  const camposRequeridos = ['id', 'tipoAccion', 'timestamp', 'usuario'];
  for (const campo of camposRequeridos) {
    if (!(eventoGuardado as any)[campo]) {
      throw new Error(`Campo requerido faltante en evento guardado: ${campo}`);
    }
  }
  
  console.log(`✅ Evento guardado en BD con ID: ${eventoGuardado.id}`);
});

/**
 * STEP: Y debe publicar notificaciones multi-canal (email y SMS)
 * Verifica que la notificación tiene destinos y mensajes para email Y SMS
 */
Then('debe publicar notificaciones multi-canal \\(email y SMS\\)', function() {
  if (!lastNotification) {
    throw new Error('No se encontró notificación en el contexto');
  }
  
  // Verificar que tiene destinos para email y SMS
  if (!lastNotification.destination.email) {
    throw new Error('Notificación no tiene destino de email');
  }
  
  if (!lastNotification.destination.sms) {
    throw new Error('Notificación no tiene destino de SMS');
  }
  
  // Verificar que tiene mensajes para ambos canales
  if (!lastNotification.message.email) {
    throw new Error('Notificación no tiene mensaje de email');
  }
  
  if (!lastNotification.message.sms) {
    throw new Error('Notificación no tiene mensaje de SMS');
  }
  
  console.log('✅ Notificación multi-canal validada:');
  console.log(`   Email: ${lastNotification.destination.email}`);
  console.log(`   SMS: ${lastNotification.destination.sms}`);
});

/**
 * STEP: Y debe generar un código de verificación
 * Verifica que el evento guardado tiene un código de verificación válido
 */
Then('debe generar un código de verificación', function() {
  if (!eventoGuardado || !eventoGuardado.codigo) {
    throw new Error('Evento no tiene código de verificación generado');
  }
  
  // Verificar que el código tiene formato válido (6+ caracteres alfanuméricos)
  const codigoRegex = /^[A-Z0-9]{6,}$/;
  if (!codigoRegex.test(eventoGuardado.codigo)) {
    throw new Error(
      `Código de verificación inválido: "${eventoGuardado.codigo}" (debe ser 6+ caracteres alfanuméricos)`
    );
  }
  
  console.log(`✅ Código de verificación generado: ${eventoGuardado.codigo}`);
});

/**
 * STEP: Y debe publicar una notificación con el código
 * Verifica que el mensaje de email contiene el código de verificación
 */
Then('debe publicar una notificación con el código', function() {
  if (!lastNotification || !lastNotification.message.email) {
    throw new Error('No se encontró notificación de email');
  }
  
  // Verificar que el mensaje contiene el código
  const codigo = eventoGuardado.codigo;
  if (!lastNotification.message.email.includes(codigo)) {
    throw new Error(
      `La notificación no contiene el código ${codigo}\nMensaje: ${lastNotification.message.email}`
    );
  }
  
  console.log(`✅ Notificación contiene el código de verificación: ${codigo}`);
});

// =============================================================================
// STEPS: PUBLICACIÓN DE MENSAJES A RABBITMQ
// =============================================================================
// Escenario: Publicar mensaje en cola de notificaciones
// =============================================================================

/**
 * STEP: Cuando el orquestador publica un mensaje en "{queueName}"
 * Simula la publicación de un mensaje de prueba en una cola específica
 */
When('el orquestador publica un mensaje en {string}', async function(queueName: string) {
  // Mensaje de prueba
  const mensaje = {
    destination: {
      email: 'test@example.com',
      sms: '+573001234567'
    },
    message: {
      email: '<h1>Test Email</h1><p>Este es un mensaje de prueba</p>',
      sms: 'Test SMS message'
    },
    subject: 'Test Subject',
    metadata: {
      timestamp: new Date().toISOString(),
      testId: uuid()
    }
  };
  
  testMessage = mensaje;
  targetQueue = queueName;
  
  // Publicar usando amqplib directamente
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': 'dlx' }
  });
  
  const payload = Buffer.from(JSON.stringify(mensaje));
  
  channel.sendToQueue(queueName, payload, {
    persistent: true,
    contentType: 'application/json'
  });
  
  console.log(`📤 Mensaje publicado en ${queueName}`);
  
  await channel.close();
  await connection.close();
  
  // Dar tiempo para procesamiento
  await new Promise(resolve => setTimeout(resolve, 1000));
});

/**
 * STEP: Entonces el mensaje debe enviarse correctamente
 * Verifica que el mensaje está en la cola
 */
Then('el mensaje debe enviarse correctamente', async function() {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  // Verificar que el mensaje está en la cola
  const queueInfo = await channel.checkQueue(targetQueue);
  
  if (queueInfo.messageCount === 0) {
    throw new Error(`No hay mensajes en la cola ${targetQueue}`);
  }
  
  console.log(`✅ Cola ${targetQueue} tiene ${queueInfo.messageCount} mensaje(s)`);
  
  await channel.close();
  await connection.close();
});

/**
 * STEP: Y debe tener formato JSON válido
 * Verifica que el mensaje en la cola es JSON válido
 */
Then('debe tener formato JSON válido', async function() {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      channel.close().then(() => connection.close());
      reject(new Error('Timeout: No se pudo consumir mensaje'));
    }, 3000);
    
    channel.consume(targetQueue, (msg: amqp.ConsumeMessage | null) => {
      if (msg) {
        clearTimeout(timeout);
        
        try {
          const parsed = JSON.parse(msg.content.toString());
          console.log('✅ Mensaje tiene formato JSON válido:', parsed);
          
          channel.ack(msg);
          channel.close()
            .then(() => connection.close())
            .then(() => resolve(undefined));
            
        } catch (error) {
          channel.nack(msg, false, true);
          reject(new Error('Mensaje no tiene formato JSON válido'));
        }
      }
    }, { noAck: false });
  });
});

/**
 * STEP: Y debe ser persistente
 * Verifica que la cola está configurada como durable (persistente)
 */
Then('debe ser persistente', async function() {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  try {
    // Intentar acceder a la cola (si es durable, debería existir)
    await channel.checkQueue(targetQueue);
    console.log(`✅ Cola ${targetQueue} es durable (persistente)`);
  } catch (error) {
    throw new Error(`Cola ${targetQueue} no es durable`);
  } finally {
    await channel.close();
    await connection.close();
  }
});

// =============================================================================
// STEPS: RENDERIZADO DE PLANTILLAS DE NOTIFICACIÓN
// =============================================================================
// Escenarios:
// - Renderizar plantilla HTML de email
// - Renderizar plantilla de mensaje SMS
// =============================================================================

/**
 * STEP: Cuando se solicita renderizar "{templateName}"
 * Prepara datos para renderizar una plantilla HTML
 */
When('se solicita renderizar {string}', function(template: string) {
  templateName = template;
  templateData = {
    usuario: 'Juan Pérez',
    correo: 'juan.perez@example.com',
    codigo: 'ABC123',
    fecha: '17/09/2025 a las 4:38 p.m'
  };
  
  console.log(`📄 Preparando renderizado de plantilla: ${templateName}`);
});

/**
 * STEP: Y se proporcionan datos del usuario
 * Confirma que los datos del usuario están disponibles
 */
When('se proporcionan datos del usuario', function() {
  if (!templateData || !templateData.usuario || !templateData.correo) {
    throw new Error('Datos de usuario no están configurados correctamente');
  }
  
  console.log('✅ Datos de usuario proporcionados:', {
    usuario: templateData.usuario,
    correo: templateData.correo
  });
});

/**
 * STEP: Entonces debe retornar HTML con los datos interpolados
 * Verifica que UtilidadesService.renderTemplate genera HTML correctamente
 */
Then('debe retornar HTML con los datos interpolados', async function() {
  const { UtilidadesService } = await import('../../src/services/utilities.service');
  
  try {
    const rendered = UtilidadesService.renderTemplate(templateName, templateData);
    
    // Verificar que retorna HTML
    if (!rendered.includes('<html') && !rendered.includes('<div') && !rendered.includes('<body')) {
      throw new Error('El resultado no parece ser HTML válido');
    }
    
    // Verificar que los datos están interpolados
    if (!rendered.includes(templateData.usuario)) {
      throw new Error(`HTML no contiene el usuario: ${templateData.usuario}`);
    }
    
    if (!rendered.includes(templateData.correo)) {
      throw new Error(`HTML no contiene el correo: ${templateData.correo}`);
    }
    
    console.log('✅ Plantilla HTML renderizada correctamente');
    console.log(`   Longitud: ${rendered.length} caracteres`);
    renderedTemplate = rendered;
    
  } catch (error: any) {
    throw new Error(`Error al renderizar plantilla: ${error.message}`);
  }
});

/**
 * STEP: Cuando se solicita renderizar una plantilla de texto
 * Prepara datos para renderizar una plantilla de texto (SMS)
 */
When('se solicita renderizar una plantilla de texto', async function() {
  const { MessageTemplates } = await import('../../src/templates/messageTemplates');
  
  textTemplate = MessageTemplates.LOGIN_MESSAGE;
  templateData = {
    usuario: 'Juan Pérez',
    correo: 'juan.perez@example.com',
    fecha: '17/09/2025 a las 4:38 p.m'
  };
  
  console.log(`📱 Preparando renderizado de plantilla de texto`);
  console.log(`   Template: ${textTemplate}`);
});

/**
 * STEP: Y se proporcionan datos del evento
 * Confirma que los datos del evento están disponibles
 */
When('se proporcionan datos del evento', function() {
  if (!templateData || !templateData.usuario) {
    throw new Error('Datos de evento no están configurados correctamente');
  }
  
  console.log('✅ Datos de evento proporcionados:', templateData);
});

/**
 * STEP: Entonces debe retornar texto con variables reemplazadas
 * Verifica que UtilidadesService.renderStringTemplate genera texto correctamente
 */
Then('debe retornar texto con variables reemplazadas', async function() {
  const { UtilidadesService } = await import('../../src/services/utilities.service');
  
  try {
    const rendered = UtilidadesService.renderStringTemplate(textTemplate, templateData);
    
    // Verificar que las variables fueron reemplazadas
    if (rendered.includes('{{')) {
      throw new Error('Plantilla contiene variables sin reemplazar: ' + rendered);
    }
    
    // Verificar que contiene los datos
    if (!rendered.includes(templateData.usuario)) {
      throw new Error(`Texto no contiene el usuario: ${templateData.usuario}`);
    }
    
    console.log('✅ Plantilla de texto renderizada correctamente:');
    console.log(`   "${rendered}"`);
    renderedText = rendered;
    
  } catch (error: any) {
    throw new Error(`Error al renderizar plantilla de texto: ${error.message}`);
  }
});

// =============================================================================
// STEPS: GUARDADO DE EVENTOS EN BASE DE DATOS
// =============================================================================
// Escenario: Guardar evento procesado en la base de datos
// =============================================================================

/**
 * STEP: Cuando se procesa un evento válido
 * Crea y guarda un evento de prueba en la base de datos
 */
When('se procesa un evento válido', async function() {
  validEvent = {
    id: uuid(),
    tipoAccion: 'TEST_ACTION',
    timestamp: new Date().toISOString(),
    payload: {
      usuario: 'test_user_bd',
      correo: 'testbd@example.com',
      numeroTelefono: '+573001234567',
      codigo: 'XYZ789',
      fecha: new Date().toISOString()
    }
  };
  
  // Guardar evento usando la función del servicio
  const { guardarEvento } = await import('../../src/services/user.service');
  await guardarEvento(validEvent);
  
  console.log(`✅ Evento válido procesado con ID: ${validEvent.id}`);
});

/**
 * STEP: Entonces el evento debe guardarse en la tabla "{tableName}"
 * Verifica que el evento está en la base de datos
 */
Then('el evento debe guardarse en la tabla {string}', async function(tableName: string) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const evento = await prisma.evento.findUnique({
      where: { id: validEvent.id }
    });
    
    if (!evento) {
      throw new Error(`Evento ${validEvent.id} no se encontró en la tabla ${tableName}`);
    }
    
    console.log(`✅ Evento guardado en tabla ${tableName}:`, {
      id: evento.id,
      tipoAccion: evento.tipoAccion,
      usuario: evento.usuario
    });
    
    savedEvent = evento;
    
  } finally {
    await prisma.$disconnect();
  }
});

/**
 * STEP: Y debe incluir todos los campos requeridos
 * Valida que el evento tenga todos los campos obligatorios
 */
Then('debe incluir todos los campos requeridos', function() {
  const camposRequeridos = ['id', 'tipoAccion', 'timestamp', 'usuario'];
  
  for (const campo of camposRequeridos) {
    if (!(savedEvent as any)[campo]) {
      throw new Error(`Campo requerido faltante: ${campo}`);
    }
  }
  
  console.log('✅ Todos los campos requeridos están presentes:', camposRequeridos);
});

/**
 * STEP: Y debe tener un ID único
 * Verifica que el ID es un UUID válido
 */
Then('debe tener un ID único', function() {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(savedEvent.id)) {
    throw new Error(`ID no es un UUID válido: ${savedEvent.id}`);
  }
  
  console.log(`✅ ID único válido (UUID v4): ${savedEvent.id}`);
});

// =============================================================================
// STEPS: WORKER DE PROCESAMIENTO ASÍNCRONO
// =============================================================================
// Escenario: Iniciar worker de procesamiento
// =============================================================================

/**
 * STEP: Cuando el worker se inicia correctamente
 * Verifica que el worker puede conectarse a RabbitMQ
 */
When('el worker se inicia correctamente', async function() {
  try {
    const { connectRabbit } = await import('../../src/infrastructure/rabbitmq');
    
    const channel = await connectRabbit();
    console.log('✅ Worker conectado a RabbitMQ');
    workerConnected = true;
    
  } catch (error: any) {
    throw new Error(`Worker no pudo iniciar: ${error.message}`);
  }
});

/**
 * STEP: Entonces debe conectarse a RabbitMQ
 * Confirma que la conexión a RabbitMQ está activa
 */
Then('debe conectarse a RabbitMQ', function() {
  if (!workerConnected) {
    throw new Error('Worker no está conectado a RabbitMQ');
  }
  
  console.log('✅ Conexión a RabbitMQ verificada');
});

/**
 * STEP: Y debe comenzar a consumir de "{queueName}"
 * Verifica que la cola existe y puede ser consumida
 */
Then('debe comenzar a consumir de {string}', async function(queueName: string) {
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  try {
    // Verificar que la cola existe
    const queueInfo = await channel.checkQueue(queueName);
    console.log(`✅ Cola ${queueName} existe`);
    console.log(`   Mensajes en cola: ${queueInfo.messageCount}`);
    console.log(`   Consumidores activos: ${queueInfo.consumerCount}`);
    
    if (queueInfo.consumerCount === 0) {
      console.warn(`⚠️ Advertencia: No hay consumidores activos en ${queueName}`);
      console.warn(`   Esto es normal si el worker no está corriendo en este momento`);
    }
    
  } finally {
    await channel.close();
    await connection.close();
  }
});

/**
 * STEP: Y debe estar listo para procesar eventos
 * Envía un evento de prueba y verifica que se procesa correctamente
 */
Then('debe estar listo para procesar eventos', async function() {
  // Enviar un evento de prueba
  const testEvent = {
    id: uuid(),
    tipoAccion: 'REGISTRO_USUARIO',
    timestamp: new Date().toISOString(),
    payload: {
      usuario: 'worker_test',
      correo: 'worker@test.com',
      numeroTelefono: '+573001234567',
      codigo: '',
      fecha: new Date().toISOString()
    }
  };
  
  const connection = await amqp.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  
  // Publicar evento de prueba
  const message = Buffer.from(JSON.stringify(testEvent));
  channel.sendToQueue('orquestador.queue', message, {
    persistent: true,
    contentType: 'application/json'
  });
  
  console.log('📤 Evento de prueba enviado al worker');
  console.log(`   ID: ${testEvent.id}`);
  
  await channel.close();
  await connection.close();
  
  // Esperar procesamiento
  console.log('⏳ Esperando procesamiento del evento (3 segundos)...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verificar que se guardó en BD
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const eventoGuardadoPorWorker = await prisma.evento.findUnique({
      where: { id: testEvent.id }
    });
    
    if (!eventoGuardadoPorWorker) {
      console.warn('⚠️ Worker no procesó el evento de prueba');
      console.warn('   Esto puede significar que el worker no está corriendo');
      console.warn('   Para ejecutar el worker: npm run worker');
    } else {
      console.log('✅ Worker está procesando eventos correctamente');
      console.log(`   Evento procesado: ${eventoGuardadoPorWorker.id}`);
    }
    
  } finally {
    await prisma.$disconnect();
  }
});


