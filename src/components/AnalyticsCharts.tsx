import React, { useMemo } from 'react';
import { TripRecord, RevendaMetas } from '../types';
import { parseTimeToMinutes, formatMinutesToTime } from '../services/googleSheets';
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, Trophy } from 'lucide-react';

interface AnalyticsChartsProps {
  onSelectTrip?: (tripId: string) => void;
  trips: TripRecord[];
  allTrips?: TripRecord[];
  currentReseller?: string;
  activeMetas?: RevendaMetas;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  trips,
  activeMetas = {
    cycleMeta: '16h 00m',
    tmaMeta: '03h 30m',
    tmvMeta: '11h 00m',
    trMeta: '02h 00m'
  }
}) => {
  const targetTmaMin = parseTimeToMinutes(activeMetas.tmaMeta) || 210; // 03h 30m
  const targetTrMin = parseTimeToMinutes(activeMetas.trMeta) || 120;   // 02h 00m
  const targetCycleMin = parseTimeToMinutes(activeMetas.cycleMeta) || 960; // 16h 00m

  // Monthly aggregated data for TMA and TR (Charts 1 & 2)
  const monthlyData = useMemo(() => {
    if (trips.length === 0) return [];

    const monthOrder: Record<string, { num: number; label: string }> = {
      JAN: { num: 1, label: 'JAN' },
      FEV: { num: 2, label: 'FEV' },
      MAR: { num: 3, label: 'MAR' },
      ABR: { num: 4, label: 'ABR' },
      MAI: { num: 5, label: 'MAI' },
      JUN: { num: 6, label: 'JUN' },
      JUL: { num: 7, label: 'JUL' },
      AGO: { num: 8, label: 'AGO' },
      SET: { num: 9, label: 'SET' },
      OUT: { num: 10, label: 'OUT' },
      NOV: { num: 11, label: 'NOV' },
      DEZ: { num: 12, label: 'DEZ' }
    };

    const map = new Map<
      string,
      {
        mesKey: string;
        mesNum: number;
        totalTmaMin: number;
        totalTrMin: number;
        count: number;
      }
    >();

    trips.forEach((t) => {
      let mKey = (t.mes || '').trim().toUpperCase();
      let mNum = Number(t.mesNum) || 0;

      if (!mKey && t.date) {
        const parts = t.date.split('/');
        if (parts.length === 3) {
          const idx = Number(parts[1]);
          const keys = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
          mKey = keys[idx] || `MÊS ${idx}`;
          mNum = idx;
        }
      }

      if (!mKey) mKey = 'GERAL';
      const info = monthOrder[mKey] || { num: mNum || 99, label: mKey };

      if (!map.has(mKey)) {
        map.set(mKey, {
          mesKey: mKey,
          mesNum: info.num,
          totalTmaMin: 0,
          totalTrMin: 0,
          count: 0
        });
      }

      const item = map.get(mKey)!;
      item.totalTmaMin += parseTimeToMinutes(t.tmaCDR);
      item.totalTrMin += parseTimeToMinutes(t.trRevenda);
      item.count += 1;
    });

    return Array.from(map.values())
      .sort((a, b) => a.mesNum - b.mesNum)
      .map((item) => {
        const avgTmaMin = Math.round(item.totalTmaMin / item.count);
        const avgTrMin = Math.round(item.totalTrMin / item.count);
        return {
          mesKey: item.mesKey,
          avgTmaMin,
          avgTmaStr: formatMinutesToTime(avgTmaMin),
          avgTrMin,
          avgTrStr: formatMinutesToTime(avgTrMin)
        };
      });
  }, [trips]);

  // Dimensions & Coordinates for Charts 1 & 2
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingTop = 65;
  const paddingBottom = 45;
  const paddingLeft = 55;
  const paddingRight = 55;
  const availableW = svgWidth - paddingLeft - paddingRight;
  const availableH = svgHeight - paddingTop - paddingBottom;
  const baseY = svgHeight - paddingBottom;

  // Chart 1: TMA Points, Gridlines & Area
  const tmaChartData = useMemo(() => {
    if (monthlyData.length === 0) return null;

    let minVal = targetTmaMin - 30;
    let maxVal = targetTmaMin + 30;

    monthlyData.forEach((m) => {
      if (m.avgTmaMin < minVal) minVal = m.avgTmaMin - 20;
      if (m.avgTmaMin > maxVal) maxVal = m.avgTmaMin + 20;
    });
    if (minVal < 0) minVal = 0;

    const range = maxVal - minVal || 1;

    const points = monthlyData.map((m, idx) => {
      const x =
        monthlyData.length === 1
          ? svgWidth / 2
          : paddingLeft + (idx / (monthlyData.length - 1)) * availableW;
      const y = paddingTop + availableH - ((m.avgTmaMin - minVal) / range) * availableH;
      return {
        x,
        y,
        valStr: m.avgTmaStr,
        mesKey: m.mesKey
      };
    });

    const rawTargetY = paddingTop + availableH - ((targetTmaMin - minVal) / range) * availableH;
    const targetY = Math.min(baseY - 8, Math.max(paddingTop + 10, rawTargetY));
    const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    const areaPoints = `${firstX},${baseY} ${polylinePoints} ${lastX},${baseY}`;

    // Linhas de grade de referência sutis
    const gridLines = [0.25, 0.55, 0.85].map((ratio) => {
      const val = minVal + ratio * range;
      const y = paddingTop + availableH - ratio * availableH;
      return {
        y,
        valStr: formatMinutesToTime(Math.round(val))
      };
    });

    return {
      points,
      targetY,
      polylinePoints,
      areaPoints,
      gridLines
    };
  }, [monthlyData, targetTmaMin, availableH, availableW, baseY]);

  // Chart 2: TR Points, Gridlines & Area (Idêntico ao padrão profissional do TMA, sem cores semafóricas)
  const trChartData = useMemo(() => {
    if (monthlyData.length === 0) return null;

    let minVal = targetTrMin - 30;
    let maxVal = targetTrMin + 40;

    monthlyData.forEach((m) => {
      if (m.avgTrMin < minVal) minVal = m.avgTrMin - 20;
      if (m.avgTrMin > maxVal) maxVal = m.avgTrMin + 20;
    });
    if (minVal < 0) minVal = 0;

    const range = maxVal - minVal || 1;

    const points = monthlyData.map((m, idx) => {
      const x =
        monthlyData.length === 1
          ? svgWidth / 2
          : paddingLeft + (idx / (monthlyData.length - 1)) * availableW;
      const y = paddingTop + availableH - ((m.avgTrMin - minVal) / range) * availableH;

      return {
        x,
        y,
        valStr: m.avgTrStr,
        mesKey: m.mesKey
      };
    });

    const rawTargetY = paddingTop + availableH - ((targetTrMin - minVal) / range) * availableH;
    const targetY = Math.min(baseY - 8, Math.max(paddingTop + 10, rawTargetY));
    const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    const areaPoints = `${firstX},${baseY} ${polylinePoints} ${lastX},${baseY}`;

    // Linhas de grade de referência sutis
    const gridLines = [0.25, 0.55, 0.85].map((ratio) => {
      const val = minVal + ratio * range;
      const y = paddingTop + availableH - ratio * availableH;
      return {
        y,
        valStr: formatMinutesToTime(Math.round(val))
      };
    });

    return {
      points,
      targetY,
      polylinePoints,
      areaPoints,
      gridLines
    };
  }, [monthlyData, targetTrMin, availableH, availableW, baseY]);

  // =========================================================================
  // Chart 3: TR POR TURNO com Linhas Coloridas Conforme o Painel:
  // - Batendo Meta: VERDE (#22c55e / emerald)
  // - Próximo / Atenção: AMARELO (#eab308 / amber)
  // - Perdendo Meta: VERMELHO (#ef4444 / red)
  // =========================================================================
  const shiftTrHorizontalData = useMemo(() => {
    if (trips.length === 0) return null;

    const shifts: Record<string, { totalTR: number; count: number }> = {
      'Turno 1': { totalTR: 0, count: 0 },
      'Turno 2': { totalTR: 0, count: 0 },
      'Turno 3': { totalTR: 0, count: 0 }
    };

    trips.forEach((t) => {
      const s = (t.shift || 'Turno 3').trim();
      const trMin = parseTimeToMinutes(t.trRevenda);
      const matchedKey = Object.keys(shifts).find((k) => k.toLowerCase() === s.toLowerCase()) || 'Turno 3';
      shifts[matchedKey].totalTR += trMin;
      shifts[matchedKey].count += 1;
    });

    let maxValMin = 280; // ~4h 40m
    const list = ['Turno 1', 'Turno 2', 'Turno 3'].map((shiftName) => {
      const d = shifts[shiftName];
      const avgTRMin = d.count > 0 ? Math.round(d.totalTR / d.count) : 0;
      if (avgTRMin > maxValMin - 30) maxValMin = avgTRMin + 40;

      // Status das cores de acordo com o painel:
      // Verde = batendo (<= meta)
      // Amarelo = próximo atenção (entre meta e meta + 25%)
      // Vermelho = perdendo (> meta + 25%)
      let statusType: 'batendo' | 'atencao' | 'perdendo' = 'batendo';
      let statusLabel = 'Batendo Meta';
      let barGradient = 'from-emerald-600 to-emerald-400';
      let barShadow = 'shadow-[0_0_12px_rgba(34,197,94,0.35)]';
      let textColor = 'text-emerald-400';
      let badgeBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';

      if (avgTRMin <= targetTrMin) {
        statusType = 'batendo';
        statusLabel = 'Batendo Meta';
        barGradient = 'from-emerald-600 to-emerald-400';
        barShadow = 'shadow-[0_0_12px_rgba(34,197,94,0.35)]';
        textColor = 'text-emerald-400';
        badgeBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      } else if (avgTRMin <= targetTrMin * 1.25) {
        statusType = 'atencao';
        statusLabel = 'Próximo (Atenção)';
        barGradient = 'from-amber-600 to-amber-400';
        barShadow = 'shadow-[0_0_12px_rgba(234,179,8,0.35)]';
        textColor = 'text-amber-400';
        badgeBg = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      } else {
        statusType = 'perdendo';
        statusLabel = 'Perdendo Meta';
        barGradient = 'from-red-600 to-red-400';
        barShadow = 'shadow-[0_0_12px_rgba(239,68,68,0.35)]';
        textColor = 'text-red-400';
        badgeBg = 'bg-red-500/15 border-red-500/30 text-red-400';
      }

      return {
        name: shiftName,
        count: d.count,
        avgTRMin,
        avgTRStr: formatMinutesToTime(avgTRMin),
        diffMin: avgTRMin - targetTrMin,
        pctMeta: ((avgTRMin / targetTrMin) * 100).toFixed(1),
        statusType,
        statusLabel,
        barGradient,
        barShadow,
        textColor,
        badgeBg
      };
    });

    const targetPct = (targetTrMin / maxValMin) * 100;

    const shiftsWithWidth = list.map((s) => ({
      ...s,
      widthPct: Math.min(100, Math.max(6, (s.avgTRMin / maxValMin) * 100))
    }));

    return {
      shifts: shiftsWithWidth,
      targetPct,
      maxValMin
    };
  }, [trips, targetTrMin]);

  // Ranking de Motoristas por Ciclo Médio (Otimizado e filtrado dinamicamente com base nos filtros ativos e período)
  const driverRankingData = useMemo(() => {
    if (trips.length === 0) return [];

    const driverMap = new Map<
      string,
      {
        totalCycleMin: number;
        count: number;
        bestCycleMin: number;
        withinMetaCount: number;
      }
    >();

    trips.forEach((t) => {
      const driverName = (t.driver || '').trim();
      if (!driverName || driverName === '—' || driverName === '-' || driverName === 'N/A') return;

      let cycleMin = 0;
      if (t.cycleTotalSeconds && t.cycleTotalSeconds > 0) {
        cycleMin = Math.round(t.cycleTotalSeconds / 60);
      } else if (t.cycleTotal) {
        cycleMin = parseTimeToMinutes(t.cycleTotal) || 0;
      }

      if (cycleMin <= 0) return;

      const current = driverMap.get(driverName) || {
        totalCycleMin: 0,
        count: 0,
        bestCycleMin: Infinity,
        withinMetaCount: 0
      };

      current.totalCycleMin += cycleMin;
      current.count += 1;
      if (cycleMin < current.bestCycleMin) {
        current.bestCycleMin = cycleMin;
      }
      if (cycleMin <= targetCycleMin) {
        current.withinMetaCount += 1;
      }
      driverMap.set(driverName, current);
    });

    const list = Array.from(driverMap.entries()).map(([driver, data]) => {
      const avgCycleMin = Math.round(data.totalCycleMin / data.count);
      const isWithinMeta = avgCycleMin <= targetCycleMin;
      const pctMeta = Math.round((avgCycleMin / targetCycleMin) * 100);
      const diffToMetaMin = avgCycleMin - targetCycleMin;

      return {
        driver,
        count: data.count,
        avgCycleMin,
        avgCycleStr: formatMinutesToTime(avgCycleMin),
        bestCycleMin: data.bestCycleMin,
        bestCycleStr: formatMinutesToTime(data.bestCycleMin),
        isWithinMeta,
        pctMeta,
        diffToMetaMin
      };
    });

    // Ordenar pelo menor (melhor) tempo médio de ciclo
    return list.sort((a, b) => a.avgCycleMin - b.avgCycleMin);
  }, [trips, targetCycleMin]);

  if (trips.length === 0 || monthlyData.length === 0) {
    return (
      <section className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center justify-center gap-2">
        <h3 className="text-[15px] font-bold text-on-surface">
          Nenhuma viagem encontrada para os filtros selecionados
        </h3>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Linha Superior: Os 2 Gráficos de Mês */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ===================================================================
            GRAFICO 1: TMA Médio por Mês (CDR)
            Padrão Profissional com Área Preenchida Translúcida (Gradiente)
            =================================================================== */}
        <div className="relative rounded-2xl bg-surface-container-low border border-outline-variant/30 p-3 sm:p-4 shadow-sm overflow-hidden flex flex-col items-center">
          {tmaChartData && (
            <svg
              className="w-full h-auto max-h-64"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Gradiente Preenchido Suave - Padrão Profissional (Translúcido, Não 100% Sólido) */}
                <linearGradient id="areaGradTMA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.50" />
                  <stop offset="45%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="90%" stopColor="#0369a1" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                </linearGradient>

                <filter id="lineGlowTMA" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Título Centralizado em Amarelo/Dourado Padrão */}
              <text
                x={svgWidth / 2}
                y="28"
                textAnchor="middle"
                fill="#facc15"
                fontSize="15"
                fontWeight="bold"
                letterSpacing="0.4"
              >
                TMA Médio por Mês
              </text>

              {/* Linhas de Grade de Fundo Sutis (Gridlines) */}
              {tmaChartData.gridLines.map((gl, gIdx) => (
                <g key={`tma-grid-${gIdx}`}>
                  <line
                    x1={paddingLeft - 10}
                    x2={svgWidth - paddingRight + 10}
                    y1={gl.y}
                    y2={gl.y}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 16}
                    y={gl.y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {gl.valStr}
                  </text>
                </g>
              ))}

              {/* Linha de Base do Eixo X */}
              <line
                x1={paddingLeft - 10}
                x2={svgWidth - paddingRight + 10}
                y1={baseY}
                y2={baseY}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />

              {/* Área Preenchida com Gradiente Translúcido Profissional */}
              {tmaChartData.points.length > 1 ? (
                <polygon fill="url(#areaGradTMA)" points={tmaChartData.areaPoints} />
              ) : (
                <polygon
                  fill="url(#areaGradTMA)"
                  points={`${paddingLeft},${baseY} ${paddingLeft},${tmaChartData.points[0].y.toFixed(1)} ${svgWidth - paddingRight},${tmaChartData.points[0].y.toFixed(1)} ${svgWidth - paddingRight},${baseY}`}
                />
              )}

              {/* Linha Superior Contínua Ciano com Brilho Suave */}
              {tmaChartData.points.length > 1 ? (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#lineGlowTMA)"
                  points={tmaChartData.polylinePoints}
                />
              ) : (
                <line
                  x1={paddingLeft}
                  x2={svgWidth - paddingRight}
                  y1={tmaChartData.points[0].y}
                  y2={tmaChartData.points[0].y}
                  stroke="#38bdf8"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  filter="url(#lineGlowTMA)"
                />
              )}

              {/* Linha de Meta Pontilhada Verde */}
              <line
                x1={paddingLeft - 10}
                x2={svgWidth - paddingRight + 10}
                y1={tmaChartData.targetY}
                y2={tmaChartData.targetY}
                stroke="#22c55e"
                strokeDasharray="4 4"
                strokeWidth="2"
              />

              {/* Badge da Meta no canto direito */}
              <g transform={`translate(${svgWidth - paddingRight - 85}, ${tmaChartData.targetY - 11})`}>
                <rect
                  width="95"
                  height="20"
                  rx="5"
                  fill="#052e16"
                  stroke="#22c55e"
                  strokeWidth="1"
                  className="drop-shadow-sm"
                />
                <text
                  x="47"
                  y="14"
                  textAnchor="middle"
                  fill="#4ade80"
                  fontSize="10.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  META: {activeMetas.tmaMeta}
                </text>
              </g>

              {/* Diamantes, Valores em Horas e Eixo X */}
              {tmaChartData.points.map((p, idx) => (
                <g key={`tma-pt-${idx}`}>
                  {/* Horário no topo em branco com destaque */}
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="monospace"
                    filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.8))"
                  >
                    {p.valStr}
                  </text>

                  {/* Marcador Diamante com contorno branco e centro ciano */}
                  <polygon
                    points={`${p.x},${p.y - 6} ${p.x + 6},${p.y} ${p.x},${p.y + 6} ${p.x - 6},${p.y}`}
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="filter drop-shadow-sm"
                  />

                  {/* Pequeno traço marcador no eixo X */}
                  <line
                    x1={p.x}
                    x2={p.x}
                    y1={baseY}
                    y2={baseY + 5}
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />

                  {/* Nome do Mês */}
                  <text
                    x={p.x}
                    y={baseY + 20}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {p.mesKey}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* ===================================================================
            GRAFICO 2: TR Médio por Mês (Revenda)
            Padrão Profissional Idêntico ao TMA (sem cores semafóricas, área preenchida)
            =================================================================== */}
        <div className="relative rounded-2xl bg-surface-container-low border border-outline-variant/30 p-3 sm:p-4 shadow-sm overflow-hidden flex flex-col items-center">
          {trChartData && (
            <svg
              className="w-full h-auto max-h-64"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Gradiente Preenchido Suave - Padrão Profissional (Translúcido, Não 100% Sólido) */}
                <linearGradient id="areaGradTR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.50" />
                  <stop offset="45%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="90%" stopColor="#0369a1" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                </linearGradient>

                <filter id="lineGlowTR" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Título Centralizado em Amarelo/Dourado Padrão */}
              <text
                x={svgWidth / 2}
                y="28"
                textAnchor="middle"
                fill="#facc15"
                fontSize="15"
                fontWeight="bold"
                letterSpacing="0.4"
              >
                TR Médio por Mês (Revenda)
              </text>

              {/* Linhas de Grade de Fundo Sutis (Gridlines) */}
              {trChartData.gridLines.map((gl, gIdx) => (
                <g key={`tr-grid-${gIdx}`}>
                  <line
                    x1={paddingLeft - 10}
                    x2={svgWidth - paddingRight + 10}
                    y1={gl.y}
                    y2={gl.y}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 16}
                    y={gl.y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {gl.valStr}
                  </text>
                </g>
              ))}

              {/* Linha de Base do Eixo X */}
              <line
                x1={paddingLeft - 10}
                x2={svgWidth - paddingRight + 10}
                y1={baseY}
                y2={baseY}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />

              {/* Área Preenchida com Gradiente Translúcido Profissional */}
              {trChartData.points.length > 1 ? (
                <polygon fill="url(#areaGradTR)" points={trChartData.areaPoints} />
              ) : (
                <polygon
                  fill="url(#areaGradTR)"
                  points={`${paddingLeft},${baseY} ${paddingLeft},${trChartData.points[0].y.toFixed(1)} ${svgWidth - paddingRight},${trChartData.points[0].y.toFixed(1)} ${svgWidth - paddingRight},${baseY}`}
                />
              )}

              {/* Linha Superior Contínua Ciano com Brilho Suave (Igual ao TMA, sem cores) */}
              {trChartData.points.length > 1 ? (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#lineGlowTR)"
                  points={trChartData.polylinePoints}
                />
              ) : (
                <line
                  x1={paddingLeft}
                  x2={svgWidth - paddingRight}
                  y1={trChartData.points[0].y}
                  y2={trChartData.points[0].y}
                  stroke="#38bdf8"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  filter="url(#lineGlowTR)"
                />
              )}

              {/* Linha de Meta Pontilhada Verde */}
              <line
                x1={paddingLeft - 10}
                x2={svgWidth - paddingRight + 10}
                y1={trChartData.targetY}
                y2={trChartData.targetY}
                stroke="#22c55e"
                strokeDasharray="4 4"
                strokeWidth="2"
              />

              {/* Badge da Meta no canto direito */}
              <g transform={`translate(${svgWidth - paddingRight - 85}, ${trChartData.targetY - 11})`}>
                <rect
                  width="95"
                  height="20"
                  rx="5"
                  fill="#052e16"
                  stroke="#22c55e"
                  strokeWidth="1"
                  className="drop-shadow-sm"
                />
                <text
                  x="47"
                  y="14"
                  textAnchor="middle"
                  fill="#4ade80"
                  fontSize="10.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  META: {activeMetas.trMeta}
                </text>
              </g>

              {/* Diamantes, Valores em Horas (Branco puro) e Eixo X */}
              {trChartData.points.map((p, idx) => (
                <g key={`tr-pt-${idx}`}>
                  {/* Horário no topo em branco com destaque (igual ao TMA) */}
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="monospace"
                    filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.8))"
                  >
                    {p.valStr}
                  </text>

                  {/* Marcador Diamante com contorno branco e centro ciano */}
                  <polygon
                    points={`${p.x},${p.y - 6} ${p.x + 6},${p.y} ${p.x},${p.y + 6} ${p.x - 6},${p.y}`}
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="filter drop-shadow-sm"
                  />

                  {/* Pequeno traço marcador no eixo X */}
                  <line
                    x1={p.x}
                    x2={p.x}
                    y1={baseY}
                    y2={baseY + 5}
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />

                  {/* Nome do Mês */}
                  <text
                    x={p.x}
                    y={baseY + 20}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {p.mesKey}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* ===================================================================
          LINHA INFERIOR: TR POR TURNO & RANKING CORPORATIVO DE MOTORISTAS
          Dispostos lado a lado em 2 colunas no desktop (lg:grid-cols-2)
          =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRAFICO 3: TR POR TURNO (Cada Turno um Embaixo do Outro com a Meta) */}
        {shiftTrHorizontalData && (
          <div className="relative rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5 sm:p-6 shadow-sm flex flex-col gap-4 overflow-hidden">
            {/* Cabeçalho do Card Integrado com o Painel */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px] text-on-surface tracking-tight">
                    TR por Turno (Retenção em Doca)
                  </h3>
                </div>
              </div>

              {/* Badge de Meta */}
              <div className="flex items-center font-mono text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold">
                  Meta: {activeMetas.trMeta}
                </span>
              </div>
            </div>

            {/* Área das Barras com Alinhamento e Linha de Meta */}
            <div className="relative pt-6 pb-2 px-1 sm:px-3 flex flex-col gap-6">
              {/* Linha Vertical da Meta Tracejada atravessando os turnos */}
              <div
                className="absolute top-0 bottom-4 z-20 pointer-events-none flex flex-col items-center"
                style={{
                  left: `calc(90px + (100% - 190px) * ${shiftTrHorizontalData.targetPct / 100})`
                }}
              >
                <div className="px-2.5 py-0.5 rounded bg-surface-container-highest border border-[#22c55e] text-[#22c55e] font-mono text-[11px] font-bold shadow-md whitespace-nowrap mb-1">
                  META: {activeMetas.trMeta}
                </div>
                <div className="w-[2px] flex-1 border-l-2 border-dashed border-[#22c55e]/90"></div>
              </div>

              {/* Linhas dos Turnos (Turno 1: Verde, Turno 2: Amarelo, Turno 3: Vermelho) */}
              {shiftTrHorizontalData.shifts.map((shift) => (
                <div key={shift.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    {/* Nome do Turno à Esquerda */}
                    <div className="w-[80px] shrink-0 text-left">
                      <span className="font-bold text-[14px] text-on-surface">
                        {shift.name}
                      </span>
                    </div>

                    {/* Barra e Valor na Direita */}
                    <div className="flex-1 relative flex items-center">
                      {/* Barra Estilizada com a Cor Semântica (Verde, Amarelo ou Vermelho) */}
                      <div
                        className={`h-8 bg-gradient-to-r ${shift.barGradient} ${shift.barShadow} hover:brightness-110 transition-all duration-500 rounded-md relative flex items-center cursor-pointer`}
                        style={{
                          width: `calc((100% - 95px) * ${shift.widthPct / 100})`
                        }}
                        title={`${shift.name}: ${shift.avgTRStr} - ${shift.statusLabel}`}
                      ></div>

                      {/* Número na Direita da Barra com a Cor Correspondente */}
                      <span className={`font-mono text-[15px] font-black ${shift.textColor} ml-3 shrink-0`}>
                        {shift.avgTRStr}
                      </span>
                    </div>
                  </div>

                  {/* Sub-rótulo abaixo da barra com indicador e status */}
                  <div className="ml-[92px] flex items-center gap-2.5 text-[11px] font-mono">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold ${shift.badgeBg}`}>
                      {shift.statusType === 'batendo' && <CheckCircle2 className="w-3 h-3" />}
                      {shift.statusType === 'atencao' && <AlertCircle className="w-3 h-3" />}
                      {shift.statusType === 'perdendo' && <AlertTriangle className="w-3 h-3" />}
                      {shift.statusLabel}
                    </span>
                    <span className="text-on-surface-variant font-semibold">{shift.pctMeta}% Meta</span>
                    {shift.diffMin > 0 && (
                      <>
                        <span className="text-outline">&bull;</span>
                        <span className={shift.textColor}>+{shift.diffMin}m Excedente</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            RANKING CORPORATIVO DE MOTORISTAS &bull; MELHOR CICLO DE VIAGEM
            Reativo aos filtros ativos (período, dia, revenda, turno, frota)
            =================================================================== */}
        <div className="relative rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5 sm:p-6 shadow-sm flex flex-col gap-4 overflow-hidden">
          {/* Cabeçalho do Card Integrado com o Painel */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-on-surface tracking-tight">
                  Ranking de Motoristas &bull; Melhor Ciclo
                </h3>
              </div>
            </div>

            {/* Badge de Meta Ciclo */}
            <div className="flex items-center font-mono text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold">
                Meta: {activeMetas.cycleMeta}
              </span>
            </div>
          </div>

          {/* Lista Corporativa de Motoristas */}
          <div className="flex flex-col gap-2.5 max-h-[310px] overflow-y-auto pr-1">
            {driverRankingData.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-[12px] font-mono">
                Nenhum motorista registrado no período selecionado
              </div>
            ) : (
              driverRankingData.map((item, index) => {
                const rank = index + 1;
                let rankBadge = 'bg-surface-container-highest border-outline-variant/40 text-on-surface-variant';

                if (rank === 1) {
                  rankBadge = 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
                } else if (rank === 2) {
                  rankBadge = 'bg-slate-400/20 border-slate-400/40 text-slate-200';
                } else if (rank === 3) {
                  rankBadge = 'bg-amber-700/25 border-amber-700/40 text-amber-500';
                }

                return (
                  <div
                    key={item.driver}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/20 hover:border-outline-variant/40 transition-all duration-200"
                  >
                    {/* Posição e Nome do Motorista */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono font-black text-[12px] shrink-0 ${rankBadge}`}
                      >
                        {`${rank}º`}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-[13px] text-on-surface tracking-tight block truncate uppercase">
                          {item.driver}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant">
                          <span className={item.isWithinMeta ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                            {item.isWithinMeta ? 'Dentro da Meta' : 'Acima da Meta'}
                          </span>
                          <span>&bull;</span>
                          <span>{item.pctMeta}% Meta</span>
                          {item.bestCycleStr && (
                            <>
                              <span>&bull;</span>
                              <span className="text-secondary font-medium">Melhor: {item.bestCycleStr}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tempo de Ciclo Médio e Diferença da Meta */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span
                        className={`font-mono text-[14px] font-black tracking-tight ${
                          item.isWithinMeta ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {item.avgCycleStr}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant block">
                        {item.diffToMetaMin <= 0 ? (
                          <span className="text-emerald-400/90 font-medium">
                            {item.diffToMetaMin === 0 ? 'No alvo' : `${Math.abs(item.diffToMetaMin)}m abaixo`}
                          </span>
                        ) : (
                          <span className="text-red-400/90 font-medium">
                            +{item.diffToMetaMin}m acima
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
