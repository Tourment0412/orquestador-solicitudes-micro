export class MessageTemplates {
    // Subjects como constantes (opcional, si quieres usarlos también para logs o para identificar el tipo de mensaje)
  static SUBJECT_LOGIN = "Ingreso a la aplicación";
  static SUBJECT_PASSWORD_CHANGE = "Cambio de contraseña";
  static SUBJECT_REGISTRATION = "Registro exitoso";
  static SUBJECT_PASSWORD_CHANGE_REQUEST = "Solicitud de cambio de contraseña";

  // Plantilla para ingreso/login
  static LOGIN_MESSAGE = 
  "Hola {{usuario}}, se ha registrado un inicio de sesión en tu cuenta.\n" +
  "Correo: {{correo}}\n" +
  "Fecha: {{fecha}}\n\n" +
  "Si no reconoces esta actividad, cambia tu contraseña inmediatamente.";


  // Plantilla para cambio de contraseña
  static PASSWORD_CHANGE_MESSAGE =
  "Hola {{usuario}}, tu contraseña fue cambiada exitosamente el {{fecha}}.\n" +
  "Correo: {{correo}}\n" +
  "Usuario: {{usuario}}\n\n" +
  "Si no fuiste tú, restablece tu contraseña de inmediato y contacta a soporte.";

}