export type ShiftType = 'Turno 1' | 'Turno 2' | 'Turno 3' | string;
export type MetaStatusType = 'Meta Estourada' | 'Tolerância Meta' | 'Meta Batida' | 'Meta Superada';
export type TripCategory = 'CONFORME' | 'EXCEDENTE_REVENDA' | 'OFICINA';

export interface TripRecord {
  id: string;
  date: string;
  shift: ShiftType;
  driver: string;
  plate: string;
  fleetType: string;
  cycleTotal: string;
  cycleTotalSeconds: number;
  tmaCDR: string;
  tmaDiffMeta: string;
  tmaIsConforme: boolean;
  tmvOutbound: string;
  tmvInbound: string;
  trRevenda: string;
  trDiffMeta: string;
  trIsExceeded: boolean;
  metaStatus: MetaStatusType;
  metaPercentage: string;
  stopReason: string;
  auditDefenseStatus: string;
  category: TripCategory;
  origin: string;
  reseller: string;
  revenda?: string;
  unidade?: string;
  mesNum?: number;
  mes?: string;
  diaSemana?: number;
  tempoCarga?: string;
  tmvTotal?: string;
  fila?: string;
  notes?: string;
  telemetryLogs?: {
    departureBase: string;
    arrivalClientGate: string;
    dockEntry: string;
    dockRelease: string;
    returnBase: string;
    idleWaitTime: string;
    externalResponsibility: boolean;
  };
}

export interface KPIStats {
  totalTrips: number;
  averageCycle: string;
  cycleMeta: string;
  cycleDev: string;
  slaAdherence: string;
  tmaAverage: string;
  tmaMeta: string;
  tmaDev: string;
  tmvAverage: string;
  tmvMeta: string;
  tmvDev: string;
  tmvOutboundAvg: string;
  tmvInboundAvg: string;
  trAverage: string;
  trMeta: string;
  trDev: string;
  complianceRatio: string;
}

export interface FilterState {
  origin: string;
  reseller: string;
  fleet: string;
  period: string;
  day: string;
  shift: string;
  search: string;
  categoryFilter: 'ALL' | 'CONFORME' | 'EXCEDENTE_REVENDA' | 'OFICINA';
}

export interface RevendaMetas {
  cycleMeta: string;
  tmaMeta: string;
  tmvMeta: string;
  trMeta: string;
}

export interface MetasConfigState {
  [resellerKey: string]: RevendaMetas;
}
