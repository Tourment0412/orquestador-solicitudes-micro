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

