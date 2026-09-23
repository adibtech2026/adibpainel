import { TripRecord, TripCategory, KPIStats, ShiftType, MetaStatusType } from '../types';

export interface DriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface SheetTab {
  sheetId: number;
  title: string;
}

// Extract Spreadsheet ID from full URL or return ID directly
export function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}

// List user spreadsheets from Google Drive
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheet[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Falha ao listar planilhas do Google Drive: ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

// Get tabs/sheets within a spreadsheet
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheets: SheetTab[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao acessar planilha (${res.status}): Verifique as permissões de acesso.`);
  }

  const data = await res.json();
  return {
    title: data.properties?.title || 'Planilha Sem Nome',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title
    }))
  };
}

// Fetch values from a specific sheet tab
export async function fetchSheetValues(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<string[][]> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao ler dados da planilha: ${errorText}`);
  }

  const data = await res.json();
  return data.values || [];
}

// Helper to convert time string (e.g. "16h 12m", "03:24", "16:00:00") into minutes
// Exact standard columns as defined by user's Google Sheets
export const GOOGLE_SHEETS_STANDARD_COLUMNS = [
  'MOTORISTA',
  'FROTA',
  'PLACA',
  'UNIDADE',
  'MÊS NUM',
  'MÊS',
  'DATA',
  'CICLO TOTAL',
  'TURNO REVENDA',
  'DIA DA SEMAN',
  'PARADA',
  'REVENDA',
  'TEMPO DE CARGA',
  'TMV IDA',
  'TMV VOLTA',
  'TMV',
  'TMA',
  'FILA',
  'TR'
];

export function parseTimeToMinutes(val: string | number): number {
  if (!val) return 0;
  if (typeof val === 'number') {
    return Math.round(val * 24 * 60);
  }
  const str = String(val).trim();
  if (!str || str === '—' || str === '-') return 0;

  // match "16h 12m" or "16h" or "12m"
  const hMatch = str.match(/(\d+)\s*h/i);
  const mMatch = str.match(/(\d+)\s*m/i);
  if (hMatch || mMatch) {
    const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
    const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
    return hours * 60 + minutes;
  }

  // match "16:12:00" or "1:25:25" or "16:12"
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length >= 2) {
      return parts[0] * 60 + parts[1];
    }
  }

  // numeric hours or minutes
  const num = parseFloat(str.replace(',', '.'));
  if (!isNaN(num)) {
    if (num > 24) return Math.round(num); // assume minutes
    return Math.round(num * 60); // assume decimal hours
  }

  return 0;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

