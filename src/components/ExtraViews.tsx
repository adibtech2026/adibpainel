import React from 'react';
import { KPIStats } from '../types';

interface ViewProps {
  kpis: KPIStats;
  onOpenParecer: () => void;
  onOpenConfigMetas: () => void;
  onExportXLSX: () => void;
}

export const ExecutiveView: React.FC<ViewProps> = ({ kpis, onOpenParecer, onExportXLSX }) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Executive Highlight Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high border border-primary/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[11px] font-semibold mb-2 font-label-caps">
              VISÃO EXECUTIVA &bull; TRIMESTRE Q2/2026
            </span>
            <h2 className="text-[22px] font-bold text-on-surface">
              Sumário Executivo de SLA &amp; Proteção de Penalidades
            </h2>
            <p className="text-[13px] text-on-surface-variant max-w-2xl mt-1">
              Consolidação de {kpis.totalTrips} viagens entre o CDR Ambev e as Revendas de destino.
              A transportadora atingiu <strong className="text-secondary">{kpis.slaAdherence}</strong> de aderência,
              com 100% dos desvios restantes comprovados como retenção externa de doca.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenParecer}
              className="px-4 py-2 rounded-xl bg-primary text-[#00354a] font-bold text-[13px] hover:bg-primary-fixed-dim transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>Emitir Parecer Jurídico</span>
            </button>
            <button
              onClick={onExportXLSX}
              className="px-4 py-2 rounded-xl bg-surface-container-highest text-on-surface border border-outline-variant/40 font-medium text-[13px] hover:bg-surface-variant transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Exportar Dados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Key Figures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-[12px] mb-2 font-label-caps">
            <span>MULTAS EVITADAS (DEFESA DE SLA)</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
          </div>
          <span className="font-metric-display text-[26px] font-bold text-secondary">
            R$ 48.500,00
          </span>
          <p className="text-[11px] text-on-surface-variant mt-2">
            Valor de glosa contratual contestado e revertido com base na prova de geofencing.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-[12px] mb-2 font-label-caps">
            <span>EFICIÊNCIA INTERNA (BASE CDR)</span>
            <span className="material-symbols-outlined text-primary text-[20px]">warehouse</span>
          </div>
          <span className="font-metric-display text-[26px] font-bold text-primary">
            97.1%
          </span>
          <p className="text-[11px] text-on-surface-variant mt-2">
            TMA médio de {kpis.tmaAverage} antecipando a meta homologada em 6 minutos por ciclo.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-[12px] mb-2 font-label-caps">
            <span>TEMPO RETIDO EM DOCA EXTERNA</span>
            <span className="material-symbols-outlined text-error text-[20px]">farthest_point</span>
          </div>
          <span className="font-metric-display text-[26px] font-bold text-error">
            +05h 18m
          </span>
          <p className="text-[11px] text-on-surface-variant mt-2">
            Média de retenção de terceiros no Turno 3 nas Revendas destino por carência de conferentes.
          </p>
        </div>
      </div>
    </div>
  );
};

