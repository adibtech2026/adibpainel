import React from 'react';
import {
  Menu,
  FileDown,
  Download,
  Database,
  Layers
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onExportXLSX: () => void;
  onEmitirParecerPDF?: () => void;
  onExportRelatorio: () => void;
  onOpenGoogleSheets?: () => void;
  activeTabTitle?: string;
  sourceTitle?: string;
  tableMode?: 'audit' | 'sheets';
  onToggleTableMode?: () => void;
  totalTripsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onExportXLSX,
  onExportRelatorio,
  activeTabTitle = 'Painel Analítico',
  sourceTitle,
  tableMode,
  onToggleTableMode,
  totalTripsCount = 38
}) => {
  return (
    <header className="min-h-16 w-full bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-sm">
      {/* Title & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="header-menu-toggle"
          aria-label="Alternar Menu Lateral"
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus:outline-none cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-bold text-on-surface tracking-tight truncate">
              {activeTabTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Header Actions Toolbar */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {onToggleTableMode && (
          <button
            id="toggle-table-mode-btn"
            onClick={onToggleTableMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border shadow-sm cursor-pointer ${
              tableMode === 'sheets'
                ? 'bg-primary/15 text-primary border-primary/40'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border-outline-variant/30'
            }`}
            type="button"
            title="Alternar entre visualização operacional SLA e as 19 colunas do Google Sheets"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="font-semibold font-mono">
              {tableMode === 'sheets' ? 'Modo 19 Colunas Sheets' : 'Modo Painel SLA'}
            </span>
          </button>
        )}

        <button
          id="btn-export-xlsx"
          onClick={onExportXLSX}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium transition-all shadow-sm border border-outline-variant/30 cursor-pointer"
          type="button"
          title="Exportar base completa para Excel/CSV"
        >
          <FileDown className="w-4 h-4 text-secondary" />
          <span className="hidden md:inline">Exportar</span>
          <span>XLSX</span>
        </button>

        <button
          id="btn-export-relatorio"
          onClick={onExportRelatorio}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[12px] font-medium transition-all border border-outline-variant/30 cursor-pointer"
          type="button"
          title="Exportar relatório sintético executivo"
        >
          <Download className="w-4 h-4 text-primary" />
        </button>
      </div>
    </header>
  );
};
