import { createLogger, format, transports } from "winston";

//Formato del mensaje
const logFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

//Crear el logger
export const logger = createLogger({
  // nivel mínimo que se mostrará
  level: "info",

  //Como se mostrará el log
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // agrega fecha y hora
    logFormat // usa el formato definido arriba
  ),

  //Dónde se enviarán los logs
  transports: [
    new transports.Console(), // muestra en la consola
        new transports.File({ filename: 'logs/errors.log', level: 'error' }),
    new transports.File({ filename: "logs/combined.log" }), // guarda en archivo
  ],
});