export const IndicatorsView: React.FC<ViewProps> = ({ kpis, onOpenConfigMetas }) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold text-on-surface">
            Matriz de Indicadores de SLA &amp; Parâmetros Homologados
          </h2>
          <p className="text-[12px] text-on-surface-variant">
            Metas contratuais ativas estabelecidas com o embarcador CDR Ambev.
          </p>
        </div>
        <button
          onClick={onOpenConfigMetas}
          className="px-3.5 py-1.5 rounded-lg bg-primary text-[#00354a] font-semibold text-[12px] hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          <span>Ajustar Metas</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Indicator 1 */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-on-surface text-[14px]">
              Ciclo Total Porta a Porta
            </span>
            <span className="px-2 py-0.5 rounded bg-surface text-tertiary text-[11px] font-metric-table font-semibold">
              Tolerância Meta
            </span>
          </div>
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between text-on-surface-variant">
              <span>Meta Contratual Homologada:</span>
              <span className="font-metric-table text-on-surface font-semibold">{kpis.cycleMeta}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Média Real Auditada:</span>
              <span className="font-metric-table text-tertiary font-semibold">{kpis.averageCycle}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Janela de Tolerância Aceita:</span>
              <span className="font-metric-table text-outline font-semibold">&plusmn; 30 minutos</span>
            </div>
          </div>
        </div>

        {/* Indicator 2 */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-on-surface text-[14px]">
              TMA &bull; Carga e Faturamento na Unidade
            </span>
            <span className="px-2 py-0.5 rounded bg-surface text-secondary text-[11px] font-metric-table font-semibold">
              Meta Superada
            </span>
          </div>
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between text-on-surface-variant">
              <span>Meta de Permanência CDR:</span>
              <span className="font-metric-table text-on-surface font-semibold">{kpis.tmaMeta}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Média Real Auditada:</span>
              <span className="font-metric-table text-secondary font-semibold">{kpis.tmaAverage}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Desempenho:</span>
              <span className="font-metric-table text-secondary font-semibold">{kpis.tmaDev}</span>
            </div>
          </div>
        </div>

        {/* Indicator 3 */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-on-surface text-[14px]">
              TMV &bull; Tempo de Trânsito Rodoviário
            </span>
            <span className="px-2 py-0.5 rounded bg-surface text-primary text-[11px] font-metric-table font-semibold">
              Meta Homologada
            </span>
          </div>
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between text-on-surface-variant">
              <span>Meta Rota Ida + Volta:</span>
              <span className="font-metric-table text-on-surface font-semibold">{kpis.tmvMeta}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Média Real Auditada:</span>
              <span className="font-metric-table text-on-surface font-semibold">{kpis.tmvAverage}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Aferição:</span>
              <span className="font-metric-table text-primary font-semibold">Telemetria GPS Satelital</span>
            </div>
          </div>
        </div>

        {/* Indicator 4 */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-error/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-error text-[14px]">
              TR &bull; Tempo na Revenda (Doca / Descarga)
            </span>
            <span className="px-2 py-0.5 rounded bg-error-container/20 text-error text-[11px] font-metric-table font-semibold">
              Meta Estourada (Ofensor Externo)
            </span>
          </div>
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between text-on-surface-variant">
              <span>Meta Homologada de Descarga:</span>
              <span className="font-metric-table text-on-surface font-semibold">{kpis.trMeta}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Média Real nas Revendas:</span>
              <span className="font-metric-table text-error font-semibold">{kpis.trAverage}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Desvio nas Revendas:</span>
              <span className="font-metric-table text-error font-semibold">{kpis.trDev}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReportsView: React.FC<ViewProps> = ({ onOpenParecer, onExportXLSX }) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-on-surface">
            Relatórios &amp; Evidências Telemétricas
          </h2>
          <p className="text-[12px] text-on-surface-variant">
            Dossiês certificados para contestação de SLA e controle operacional.
          </p>
        </div>
        <button
          onClick={onOpenParecer}
          className="px-4 py-1.5 rounded-lg bg-primary text-[#00354a] font-semibold text-[12px] hover:bg-primary-fixed-dim transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">gavel</span>
          <span>Emitir Parecer Completo</span>
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[24px]">
              task_alt
            </span>
            <div>
              <h4 className="text-[14px] font-semibold text-on-surface">
                Dossiê Consolidado de Telemetria (Maio - Julho/2026)
              </h4>
              <span className="text-[11px] text-on-surface-variant">
                38 viagens com cerca virtual, horários de chegada e liberação de canhoto.
              </span>
            </div>
          </div>
          <button
            onClick={onExportXLSX}
            className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-[12px] border border-outline-variant/30 flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Baixar XLSX</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">
              warning
            </span>
            <div>
              <h4 className="text-[14px] font-semibold text-on-surface">
                Relatório de Excedentes de Pátio - Revendas Destino (Turno 3)
              </h4>
              <span className="text-[11px] text-on-surface-variant">
                Evidência das viagens dos motoristas Ramon Cristian e Jose Carlos retidos por mais de 5 horas.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenParecer}
            className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-[12px] border border-outline-variant/30 flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Visualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
