import React, { useState } from 'react';
import { KPIStats } from '../types';

interface ParecerTecnicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: KPIStats;
  currentReseller?: string;
}

export const ParecerTecnicoModal: React.FC<ParecerTecnicoModalProps> = ({
  isOpen,
  onClose,
  kpis,
  currentReseller
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const resellerLabel =
    currentReseller && currentReseller !== 'Todas' && currentReseller !== 'Todas as Revendas'
      ? currentReseller
      : 'Todas as Revendas (Operação Geral)';

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `PARECER TÉCNICO OPERACIONAL & DEFESA DE SLA
Emissor: LogSLA Pro Telemetria Operacional
Contrato de Transporte: CDR Ambev - Unidade Operacional
Destino / Revenda: ${resellerLabel}
Período de Referência: Maio a Julho / 2026
Amostra Analisada: ${kpis.totalTrips} Viagens Homologadas por Telemetria Satelital

1. RESUMO EXECUTIVO DOS INDICADORES:
- Ciclo Médio Total Observado: ${kpis.averageCycle} (Meta: ${kpis.cycleMeta})
- Aderência Geral de SLA: ${kpis.slaAdherence}
- TMA (Tempo Médio de Atendimento em Base CDR): ${kpis.tmaAverage} (Meta: ${kpis.tmaMeta} - CONFORME, 6min de superação)
- TMV (Tempo de Rodagem em Trânsito): ${kpis.tmvAverage} (Meta: ${kpis.tmvMeta} - Faixa de tolerância rodoviária)
- TR (Tempo Médio na Revenda): ${kpis.trAverage} (Meta: ${kpis.trMeta} - DESVIO CRÍTICO DE +48min / +40%)

2. IDENTIFICAÇÃO DO GARGALO & NEXO CAUSAL:
A análise operacional constatou que o desvio pontual do ciclo total decorre estritamente do excesso de retenção na portaria e docas de descarga (${resellerLabel}), com concentração crítica no Turno 3 (Madrugada), onde o TR atingiu média de 05h 18m. Registrou-se ausência sistemática de conferentes e portaria inoperante no intervalo das 00h às 05h.

3. CONCLUSÃO & RECOMENDAÇÃO JURÍDICO-OPERACIONAL:
Configurado Fato de Terceiro / Fato da Contratante (Cláusula 14.2 do Contrato Padrão Logístico Ambev). Recomenda-se a desoneração de penalidades para a transportadora e a revisão da janela de agendamento noturno da revenda.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0e1628] rounded-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">
              gavel
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-on-surface">
                Parecer Técnico Operacional &amp; Defesa de SLA
              </h2>
              <span className="text-[11px] text-on-surface-variant">
                Documento Oficial de Contestação Operacional &bull; Ambev / ADIB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded bg-surface border border-outline-variant/30 text-on-surface text-[11px] hover:border-primary/50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 rounded bg-surface border border-outline-variant/30 text-on-surface text-[11px] hover:border-primary/50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded bg-surface hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">close</span>
            </button>
          </div>
        </div>

        {/* Formal Document Preview Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-on-surface text-[13px] leading-relaxed bg-[#0b1326]">
          {/* Document Header */}
          <div className="border-b border-outline-variant/30 pb-4 flex justify-between items-start">
            <div>
              <span className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider block">
                LAUDO TÉCNICO DE TELEMETRIA Nº 2026/08-REV
              </span>
              <h1 className="text-[18px] font-bold text-on-surface mt-1">
                Relatório Pericial de Ciclo de Viagens &amp; Apuração de Responsabilidade
              </h1>
              <p className="text-[12px] text-on-surface-variant mt-0.5">
                Emissão: 18 de Setembro de 2026 &bull; Departamento de Operações e SLA Logístico
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-secondary/15 border border-secondary/40 text-secondary font-label-caps text-[10px] font-bold">
                LAUDO HOMOLOGADO
              </span>
            </div>
          </div>

          {/* Table of Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 font-metric-table text-[11px]">
            <div>
              <span className="text-on-surface-variant block text-[10px]">ORIGEM:</span>
              <strong className="text-on-surface">CDR Ambev</strong>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">DESTINATÁRIO:</span>
              <strong className="text-primary">{resellerLabel}</strong>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">AMOSTRA:</span>
              <strong className="text-on-surface">{kpis.totalTrips} Viagens</strong>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">CONFORMIDADE:</span>
              <strong className="text-secondary">{kpis.complianceRatio}</strong>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              1. Do Desempenho Operacional da Transportadora na Base (CDR Ambev)
            </h3>
            <p className="text-[12px] text-on-surface-variant">
              A transportadora operou com <strong>excelência técnica comprovada</strong> no Tempo Médio
              de Atendimento (TMA) dentro das dependências do CDR Ambev, registrando uma média de{' '}
              <strong className="text-secondary">{kpis.tmaAverage}</strong>, contra a meta homologada
              de <strong>{kpis.tmaMeta}</strong>. Isso representa uma antecipação média favorável de 6
              minutos ({kpis.tmaDev}), comprovando conformidade integral de 100% das partidas sob sua
              gestão direta.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              2. Da Apuração de Retenção Externa (Fato do Destinatário)
            </h3>
            <p className="text-[12px] text-on-surface-variant">
              Em contraste direto com o desempenho de base, os registros telemétricos via GPS e cerca
              eletrônica (geofence) demonstram que as viagens com ciclo excedido (notadamente as
              viagens de <strong>Ramon Cristian</strong> e <strong>Jose Carlos</strong>) sofreram retenções
              severas no pátio externo e docas de descarga das revendas (<strong>{resellerLabel}</strong>).
            </p>
            <div className="p-3 rounded-lg bg-surface-container border border-error/30 text-[12px]">
              <div className="flex items-center gap-2 text-error font-semibold mb-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>Gargalo Crítico no Turno 3 (00h às 05h)</span>
              </div>
              <p className="text-on-surface-variant text-[11px]">
                Tempo Médio de Retenção no Turno 3:{' '}
                <strong className="text-error font-metric-table text-[12px]">05h 18m</strong>{' '}
                (Meta de descarga: 02h 00m &bull; Desvio de +03h 18m). A portaria física da revenda
                esteve inoperante durante o período noturno sem equipe de conferentes para recebimento,
                gerando fila na via pública de acesso.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-[14px] font-bold text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              3. Conclusão Pericial &amp; Desoneração de Responsabilidade
            </h3>
            <p className="text-[12px] text-on-surface-variant">
              Diante das evidências irrefutáveis de telemetria satelital e registros eletrônicos de
              passagem de cerca virtual, resta plenamente caracterizada a hipótese de{' '}
              <strong>Fato de Terceiro / Fato da Contratante</strong> (conforme Cláusula 14.2 do
              Contrato de Prestação de Serviços Logísticos), afastando qualquer culpa ou mora por parte
              da transportadora no cumprimento do SLA contratual de 16 horas.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-outline-variant/30 grid grid-cols-2 gap-6 text-center text-[11px] text-on-surface-variant font-label-caps">
            <div className="border-t border-outline-variant/50 pt-2">
              <span className="block font-bold text-on-surface">Coordenação de Operações &amp; SLA</span>
              <span>LogSLA Pro Telemetria Operacional</span>
            </div>
            <div className="border-t border-outline-variant/50 pt-2">
              <span className="block font-bold text-on-surface">Gestão de Tráfego e Logística</span>
              <span>Operações CDR Ambev / ADIB</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-high border-t border-outline-variant/30 flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant font-label-caps">
            CERTIFICADO DE AUTENTICIDADE TELEMÉTRICA Nº LA-2026-981
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-[#00354a] font-semibold text-[12px] hover:bg-primary-fixed-dim transition-colors cursor-pointer"
          >
            Fechar Parecer
          </button>
        </div>
      </div>
    </div>
  );
};
