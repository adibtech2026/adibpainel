import React from 'react';
import { TripRecord } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Wrench,
  ShieldCheck
} from 'lucide-react';

interface TripDetailsModalProps {
  trip: TripRecord | null;
  onClose: () => void;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({ trip, onClose }) => {
  if (!trip) return null;

  const isExceeded = trip.category === 'EXCEDENTE_REVENDA';
  const isOficina = trip.category === 'OFICINA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[18px] shrink-0 ${
                isExceeded
                  ? 'bg-error/20 text-error border border-error/40'
                  : isOficina
                  ? 'bg-tertiary/20 text-tertiary border border-tertiary/40'
                  : 'bg-secondary/20 text-secondary border border-secondary/40'
              }`}
            >
              {isExceeded ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isOficina ? (
                <Wrench className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[16px] font-bold text-on-surface">
                  Detalhes da Viagem
                </h2>
                <span className="px-2 py-0.5 rounded bg-surface text-[11px] font-mono text-primary font-bold">
                  {trip.id}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-0.5">
                {trip.driver} &bull; {trip.plate} ({trip.fleetType}) &bull; {trip.date} ({trip.shift})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-on-surface text-[13px]">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[10px] font-mono text-on-surface-variant block uppercase font-semibold">
                Ciclo Total
              </span>
              <span
                className={`text-[16px] font-mono font-bold ${
                  isExceeded ? 'text-error' : isOficina ? 'text-tertiary' : 'text-on-surface'
                }`}
              >
                {trip.cycleTotal}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant/80 block mt-0.5">
                Meta: 16h 00m
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[10px] font-mono text-on-surface-variant block uppercase font-semibold">
                TMA
              </span>
              <span className="text-[16px] font-mono font-bold text-secondary">{trip.tmaCDR}</span>
              <span className="text-[10px] font-mono text-secondary block mt-0.5">
                {trip.tmaDiffMeta}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[10px] font-mono text-on-surface-variant block uppercase font-semibold">
                TMV (Ida / Volta)
              </span>
              <span className="text-[14px] font-mono font-bold text-primary block truncate">
                {trip.tmvOutbound} / {trip.tmvInbound}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant/80 block mt-0.5">
                Total: {trip.tmvTotal || '12h00'}
              </span>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                isExceeded
                  ? 'bg-error-container/15 border-error/40 text-error'
                  : 'bg-surface-container-low border-outline-variant/30 text-on-surface'
              }`}
            >
              <span className="text-[10px] font-mono block uppercase font-semibold">
                TR (Tempo na Revenda)
              </span>
              <span className="text-[16px] font-mono font-bold block">{trip.trRevenda}</span>
              <span className="text-[10px] font-mono block font-semibold mt-0.5">
                {trip.trDiffMeta}
              </span>
            </div>
          </div>

          {/* Dados do Google Sheets da Viagem */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[11px] font-mono text-primary uppercase font-bold tracking-wider block mb-2">
              Campos da Planilha Google Sheets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-on-surface-variant text-[10px] block">Unidade:</span>
                <span className="font-semibold text-on-surface">{trip.unidade || 'CDR'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Mês / Número:</span>
                <span className="font-semibold text-on-surface">
                  {trip.mes || 'MAI'} (Mês {trip.mesNum || '5'})
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Dia da Semana:</span>
                <span className="font-semibold text-on-surface">{trip.diaSemana || '—'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Parada:</span>
                <span className="font-semibold text-on-surface">{trip.stopReason || '—'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Tempo Carga:</span>
                <span className="font-semibold text-on-surface">{trip.tempoCarga || '00:00:00'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Fila:</span>
                <span className="font-semibold text-on-surface">{trip.fila || '0'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Revenda:</span>
                <span className="font-semibold text-primary truncate block" title={trip.revenda || trip.reseller}>
                  {trip.revenda || trip.reseller || '—'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[10px] block">Frota:</span>
                <span className="font-semibold text-on-surface">{trip.fleetType || 'FIXA'}</span>
              </div>
            </div>
          </div>

          {/* Parecer Técnico & Auditoria */}
          <div
            className={`p-4 rounded-xl border ${
              isExceeded
                ? 'bg-error-container/10 border-error/30'
                : isOficina
                ? 'bg-tertiary/10 border-tertiary/30'
                : 'bg-surface-container-low border-outline-variant/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck
                className={`w-4 h-4 ${
                  isExceeded ? 'text-error' : isOficina ? 'text-tertiary' : 'text-secondary'
                }`}
              />
              <span className="font-bold text-[13px]">
                {isExceeded
                  ? 'Parecer Operacional: Retenção na Revenda (Fato de Terceiro)'
                  : isOficina
                  ? 'Registro de Manutenção em Oficina Autorizada'
                  : 'Conformidade Operacional Atestada'}
              </span>
            </div>
            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              {trip.notes ||
                'Registro operacional e validação de conformidade de ciclo de transporte.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-high border-t border-outline-variant/30 flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant font-mono">
            REGISTRO OPERACIONAL &bull; AUDITORIA DE CICLO
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-[#00354a] font-semibold text-[12px] hover:bg-primary-fixed-dim transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
