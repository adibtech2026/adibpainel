import React from 'react';
import {
  BarChart3,
  Settings,
  ChevronLeft,
  Radar
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenConfigMetas?: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  activeTab,
  setActiveTab
}) => {
  return (
    <aside
      id="main-sidebar"
      className={`min-h-screen bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col shrink-0 sticky top-0 h-screen z-50 justify-between shadow-[2px_0_12px_rgba(0,0,0,0.35)] select-none relative group transition-all duration-300 ${
        isCollapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Floating Collapse/Expand Toggle Tab on Border */}
      <button
        id="sidebar-toggle-btn"
        aria-label="Alternar Barra Lateral"
        onClick={onToggle}
        className="absolute -right-3.5 top-5 w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 text-on-surface hover:text-primary flex items-center justify-center shadow-lg transition-all z-50 focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
        title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
      >
        <ChevronLeft
          className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </button>

      <div className="flex flex-col overflow-hidden">
        {/* Brand Header */}
        <div
          id="sidebar-brand"
          className={`h-16 px-3.5 border-b border-outline-variant/20 flex items-center gap-3 overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-high text-primary border border-primary/30 shadow-sm shrink-0 cursor-pointer"
            onClick={onToggle}
            title="LogAudit"
          >
            <Radar className="w-5 h-5 text-primary" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-200">
              <span className="text-[14px] text-on-surface font-bold tracking-tight leading-none">
                LogSLA Pro
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="p-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {/* Active Item: Painel Analítico */}
          <button
            onClick={() => setActiveTab('analitico')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-[13px] transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'analitico'
                ? 'bg-surface-container-high text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
            title="Painel Analítico"
          >
            <BarChart3 className="w-4 h-4 text-primary shrink-0" />
            {!isCollapsed && (
              <span className="flex-1 text-left whitespace-nowrap overflow-hidden truncate">
                Painel Analítico
              </span>
            )}
          </button>

          {/* Item: Configurações (contendo Google Sheets e Configurar Metas) */}
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-[13px] transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'configuracoes'
                ? 'bg-surface-container-high text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
            title="Configurações (Google Sheets & Metas)"
          >
            <Settings className="w-4 h-4 shrink-0 text-on-surface-variant" />
            {!isCollapsed && (
              <span className="flex-1 text-left whitespace-nowrap overflow-hidden truncate">
                Configurações
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Footer Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-outline-variant/20 flex flex-col gap-1 text-[11px] text-on-surface-variant">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span>TELEMETRIA</span>
            <span className="flex items-center gap-1 text-secondary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              ONLINE
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
