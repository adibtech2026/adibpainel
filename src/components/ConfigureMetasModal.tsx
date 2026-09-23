import React, { useState, useEffect } from 'react';
import { MetasConfigState, RevendaMetas } from '../types';

interface ConfigureMetasModalProps {
  isOpen: boolean;
  onClose: () => void;
  metasConfig: MetasConfigState;
  currentReseller?: string;
  availableResellers?: string[];
  onSaveMetas: (resellerKey: string, newMetas: RevendaMetas) => void;
}

export const ConfigureMetasModal: React.FC<ConfigureMetasModalProps> = ({
  isOpen,
  onClose,
  metasConfig,
  currentReseller = 'Todas',
  availableResellers = [],
  onSaveMetas
}) => {
  const resellerTabs = React.useMemo(() => {
    const list = availableResellers && availableResellers.length > 0
      ? [...availableResellers]
      : Object.keys(metasConfig).filter((k) => k !== 'Todas');
    return [...list, 'Todas'];
  }, [availableResellers, metasConfig]);

  const [selectedReseller, setSelectedReseller] = useState<string>(() => {
    if (currentReseller && currentReseller !== 'Todas' && currentReseller !== 'Todas as Revendas') {
      return currentReseller;
    }
    return availableResellers.length > 0 ? availableResellers[0] : 'Todas';
  });

  const activeMetas = metasConfig[selectedReseller] || metasConfig['Todas'] || {
    cycleMeta: '16h 00m',
    tmaMeta: '03h 30m',
    tmvMeta: '11h 00m',
    trMeta: '02h 00m'
  };

  const [cycleMeta, setCycleMeta] = useState(activeMetas.cycleMeta);
  const [tmaMeta, setTmaMeta] = useState(activeMetas.tmaMeta);
  const [tmvMeta, setTmvMeta] = useState(activeMetas.tmvMeta);
  const [trMeta, setTrMeta] = useState(activeMetas.trMeta);
  const [tolerance, setTolerance] = useState('30m');

  // When tab/reseller changes, sync fields
  useEffect(() => {
    const m = metasConfig[selectedReseller] || metasConfig['Todas'];
    if (m) {
      setCycleMeta(m.cycleMeta);
      setTmaMeta(m.tmaMeta);
      setTmvMeta(m.tmvMeta);
      setTrMeta(m.trMeta);
    }
  }, [selectedReseller, metasConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMetas(selectedReseller, { cycleMeta, tmaMeta, tmvMeta, trMeta });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px]">
              tune
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-on-surface">
                Configurar Metas de SLA por Revenda
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Metas e parâmetros operacionais individualizados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-surface hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">close</span>
          </button>
        </div>

        {/* Reseller Tabs */}
        <div className="px-5 pt-3 pb-1 bg-surface-container-low border-b border-outline-variant/20 flex flex-wrap gap-2">
          {resellerTabs.map((resKey) => {
            const isSelected = selectedReseller === resKey;
            const label = resKey === 'Todas' ? 'Geral (Consolidado)' : resKey;
            return (
              <button
                key={resKey}
                type="button"
                onClick={() => setSelectedReseller(resKey)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-[#00354a] shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-on-surface text-[13px]">
          <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/30 text-[11px] text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">
              info
            </span>
            <span>
              Configurando metas exclusivas para:{' '}
              <strong className="text-on-surface">
                {selectedReseller === 'Todas' ? 'Todas as Revendas (Consolidado)' : selectedReseller}
              </strong>
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-label-caps text-on-surface-variant uppercase mb-1">
              Meta de Ciclo Médio Total (Base &rarr; Revenda &rarr; Base)
            </label>
            <input
              type="text"
              value={cycleMeta}
              onChange={(e) => setCycleMeta(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-metric-table text-[13px] focus:outline-none focus:border-primary"
              placeholder="Ex: 16h 00m"
            />
          </div>

          <div>
            <label className="block text-[11px] font-label-caps text-on-surface-variant uppercase mb-1">
              Meta TMA (Tempo de Carga no CDR Ambev)
            </label>
            <input
              type="text"
              value={tmaMeta}
              onChange={(e) => setTmaMeta(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-metric-table text-[13px] focus:outline-none focus:border-primary"
              placeholder="Ex: 03h 30m"
            />
          </div>

          <div>
            <label className="block text-[11px] font-label-caps text-on-surface-variant uppercase mb-1">
              Meta TMV (Trânsito Total Ida + Volta)
            </label>
            <input
              type="text"
              value={tmvMeta}
              onChange={(e) => setTmvMeta(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-metric-table text-[13px] focus:outline-none focus:border-primary"
              placeholder="Ex: 11h 00m"
            />
          </div>

          <div>
            <label className="block text-[11px] font-label-caps text-on-surface-variant uppercase mb-1">
              Meta TR (Tempo de Retenção / Descarga na Revenda)
            </label>
            <input
              type="text"
              value={trMeta}
              onChange={(e) => setTrMeta(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-metric-table text-[13px] focus:outline-none focus:border-primary"
              placeholder="Ex: 02h 00m"
            />
          </div>

          <div>
            <label className="block text-[11px] font-label-caps text-on-surface-variant uppercase mb-1">
              Margem de Tolerância Contratual (&plusmn;)
            </label>
            <input
              type="text"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-metric-table text-[13px] focus:outline-none focus:border-primary"
              placeholder="Ex: 30m"
            />
          </div>

          <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-on-surface text-[12px] hover:bg-surface-variant transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-primary text-[#00354a] font-semibold text-[12px] hover:bg-primary-fixed-dim transition-colors cursor-pointer"
            >
              Salvar Metas de {selectedReseller === 'Todas' ? 'Consolidado' : selectedReseller}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
