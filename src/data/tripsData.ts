import { TripRecord, KPIStats } from '../types';
import {
  parseRowsToTrips,
  calculateKPIsFromTrips,
  GOOGLE_SHEETS_STANDARD_COLUMNS
} from '../services/googleSheets';

// Raw Google Sheets data exactly matching user's spreadsheet image:
// Headers: MOTORISTA, FROTA, PLACA, UNIDADE, MÊS NUM, MÊS, DATA, CICLO TOTAL, TURNO REVENDA,
// DIA DA SEMAN, PARADA, REVENDA, TEMPO DE CARGA, TMV IDA, TMV VOLTA, TMV, TMA, FILA, TR
export const RAW_GOOGLE_SHEETS_DATA: string[][] = [
  ['SIDNEI MONTEIRO', 'FIXA', 'SJQ4D45', 'CDR', '5', 'MAI', '03/05/2026', '16:43:50', 'TURNO 3', '7', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:20:00', '06:35:00', '12:55:00', '03:48:50', '0', '1:25:25'],
  ['PAULO LEAL', 'FIXA', 'PKG0266', 'CDR', '5', 'MAI', '10/05/2026', '16:01:05', 'TURNO 3', '1', 'OFICINA', 'ADIB - MATRIZ', '', '06:05:00', '05:55:00', '12:00:00', '04:01:05', '0', '5:15:40'],
  ['CARLOS HENRIQUE', 'FIXA', 'SKJ2C51', 'CDR', '5', 'MAI', '12/05/2026', '15:45:27', 'TURNO 3', '3', 'OFICINA', 'ADIB - MATRIZ', '', '05:50:00', '06:00:00', '11:50:00', '03:55:27', '0', '3:20:00'],
  ['RAMON CRISTIAN', 'FIXA', 'SJQ4D45', 'CDR', '5', 'MAI', '13/05/2026', '17:28:11', 'TURNO 3', '4', 'OFICINA', 'ADIB - VERA CRUZ', '', '07:00:00', '07:20:00', '14:20:00', '03:08:11', '0', '7:56:33'],
  ['JOSE CARLOS', 'FIXA', 'SKJ9C62', 'CDR', '5', 'MAI', '13/05/2026', '14:55:45', 'TURNO 3', '4', 'OFICINA', 'ADIB - MATRIZ', '', '05:45:00', '05:55:00', '11:40:00', '03:15:45', '0', '2:53:31'],
  ['ELQUISSON COSTA', 'FIXA', 'PKG0266', 'CDR', '5', 'MAI', '14/05/2026', '18:57:22', 'TURNO 3', '5', 'OFICINA', 'ADIB - VERA CRUZ', '', '09:05:00', '06:50:00', '15:55:00', '03:02:22', '0', '2:04:16'],
  ['RUBENS BRAGA', 'FIXA', 'SKJ2C51', 'CDR', '5', 'MAI', '15/05/2026', '15:01:18', 'TURNO 3', '6', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:00:00', '05:50:00', '11:50:00', '03:11:18', '0', '1:16:27'],
  ['MARCOS RODRIGO', 'FIXA', 'SKJ9C62', 'CDR', '5', 'MAI', '18/05/2026', '15:21:55', 'TURNO 3', '2', 'OFICINA', 'ADIB - MATRIZ', '', '06:06:00', '06:10:00', '12:16:00', '03:05:55', '0', '2:51:25'],
  ['SIDNEI MONTEIRO', 'FIXA', 'SJQ4D45', 'CDR', '5', 'MAI', '19/05/2026', '15:04:30', 'TURNO 3', '3', 'OFICINA', 'ADIB - MATRIZ', '', '05:55:00', '05:48:00', '11:43:00', '03:21:30', '0', '2:52:35'],
  ['PAULO LEAL', 'FIXA', 'PKG0266', 'CDR', '5', 'MAI', '20/05/2026', '16:04:03', 'TURNO 3', '4', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:20:00', '06:30:00', '12:50:00', '03:14:03', '0', '0:55:31'],
  ['JOSE CARLOS', 'FIXA', 'SKJ9C62', 'CDR', '5', 'MAI', '21/05/2026', '14:46:42', 'TURNO 2', '5', 'OFICINA', 'ADIB - MATRIZ', '', '05:40:00', '05:45:00', '11:25:00', '03:21:42', '0', '5:10:45'],
  ['RUBENS BRAGA', 'FIXA', 'SKJ2C51', 'CDR', '5', 'MAI', '21/05/2026', '15:15:15', 'TURNO 3', '5', 'OFICINA', 'ADIB - VERA CRUZ', '', '05:58:00', '06:05:00', '12:03:00', '03:12:15', '0', '4:28:35'],
  ['RAMON CRISTIAN', 'FIXA', 'SJQ4D45', 'CDR', '5', 'MAI', '23/05/2026', '17:27:47', 'TURNO 3', '7', 'OFICINA', 'ADIB - VERA CRUZ', '', '08:15:00', '06:00:00', '14:15:00', '03:12:47', '0', '1:43:28'],
  ['CARLOS HENRIQUE', 'FIXA', 'SKJ2C51', 'CDR', '5', 'MAI', '24/05/2026', '15:10:29', 'TURNO 3', '1', 'OFICINA', 'ADIB - MATRIZ', '', '05:50:00', '06:02:00', '11:52:00', '03:18:29', '0', '4:15:09'],
  ['CARLOS HENRIQUE', 'FIXA', 'SKJ9C62', 'CDR', '6', 'JUN', '02/06/2026', '14:00:30', 'TURNO 2', '3', 'OFICINA', 'ADIB - MATRIZ', '', '05:45:20', '05:30:10', '11:15:30', '02:45:00', '0', '4:10:50'],
  ['ELQUISSON COSTA', 'FIXA', 'PKG0266', 'CDR', '6', 'JUN', '04/06/2026', '15:13:12', 'TURNO 2', '5', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:15:12', '06:10:00', '12:25:12', '02:48:00', '0', '1:44:33'],
  ['CARLOS HENRIQUE', 'FIXA', 'SKJ2C51', 'CDR', '6', 'JUN', '04/06/2026', '19:00:15', 'TURNO 1', '5', 'OFICINA', 'ADIB - MATRIZ', '', '08:20:10', '07:50:05', '16:10:15', '02:50:00', '0', '2:41:25'],
  ['RAMON CRISTIAN', 'FIXA', 'SJQ4D45', 'CDR', '6', 'JUN', '06/06/2026', '15:12:40', 'TURNO 3', '7', 'OFICINA', 'ADIB - VERA CRUZ', '', '05:55:25', '06:25:15', '12:20:40', '02:52:00', '0', '2:22:10'],
  ['RUBENS BRAGA', 'FIXA', 'SKJ2C51', 'CDR', '6', 'JUN', '08/06/2026', '15:16:40', 'TURNO 3', '2', 'OFICINA', 'ADIB - MATRIZ', '', '06:05:10', '06:15:30', '12:20:40', '02:56:00', '0', '3:24:35'],
  ['SIDNEI MONTEIRO', 'FIXA', 'SJQ4D45', 'CDR', '6', 'JUN', '11/06/2026', '16:15:37', 'TURNO 3', '5', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:35:15', '06:40:22', '13:15:37', '03:00:00', '0', '1:23:50'],
  ['PAULO LEAL', 'FIXA', 'PKG0266', 'CDR', '6', 'JUN', '11/06/2026', '14:40:55', 'TURNO 3', '5', 'OFICINA', 'ADIB - MATRIZ', '', '05:45:10', '05:50:45', '11:35:55', '03:05:00', '0', '4:52:45'],
  ['JOSE CARLOS', 'FIXA', 'SKJ9C62', 'CDR', '6', 'JUN', '14/06/2026', '17:28:30', 'TURNO 3', '1', 'OFICINA', 'ADIB - MATRIZ', '', '07:15:20', '07:05:10', '14:20:30', '03:08:00', '0', '1:08:15'],
  ['MARCOS RODRIGO', 'FIXA', 'SKJ9C62', 'CDR', '6', 'JUN', '16/06/2026', '15:23:05', 'TURNO 3', '3', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:10:15', '06:00:50', '12:11:05', '03:12:00', '0', '2:38:15'],
  ['RAMON CRISTIAN', 'FIXA', 'SJQ4D45', 'CDR', '6', 'JUN', '18/06/2026', '16:55:35', 'TURNO 3', '5', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:45:10', '06:55:25', '13:40:35', '03:15:00', '0', '0:58:03'],
  ['CARLOS HENRIQUE', 'FIXA', 'SKJ2C51', 'CDR', '6', 'JUN', '18/06/2026', '14:51:30', 'TURNO 1', '5', 'OFICINA', 'ADIB - MATRIZ', '', '05:50:00', '05:40:30', '11:30:30', '03:21:00', '0', '2:02:20'],
  ['ELQUISSON COSTA', 'FIXA', 'PKG0266', 'CDR', '6', 'JUN', '20/06/2026', '21:33:35', 'TURNO 3', '7', 'OFICINA', 'ADIB - MATRIZ', '', '08:55:15', '09:10:20', '18:05:35', '03:28:00', '0', '1:24:50'],
  ['SIDNEI MONTEIRO', 'FIXA', 'SJQ4D45', 'CDR', '6', 'JUN', '23/06/2026', '15:55:57', 'TURNO 3', '3', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:05:12', '06:15:45', '12:20:57', '03:35:00', '0', '4:23:45'],
  ['JOSE CARLOS', 'FIXA', 'SKJ9C62', 'CDR', '6', 'JUN', '23/06/2026', '15:38:40', 'TURNO 3', '3', 'OFICINA', 'ADIB - VERA CRUZ', '', '05:48:10', '05:55:30', '11:43:40', '03:55:00', '0', '0:13:40'],
  ['RUBENS BRAGA', 'FIXA', 'SKJ2C51', 'CDR', '6', 'JUN', '25/06/2026', '17:25:25', 'TURNO 3', '5', 'OFICINA', 'ADIB - MATRIZ', '', '06:25:15', '06:40:10', '13:05:25', '04:20:00', '0', '4:12:15'],
  ['PAULO LEAL', 'FIXA', 'PKG0266', 'CDR', '6', 'JUN', '26/06/2026', '19:40:35', 'TURNO 3', '6', 'OFICINA', 'ADIB - VERA CRUZ', '', '07:35:20', '07:20:15', '14:55:35', '04:45:00', '0', '4:13:10'],
  ['SIDNEI MONTEIRO', 'FIXA', 'SJQ4D45', 'CDR', '6', 'JUN', '28/06/2026', '17:45:50', 'TURNO 3', '1', 'OFICINA', 'ADIB - VERA CRUZ', '', '05:55:40', '06:05:10', '12:00:50', '05:45:00', '0', '0:04:40'],
  ['CARLOS HENRIQUE', 'FIXA', 'SKJ2C51', 'CDR', '6', 'JUN', '30/06/2026', '21:34:15', 'TURNO 3', '3', 'OFICINA', 'ADIB - MATRIZ', '', '06:15:30', '06:30:45', '12:46:15', '08:48:00', '0', '1:52:35'],
  ['RUBENS BRAGA', 'FIXA', 'SKJ2C51', 'CDR', '7', 'JUL', '02/07/2026', '15:10:00', 'TURNO 3', '5', 'OFICINA', 'ADIB - MATRIZ', '', '06:15:00', '06:05:00', '12:20:00', '02:50:00', '0', '3:04:45'],
  ['RAMON CRISTIAN', 'FIXA', 'SJQ4D45', 'CDR', '7', 'JUL', '04/07/2026', '15:15:00', 'TURNO 3', '7', 'OFICINA', 'ADIB - VERA CRUZ', '', '05:50:00', '06:10:00', '12:00:00', '03:15:00', '0', '1:54:30'],
  ['JOSE CARLOS', 'FIXA', 'SKJ9C62', 'CDR', '7', 'JUL', '08/07/2026', '18:52:00', 'TURNO 3', '4', 'OFICINA', 'ADIB - MATRIZ', '', '08:42:00', '07:15:00', '15:57:00', '02:55:00', '0', '4:56:50'],
  ['ELQUISSON COSTA', 'FIXA', 'PKG0266', 'CDR', '7', 'JUL', '08/07/2026', '15:30:00', 'TURNO 3', '4', 'OFICINA', 'ADIB - MATRIZ', '', '06:05:00', '05:55:00', '12:00:00', '03:30:00', '0', '1:43:38'],
  ['SIDNEI MONTEIRO', 'FIXA', 'SJQ4D45', 'CDR', '7', 'JUL', '10/07/2026', '17:25:00', 'TURNO 3', '6', 'OFICINA', 'ADIB - VERA CRUZ', '', '05:45:00', '05:40:00', '11:25:00', '06:00:00', '0', '4:44:55'],
  ['PAULO LEAL', 'FIXA', 'PKG0266', 'CDR', '7', 'JUL', '12/07/2026', '15:45:00', 'TURNO 3', '1', 'OFICINA', 'ADIB - VERA CRUZ', '', '06:10:00', '06:25:00', '12:35:00', '03:10:00', '0', '1:17:05']
];

export const TRIPS_DATA: TripRecord[] = parseRowsToTrips(
  GOOGLE_SHEETS_STANDARD_COLUMNS,
  RAW_GOOGLE_SHEETS_DATA
);

export const INITIAL_KPIS: KPIStats = calculateKPIsFromTrips(TRIPS_DATA);
