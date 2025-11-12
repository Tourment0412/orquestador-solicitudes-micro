# language: es
# =============================================================================
# ARCHIVO DE CARACTERÍSTICAS (FEATURES) - ORQUESTADOR DE SOLICITUDES
# =============================================================================

Característica: Orquestación de Solicitudes y Eventos
  
  Antecedentes:
    Dado que el servicio orquestador está disponible

  # ===== CREAR USUARIO =====
  Escenario: Crear un nuevo usuario a través del orquestador
    Cuando creo un usuario con datos válidos
    Entonces la respuesta debe tener estado 201
    Y el cuerpo debe contener los datos del usuario creado

  # ===== LISTAR USUARIOS =====
  Escenario: Listar usuarios existentes
    Dado que existe al menos un usuario creado
    Cuando consulto la lista de usuarios
    Entonces la respuesta debe tener estado 200
    Y el cuerpo debe contener una lista de usuarios

  # ===== HEALTH CHECK =====
  Escenario: Verificar salud del servicio orquestador
    Cuando consulto el endpoint de health check
    Entonces la respuesta debe tener estado 200
    Y el cuerpo debe indicar que el servicio está UP

  # ===== PROCESAR EVENTO DE DOMINIO=====
  Escenario: Procesar evento de registro de usuario
  Dado que el servicio orquestador está escuchando eventos
  Cuando se publica un evento "REGISTRO_USUARIO" en RabbitMQ
  Entonces el orquestador debe procesarlo correctamente
  Y debe publicar una notificación en la cola de notificaciones
  Y el evento debe guardarse en la base de datos

Escenario: Procesar evento de autenticación
  Dado que el servicio orquestador está escuchando eventos
  Cuando se publica un evento "AUTENTICACION" en RabbitMQ
  Entonces el orquestador debe procesarlo correctamente
  Y debe publicar notificaciones multi-canal (email y SMS)

Escenario: Procesar evento de recuperación de contraseña
  Dado que el servicio orquestador está escuchando eventos
  Cuando se publica un evento "RECUPERAR_PASSWORD" en RabbitMQ
  Entonces el orquestador debe procesarlo correctamente
  Y debe generar un código de verificación
  Y debe publicar una notificación con el código

Escenario: Procesar evento de cambio de contraseña
  Dado que el servicio orquestador está escuchando eventos
  Cuando se publica un evento "AUTENTICACION_CLAVES" en RabbitMQ
  Entonces el orquestador debe procesarlo correctamente
  Y debe publicar notificaciones multi-canal (email y SMS)

#===PUBLICACION DE MENSAJES A RABBITMQ ===
Escenario: Publicar mensaje en cola de notificaciones
  Cuando el orquestador publica un mensaje en "notifications.queue"
  Entonces el mensaje debe enviarse correctamente
  Y debe tener formato JSON válido
  Y debe ser persistente

#=== RENDERIZADO DE PLANTILLAS DE NOTIFICACIÓN ===
Escenario: Renderizar plantilla HTML de email
  Cuando se solicita renderizar "registration_confirmation.html"
  Y se proporcionan datos del usuario
  Entonces debe retornar HTML con los datos interpolados

Escenario: Renderizar plantilla de mensaje SMS
  Cuando se solicita renderizar una plantilla de texto
  Y se proporcionan datos del evento
  Entonces debe retornar texto con variables reemplazadas

#=== GUARDADO DE EVENTOS EN BASE DE DATOS ===
Escenario: Guardar evento procesado en la base de datos
  Cuando se procesa un evento válido
  Entonces el evento debe guardarse en la tabla "eventos"
  Y debe incluir todos los campos requeridos
  Y debe tener un ID único

#=== WORKER DE PROCESAMIENTO ASINCRONO ===
Escenario: Iniciar worker de procesamiento
  Cuando el worker se inicia correctamente
  Entonces debe conectarse a RabbitMQ
  Y debe comenzar a consumir de "orquestador.queue"
  Y debe estar listo para procesar eventos

