export interface Evento {
  id: string;              
  tipoAccion: string;      
  timestamp: string;       
  payload: {
    usuario: string;       
    correo: string;       
    numeroTelefono: string; 
    codigo: string;
    fecha: string;
  };
}