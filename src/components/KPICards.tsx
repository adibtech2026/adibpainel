import React from 'react';
import { KPIStats } from '../types';
import {
  Timer,
  Warehouse,
  Truck,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Navigation
} from 'lucide-react';
import { parseTimeToMinutes } from '../services/googleSheets';

interface KPICardsProps {
  kpis: KPIStats;
  onCardClick?: (kpiName: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, onCardClick }) => {
  // Dynamically calculate percentages
  const cycleMin = parseTimeToMinutes(kpis.averageCycle) || 972;
  const cycleMetaMin = parseTimeToMinutes(kpis.cycleMeta) || 960;
  const cyclePercent = ((cycleMin / cycleMetaMin) * 100).toFixed(1);

  const tmaMin = parseTimeToMinutes(kpis.tmaAverage) || 204;
  const tmaMetaMin = parseTimeToMinutes(kpis.tmaMeta) || 210;
  const tmaPercent = ((tmaMin / tmaMetaMin) * 100).toFixed(1);

  const tmvMin = parseTimeToMinutes(kpis.tmvAverage) || 728;
  const tmvMetaMin = parseTimeToMinutes(kpis.tmvMeta) || 660;
  const tmvPercent = ((tmvMin / tmvMetaMin) * 100).toFixed(1);

  const trMin = parseTimeToMinutes(kpis.trAverage) || 168;
  const trMetaMin = parseTimeToMinutes(kpis.trMeta) || 120;
  const trPercent = ((trMin / trMetaMin) * 100).toFixed(1);
  const isTrCritical = trMin > trMetaMin;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
      {/* ===================================================================
          Card 0: Total de Viagens (Centralizado, Rico, Visual Executivo)
          =================================================================== */}
      <div
        id="kpi-card-total-viagens"
        onClick={() => onCardClick && onCardClick('total-viagens')}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-surface-container-low to-surface-container/70 border border-outline-variant/30 flex flex-col justify-between shadow-md hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-80"></div>
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-[13px] text-on-surface tracking-tight">
                Total de Viagens
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-[10px] font-mono font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Ativas
            </span>
          </div>

          {/* Número Centralizado em Destaque */}
          <div className="flex flex-col items-center justify-center my-3 py-1">
            <span className="font-mono text-[36px] sm:text-[38px] font-black text-on-surface tracking-tight group-hover:text-primary transition-colors drop-shadow-sm leading-none">
              {kpis.totalTrips}
            </span>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/25 text-secondary text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Monitoradas</span>
            </div>
          </div>

          {/* Barra de Progresso com Glow */}
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-outline-variant/15">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-secondary transition-all duration-700 w-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            </div>
          </div>
        </div>

        {/* Rodapé Alinhado */}
        <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant text-[11px]">
          <span className="font-mono text-secondary font-semibold">Viagens Concluídas</span>
          <span className="font-mono text-[10px] text-outline font-medium">CDR Ambev</span>
        </div>
      </div>

      {/* ===================================================================
          Card 1: Ciclo Médio Total
          =================================================================== */}
      <div
        id="kpi-card-ciclo"
        onClick={() => onCardClick && onCardClick('ciclo')}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-surface-container-low to-surface-container/70 border border-outline-variant/30 flex flex-col justify-between shadow-md hover:border-tertiary/60 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary/70"></div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-tertiary/10 border border-tertiary/25 flex items-center justify-center text-tertiary shrink-0 shadow-xs">
                <Timer className="w-4 h-4 text-tertiary" />
              </div>
              <span className="font-bold text-[13px] text-on-surface tracking-tight">
                Ciclo Médio Total
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary/15 border border-tertiary/30 text-tertiary text-[10px] font-mono font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              Tolerância
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-2">
            <span className="font-mono text-[28px] text-on-surface tracking-tight font-extrabold group-hover:text-tertiary transition-colors">
              {kpis.averageCycle}
            </span>
            <div className="flex flex-col items-end font-mono text-[11px]">
              <span className="text-on-surface-variant">
                Meta: <strong className="text-on-surface font-semibold">{kpis.cycleMeta}</strong>
              </span>
              <span className="text-tertiary font-bold">{kpis.cycleDev}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-outline-variant/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-tertiary transition-all duration-700 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                style={{ width: `${Math.min(100, Math.max(10, Number(cyclePercent) * 0.9))}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-tertiary font-bold">{kpis.slaAdherence}</span>
            <span>Aderência SLA</span>
          </div>
          <span className="font-mono text-[10px] text-outline font-medium">{cyclePercent}% Meta</span>
        </div>
      </div>

      {/* ===================================================================
          Card 2: TMA - Carga na Unidade CDR
          =================================================================== */}
      <div
        id="kpi-card-tma"
        onClick={() => onCardClick && onCardClick('tma')}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-surface-container-low to-surface-container/70 border border-outline-variant/30 flex flex-col justify-between shadow-md hover:border-secondary/60 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/80"></div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-secondary/10 border border-secondary/25 flex items-center justify-center text-secondary shrink-0 shadow-xs">
                <Warehouse className="w-4 h-4 text-secondary" />
              </div>
              <span className="font-bold text-[13px] text-on-surface tracking-tight">
                TMA Médio
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-[10px] font-mono font-bold shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-secondary" />
              Conforme
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-2">
            <span className="font-mono text-[28px] text-secondary tracking-tight font-extrabold group-hover:brightness-110 transition-all">
              {kpis.tmaAverage}
            </span>
            <div className="flex flex-col items-end font-mono text-[11px]">
              <span className="text-on-surface-variant">
                Meta: <strong className="text-on-surface font-semibold">{kpis.tmaMeta}</strong>
              </span>
              <span className="text-secondary font-bold">{kpis.tmaDev}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-outline-variant/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-secondary transition-all duration-700 shadow-[0_0_8px_rgba(34,197,94,0.35)]"
                style={{ width: `${Math.min(100, Number(tmaPercent))}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant text-[11px]">
          <div className="flex items-center gap-1 text-secondary">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="font-mono font-bold">SLA Atingido</span>
          </div>
          <span className="font-mono text-[10px] text-secondary font-bold">{tmaPercent}% Meta</span>
        </div>
      </div>

      {/* ===================================================================
          Card 3: TMV - Trânsito Total (Ida + Volta)
          =================================================================== */}
      <div
        id="kpi-card-tmv"
        onClick={() => onCardClick && onCardClick('tmv')}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-surface-container-low to-surface-container/70 border border-outline-variant/30 flex flex-col justify-between shadow-md hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/80"></div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Navigation className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-[13px] text-on-surface tracking-tight">
                TMV &bull; Trânsito
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-mono font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Em Rota
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-2">
            <span className="font-mono text-[28px] text-on-surface tracking-tight font-extrabold group-hover:text-primary transition-colors">
              {kpis.tmvAverage}
            </span>
            <div className="flex flex-col items-end font-mono text-[11px]">
              <span className="text-on-surface-variant">
                Meta: <strong className="text-on-surface font-semibold">{kpis.tmvMeta}</strong>
              </span>
              <span className="text-tertiary font-bold">{kpis.tmvDev}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-outline-variant/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-primary transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.35)]"
                style={{ width: `${Math.min(100, Number(tmvPercent) * 0.9)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant text-[11px]">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-on-surface font-medium">Ida: {kpis.tmvOutboundAvg}</span>
            <span className="text-outline">&bull;</span>
            <span className="text-on-surface font-medium">Volta: {kpis.tmvInboundAvg}</span>
          </div>
          <span className="font-mono text-[10px] text-outline font-medium">{tmvPercent}% Meta</span>
        </div>
      </div>

      {/* ===================================================================
          Card 4: TR - Tempo na Revenda
          =================================================================== */}
      <div
        id="kpi-card-tr"
        onClick={() => onCardClick && onCardClick('tr')}
        className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-surface-container-low to-surface-container/70 flex flex-col justify-between shadow-md transition-all cursor-pointer group relative overflow-hidden ${
          isTrCritical
            ? 'border border-error/50 hover:border-error hover:shadow-[0_4px_20px_rgba(239,68,68,0.18)]'
            : 'border border-outline-variant/30 hover:border-primary/60 hover:shadow-xl'
        }`}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 ${isTrCritical ? 'bg-error animate-pulse' : 'bg-secondary'}`}></div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isTrCritical
                    ? 'bg-error/15 border border-error/30 text-error'
                    : 'bg-primary/10 border border-primary/25 text-primary'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-error" />
              </div>
              <span
                className={`font-bold text-[13px] tracking-tight ${
                  isTrCritical ? 'text-error' : 'text-on-surface'
                }`}
              >
                TR &bull; Tempo na Revenda
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold shadow-xs ${
                isTrCritical
                  ? 'bg-error/20 border-error/40 text-error animate-pulse'
                  : 'bg-secondary/15 border-secondary/30 text-secondary'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isTrCritical ? 'bg-error' : 'bg-secondary'}`}
              ></span>
              {isTrCritical ? 'Gargalo Crítico' : 'Normal'}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1 my-2">
            <span
              className={`font-mono text-[28px] tracking-tight font-extrabold transition-colors ${
                isTrCritical ? 'text-error' : 'text-on-surface'
              }`}
            >
              {kpis.trAverage}
            </span>
            <div className="flex flex-col items-end font-mono text-[11px]">
              <span className="text-on-surface-variant">
                Meta: <strong className="text-on-surface font-semibold">{kpis.trMeta}</strong>
              </span>
              <span className={isTrCritical ? 'text-error font-bold' : 'text-secondary'}>
                {kpis.trDev}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-outline-variant/15">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isTrCritical
                    ? 'bg-gradient-to-r from-red-500 to-error shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                    : 'bg-gradient-to-r from-emerald-400 to-secondary'
                }`}
                style={{ width: `${Math.min(100, Number(trPercent))}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant text-[11px]">
          <span className="font-mono text-error font-bold">Estouro na Revenda</span>
          <span className="font-mono text-[10px] text-error font-bold">{trPercent}% Meta</span>
        </div>
      </div>
    </section>
  );
};