// Smart parser that maps arbitrary spreadsheet rows to TripRecord
export function parseRowsToTrips(
  headersOrAllRows: string[] | string[][],
  possibleRows?: string[][]
): TripRecord[] {
  let headers: string[];
  let rows: string[][];

  if (possibleRows) {
    headers = headersOrAllRows as string[];
    rows = possibleRows;
  } else {
    const all = headersOrAllRows as string[][];
    if (!all || all.length === 0) return [];
    headers = all[0];
    rows = all.slice(1);
  }

  // Normalize header names to find indices
  const normalize = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const normHeaders = headers.map(normalize);

  const findCol = (...candidates: string[]) => {
    for (const c of candidates) {
      const normC = normalize(c);
      const exactIdx = normHeaders.findIndex((h) => h === normC);
      if (exactIdx !== -1) return exactIdx;
      const idx = normHeaders.findIndex((h) => h.includes(normC));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Exact matching for user's Google Sheets columns:
  // MOTORISTA, FROTA, PLACA, UNIDADE, MÊS NUM, MÊS, DATA, CICLO TOTAL, TURNO REVENDA,
  // DIA DA SEMAN, PARADA, REVENDA, TEMPO DE CARGA, TMV IDA, TMV VOLTA, TMV, TMA, FILA, TR
  const driverCol = findCol('motorista', 'condutor', 'driver');
  const fleetCol = findCol('frota', 'tipo');
  const plateCol = findCol('placa', 'cavalo', 'veiculo');
  const unidadeCol = findCol('unidade', 'origem', 'filial');
  const mesNumCol = findCol('mesnum', 'mesnumero');
  const mesCol = findCol('mes', 'mesnome');
  const dateCol = findCol('data', 'date', 'dia');
  const cycleCol = findCol('ciclototal', 'ciclo');
  const shiftCol = findCol('turnorevenda', 'turno');
  const diaSemanaCol = findCol('diadaseman', 'diasemana', 'dia');
  const stopCol = findCol('parada', 'motivo', 'ocorrencia');

  // Revenda column detection: must be the actual revenda/destination, never the shift (turnorevenda)
  let revendaCol = normHeaders.findIndex((h) => h === 'revenda');
  if (revendaCol === -1) {
    revendaCol = normHeaders.findIndex((h) =>
      ['revendadestino', 'clienterevenda', 'nomerevenda', 'revendaambev', 'unidaddestino', 'destino', 'destinatario', 'cliente'].includes(h)
    );
  }
  if (revendaCol === -1) {
    revendaCol = normHeaders.findIndex(
      (h) => (h.includes('revenda') || h.includes('destino') || h.includes('cliente')) && !h.includes('turno')
    );
  }
  if (revendaCol === -1) {
    revendaCol = normHeaders.findIndex(
      (h) => (h.includes('rev') || h.includes('filial')) && !h.includes('turno') && !h.includes('prev')
    );
  }

  const tempoCargaCol = findCol('tempodecarga', 'tempocarga', 'carga');
  const tmvOutCol = findCol('tmvida', 'ida');
  const tmvInCol = findCol('tmvvolta', 'volta');
  const tmvCol = findCol('tmv');
  const tmaCol = findCol('tma');
  const filaCol = findCol('fila');
  const trCol = findCol('tr');

  const trips: TripRecord[] = [];

  rows.forEach((row, i) => {
    if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) return;

    const id = `VG-${String(i + 1).padStart(3, '0')}`;
    const date = (dateCol !== -1 && row[dateCol]) || '03/05/2026';
    const rawShift = (shiftCol !== -1 && row[shiftCol]) ? String(row[shiftCol]).trim() : 'TURNO 3';
    const shift: ShiftType = rawShift || 'TURNO 3';

    const driver = (driverCol !== -1 && row[driverCol]) ? String(row[driverCol]).trim() : `Motorista ${i + 1}`;
    const plate = (plateCol !== -1 && row[plateCol]) ? String(row[plateCol]).trim() : 'SJQ4D45';
    const fleetType = (fleetCol !== -1 && row[fleetCol]) ? String(row[fleetCol]).trim() : 'FIXA';
    const unidade = (unidadeCol !== -1 && row[unidadeCol]) ? String(row[unidadeCol]).trim() : 'CDR';
    const mesNum = (mesNumCol !== -1 && parseInt(row[mesNumCol], 10)) || undefined;
    const mes = (mesCol !== -1 && row[mesCol]) || undefined;
    const diaSemana = (diaSemanaCol !== -1 && parseInt(row[diaSemanaCol], 10)) || undefined;
    const rawStop = (stopCol !== -1 && row[stopCol]) || 'OFICINA';
    
    let reseller = '';
    if (revendaCol !== -1 && row[revendaCol] !== undefined && row[revendaCol] !== null) {
      reseller = String(row[revendaCol]).trim();
    }
    if (!reseller) {
      reseller = 'REVENDA GERAL';
    }

    const tempoCarga = (tempoCargaCol !== -1 && row[tempoCargaCol]) || '00:00:00';
    const fila = (filaCol !== -1 && row[filaCol]) || '0';

    const rawCycle = (cycleCol !== -1 && row[cycleCol]) || '16:00:00';
    const rawTMA = (tmaCol !== -1 && row[tmaCol]) || '03:30:00';
    const rawOut = (tmvOutCol !== -1 && row[tmvOutCol]) || '06:00:00';
    const rawIn = (tmvInCol !== -1 && row[tmvInCol]) || '06:00:00';
    const rawTMV = (tmvCol !== -1 && row[tmvCol]) || '12:00:00';
    const rawTR = (trCol !== -1 && row[trCol]) || '02:00:00';

    const cycleMin = parseTimeToMinutes(rawCycle);
    const trMin = parseTimeToMinutes(rawTR);
    const tmaMin = parseTimeToMinutes(rawTMA);

    const formattedCycle = formatMinutesToTime(cycleMin || 960);
    const formattedTMA = formatMinutesToTime(tmaMin || 210);
    const formattedTR = formatMinutesToTime(trMin || 120);

    // Classification according to Operational SLA
    // SLA Meta de TR na Revenda: 02h00m (120 min)
    // SLA Meta de Ciclo Total: 16h00m (960 min)
    let category: TripCategory = 'CONFORME';
    let auditStatus = 'Conforme (SLA Atingido)';

    if (trMin > 120) {
      category = 'EXCEDENTE_REVENDA';
      const excessMin = trMin - 120;
      auditStatus = `Retenção Revenda (+${formatMinutesToTime(excessMin)})`;
    } else if (rawStop && rawStop.toUpperCase().includes('OFICINA') && cycleMin > 960) {
      category = 'OFICINA';
      auditStatus = 'Manutenção / Oficina';
    } else if (cycleMin > 960) {
      category = 'EXCEDENTE_REVENDA';
      auditStatus = 'Ciclo Excedente (Gargalo)';
    }

    const metaPercent = cycleMin > 0 ? ((cycleMin / 960) * 100).toFixed(1) + '%' : '100.0%';

    let metaStatus: MetaStatusType = 'Meta Batida';
    if (cycleMin > 990) {
      metaStatus = 'Meta Estourada';
    } else if (cycleMin > 960) {
      metaStatus = 'Tolerância Meta';
    } else if (cycleMin < 900) {
      metaStatus = 'Meta Superada';
    }

    trips.push({
      id,
      date,
      shift,
      driver,
      plate,
      fleetType,
      unidade,
      mesNum,
      mes,
      diaSemana,
      cycleTotal: formattedCycle,
      cycleTotalSeconds: (cycleMin || 960) * 60,
      tmaCDR: formattedTMA,
      tmaDiffMeta: tmaMin <= 210 ? `-${210 - tmaMin}m vs meta` : `+${tmaMin - 210}m vs meta`,
      tmaIsConforme: tmaMin <= 210,
      tmvOutbound: rawOut,
      tmvInbound: rawIn,
      tmvTotal: rawTMV,
      trRevenda: formattedTR,
      trDiffMeta: trMin > 120 ? `+${formatMinutesToTime(trMin - 120)} vs meta` : `-${120 - trMin}m vs meta`,
      trIsExceeded: trMin > 120,
      metaStatus,
      metaPercentage: metaPercent,
      stopReason: rawStop || '—',
      auditDefenseStatus: auditStatus,
      category,
      origin: unidade || 'CDR',
      reseller,
      revenda: reseller,
      tempoCarga,
      fila,
      notes: trMin > 120 
        ? `Retenção na revenda ${reseller}: TR de ${formattedTR} (meta é 02h00m). Ocorrência operacional de responsabilidade externa.`
        : `Operação conforme os parâmetros contratuais de ciclo e trânsito.`,
      telemetryLogs: {
        departureBase: `${date} 06:00`,
        arrivalClientGate: `${date} 12:00`,
        idleWaitTime: trMin > 120 ? formatMinutesToTime(trMin - 120) : '00h 15m',
        dockEntry: `${date} 13:00`,
        dockRelease: `${date} 15:00`,
        returnBase: `${date} 21:00`,
        externalResponsibility: trMin > 120
      }
    });
  });

  return trips;
}

// Calculate KPI summary dynamically from trips array
export function calculateKPIsFromTrips(
  trips: TripRecord[],
  customMetas?: {
    cycleMeta?: string;
    tmaMeta?: string;
    tmvMeta?: string;
    trMeta?: string;
  }
): KPIStats {
  const metaCycleStr = customMetas?.cycleMeta || '16h 00m';
  const metaTmaStr = customMetas?.tmaMeta || '03h 30m';
  const metaTmvStr = customMetas?.tmvMeta || '11h 00m';
  const metaTrStr = customMetas?.trMeta || '02h 00m';

  const metaCycleMin = parseTimeToMinutes(metaCycleStr) || 960;
  const metaTmaMin = parseTimeToMinutes(metaTmaStr) || 210;
  const metaTmvMin = parseTimeToMinutes(metaTmvStr) || 660;
  const metaTrMin = parseTimeToMinutes(metaTrStr) || 120;

  if (trips.length === 0) {
    return {
      averageCycle: '00h 00m',
      cycleMeta: metaCycleStr,
      cycleDev: '+00m',
      slaAdherence: '0%',
      complianceRatio: '0 / 0',
      totalTrips: 0,
      tmaAverage: '00h 00m',
      tmaMeta: metaTmaStr,
      tmaDev: '0m',
      tmvAverage: '00h 00m',
      tmvMeta: metaTmvStr,
      tmvDev: '0m',
      tmvOutboundAvg: '00h 00m',
      tmvInboundAvg: '00h 00m',
      trAverage: '00h 00m',
      trMeta: metaTrStr,
      trDev: '0m'
    };
  }

  let totalCycleMin = 0;
  let totalTMAMin = 0;
  let totalTRMin = 0;
  let totalTMVOutMin = 0;
  let totalTMVInMin = 0;
  let compliantCount = 0;

  trips.forEach((t) => {
    const cMin = parseTimeToMinutes(t.cycleTotal);
    const tmaMin = parseTimeToMinutes(t.tmaCDR);
    const trMin = parseTimeToMinutes(t.trRevenda);
    const tmvOutMin = parseTimeToMinutes(t.tmvOutbound);
    const tmvInMin = parseTimeToMinutes(t.tmvInbound);

    totalCycleMin += cMin;
    totalTMAMin += tmaMin;
    totalTRMin += trMin;
    totalTMVOutMin += tmvOutMin;
    totalTMVInMin += tmvInMin;

    if (t.category === 'CONFORME' || cMin <= (metaCycleMin + 30)) {
      compliantCount++;
    }
  });

  const count = trips.length;
  const avgCycle = Math.round(totalCycleMin / count);
  const avgTMA = Math.round(totalTMAMin / count);
  const avgTR = Math.round(totalTRMin / count);
  const avgTMVOut = Math.round(totalTMVOutMin / count);
  const avgTMVIn = Math.round(totalTMVInMin / count);
  const avgTMV = avgTMVOut + avgTMVIn;

  const slaAdherence = ((compliantCount / count) * 100).toFixed(1) + '%';
  const cycleDiff = avgCycle - metaCycleMin;
  const cycleDev =
    cycleDiff >= 0
      ? `+${cycleDiff}m (+${((cycleDiff / metaCycleMin) * 100).toFixed(1)}%)`
      : `-${Math.abs(cycleDiff)}m (-${((Math.abs(cycleDiff) / metaCycleMin) * 100).toFixed(1)}%)`;

  const tmaDiff = avgTMA - metaTmaMin;
  const tmaDev = tmaDiff <= 0 ? `-${Math.abs(tmaDiff)}m (${Math.round((avgTMA / metaTmaMin) * 100)}% da meta)` : `+${tmaDiff}m`;

  const tmvDiff = avgTMV - metaTmvMin;
  const tmvDev = tmvDiff >= 0 ? `+${formatMinutesToTime(tmvDiff)} (+${((tmvDiff / metaTmvMin) * 100).toFixed(1)}%)` : `-${formatMinutesToTime(Math.abs(tmvDiff))}`;

  const trDiff = avgTR - metaTrMin;
  const trDev = trDiff >= 0 ? `+${trDiff}m (+${((trDiff / metaTrMin) * 100).toFixed(1)}% desvio)` : `-${Math.abs(trDiff)}m`;

  return {
    averageCycle: formatMinutesToTime(avgCycle),
    cycleMeta: metaCycleStr,
    cycleDev,
    slaAdherence,
    complianceRatio: `${compliantCount} / ${count}`,
    totalTrips: count,
    tmaAverage: formatMinutesToTime(avgTMA),
    tmaMeta: metaTmaStr,
    tmaDev,
    tmvAverage: formatMinutesToTime(avgTMV),
    tmvMeta: metaTmvStr,
    tmvDev,
    tmvOutboundAvg: formatMinutesToTime(avgTMVOut),
    tmvInboundAvg: formatMinutesToTime(avgTMVIn),
    trAverage: formatMinutesToTime(avgTR),
    trMeta: metaTrStr,
    trDev
  };
}
