import fs from "fs";
import path from "path";
import handlebars from "handlebars";

export class UtilidadesService {
  /**
   * Genera un HTML reemplazando variables en la plantilla
   * @param templateName nombre del archivo en la carpeta templates (ej: "email-verificacion.html")
   * @param data objeto con las variables a reemplazar
   */
  static renderTemplate(templateName: string, data: Record<string, any>): string {
    try {
      // Ruta absoluta a la plantilla
      const templatePath = path.join(__dirname, "../templates", templateName);

      // Leer la plantilla como string
      const source = fs.readFileSync(templatePath, "utf-8");

      // Compilar plantilla con Handlebars
      const template = handlebars.compile(source);

      // Generar HTML con los datos
      return template(data);
    } catch (error) {
      console.error("Error al renderizar la plantilla:", error);
      throw error;
    }
  }
}