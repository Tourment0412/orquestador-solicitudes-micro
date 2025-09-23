export class MessageTemplates {
    // Subjects como constantes (opcional, si quieres usarlos también para logs o para identificar el tipo de mensaje)
  static SUBJECT_LOGIN = "Ingreso a la aplicación";
  static SUBJECT_PASSWORD_CHANGE = "Cambio de contraseña";
  static SUBJECT_REGISTRATION = "Registro exitoso";
  static SUBJECT_PASSWORD_CHANGE_REQUEST = "Solicitud de cambio de contraseña";

  // Plantilla para ingreso/login
  static LOGIN_MESSAGE = 
  "Login: {{usuario}}. Fecha: {{fecha}}. Si no fuiste tú, cambia tu contraseña.";


  // Plantilla para cambio de contraseña
  static PASSWORD_CHANGE_MESSAGE =
  "Clave cambiada para {{usuario}} el {{fecha}}. Si no fuiste tú, restablécela.";

}