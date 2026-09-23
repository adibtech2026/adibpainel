import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KPICards } from './components/KPICards';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TripsTable } from './components/TripsTable';
import { TripDetailsModal } from './components/TripDetailsModal';
import { ParecerTecnicoModal } from './components/ParecerTecnicoModal';
import { ConfigureMetasModal } from './components/ConfigureMetasModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ExecutiveView, IndicatorsView, ReportsView } from './components/ExtraViews';
import { TRIPS_DATA, INITIAL_KPIS } from './data/tripsData';
import { FilterState, KPIStats, TripRecord, TripCategory, MetasConfigState, RevendaMetas } from './types';
import { calculateKPIsFromTrips } from './services/googleSheets';

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('analitico');
  const [tripsData, setTripsData] = useState<TripRecord[]>(TRIPS_DATA);
  const [databaseSource, setDatabaseSource] = useState<string>(
    'Base de Dados (38 Viagens CDR Ambev)'
  );
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [isParecerOpen, setIsParecerOpen] = useState(false);
  const [isConfigMetasOpen, setIsConfigMetasOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [tableMode, setTableMode] = useState<'audit' | 'sheets'>('audit');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Metas separadas e independentes por Revenda (usando exatamente os nomes da base de dados)
  const [metasConfig, setMetasConfig] = useState<MetasConfigState>({
    'ADIB - MATRIZ': {
      cycleMeta: '16h 00m',
      tmaMeta: '03h 30m',
      tmvMeta: '11h 00m',
      trMeta: '02h 00m'
    },
    'ADIB - VERA CRUZ': {
      cycleMeta: '16h 00m',
      tmaMeta: '03h 30m',
      tmvMeta: '11h 00m',
      trMeta: '02h 00m'
    },
    'Todas': {
      cycleMeta: '16h 00m',
      tmaMeta: '03h 30m',
      tmvMeta: '11h 00m',
      trMeta: '02h 00m'
    }
  });

  const [filters, setFilters] = useState<FilterState>({
    origin: 'Todas',
    reseller: 'Todas',
    fleet: 'Todas',
    period: 'Todos',
    day: 'Todos',
    shift: 'Todos',
    search: '',
    categoryFilter: 'ALL'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      origin: 'Todas',
      reseller: 'Todas',
      fleet: 'Todas',
      period: 'Todos',
      day: 'Todos',
      shift: 'Todos',
      search: '',
      categoryFilter: 'ALL'
    });
    showToast('Filtros restaurados para o padrão.');
  };

  // Metas ativas para a revenda selecionada (ou consolidadas)
  const activeMetas = useMemo<RevendaMetas>(() => {
    if (filters.reseller && metasConfig[filters.reseller]) {
      return metasConfig[filters.reseller];
    }
    const matchingKey = Object.keys(metasConfig).find(
      (k) => k.toLowerCase() === (filters.reseller || '').toLowerCase()
    );
    if (matchingKey) return metasConfig[matchingKey];

    return (
      metasConfig['Todas'] || {
        cycleMeta: '16h 00m',
        tmaMeta: '03h 30m',
        tmvMeta: '11h 00m',
        trMeta: '02h 00m'
      }
    );
  }, [filters.reseller, metasConfig]);

  // 1. Lista dinâmica de meses presentes na base de dados
  const availableMonths = useMemo(() => {
    const monthNames: Record<string, string> = {
      'JAN': 'Janeiro (JAN)',
      'FEV': 'Fevereiro (FEV)',
      'MAR': 'Março (MAR)',
      'ABR': 'Abril (ABR)',
      'MAI': 'Maio (MAI)',
      'JUN': 'Junho (JUN)',
      'JUL': 'Julho (JUL)',
      'AGO': 'Agosto (AGO)',
      'SET': 'Setembro (SET)',
      'OUT': 'Outubro (OUT)',
      'NOV': 'Novembro (NOV)',
      'DEZ': 'Dezembro (DEZ)'
    };

    const map = new Map<string, number>();
    tripsData.forEach((t) => {
      let m = (t.mes || '').trim().toUpperCase();
      if (!m && t.date) {
        const parts = t.date.split('/');
        if (parts.length === 3) {
          const mNum = parseInt(parts[1], 10);
          const codes = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
          m = codes[mNum] || parts[1];
        }
      }
      if (m && m !== '—' && m !== '-') {
        map.set(m, (map.get(m) || 0) + 1);
      }
    });

    const monthOrder = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    return Array.from(map.entries())
      .map(([key, count]) => ({
        key,
        label: monthNames[key] || `Mês ${key}`,
        count
      }))
      .sort((a, b) => {
        const idxA = monthOrder.indexOf(a.key);
        const idxB = monthOrder.indexOf(b.key);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.key.localeCompare(b.key);
      });
  }, [tripsData]);

  // 2. Lista dinâmica de dias operacionais (ajustada pelo mês se selecionado)
  const availableDays = useMemo(() => {
    const relevantTrips =
      filters.period &&
      filters.period !== 'Todos' &&
      filters.period !== 'Todas' &&
      filters.period !== 'Todos os Meses'
        ? tripsData.filter((t) => (t.mes || '').trim().toUpperCase() === filters.period.trim().toUpperCase())
        : tripsData;

    const map = new Map<string, number>();
    relevantTrips.forEach((t) => {
      const d = (t.date || '').trim();
      if (d && d !== '—' && d !== '-') {
        map.set(d, (map.get(d) || 0) + 1);
      }
    });

    return Array.from(map.entries())
      .map(([date, count]) => ({
        date,
        label: date,
        count
      }))
      .sort((a, b) => {
        const parseD = (str: string) => {
          const parts = str.split('/');
          if (parts.length === 3) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
          }
          return 0;
        };
        return parseD(a.date) - parseD(b.date);
      });
  }, [tripsData, filters.period]);

  // 3. Revendas únicas presentes na base de dados (com contagem)
  const availableResellers = useMemo(() => {
    const map = new Map<string, number>();
    tripsData.forEach((trip) => {
      const r = (trip.revenda || trip.reseller || '').trim();
      if (r && r !== '—' && r !== '-' && r !== 'REVENDA GERAL') {
        map.set(r, (map.get(r) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tripsData]);

  // 4. Turnos únicos presentes na base de dados (com contagem)
  const availableShifts = useMemo(() => {
    const map = new Map<string, number>();
    tripsData.forEach((trip) => {
      const s = (trip.shift || '').trim();
      if (s && s !== '—' && s !== '-') {
        map.set(s, (map.get(s) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tripsData]);

  // 5. Unidades / Origens únicas presentes na base de dados (com contagem)
  const availableOrigins = useMemo(() => {
    const map = new Map<string, number>();
    tripsData.forEach((trip) => {
      const u = (trip.unidade || trip.origin || '').trim();
      if (u && u !== '—' && u !== '-') {
        map.set(u, (map.get(u) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tripsData]);

  // 6. Frotas únicas presentes na base de dados (com contagem)
  const availableFleets = useMemo(() => {
    const map = new Map<string, number>();
    tripsData.forEach((trip) => {
      const f = (trip.fleetType || '').trim();
      if (f && f !== '—' && f !== '-') {
        map.set(f, (map.get(f) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tripsData]);

  // Lista de viagens filtrada estritamente com base nos filtros ativos
  const filteredTrips = useMemo(() => {
    return tripsData.filter((trip) => {
      // Filtro 1: Mês
      if (
        filters.period &&
        filters.period !== 'Todos' &&
        filters.period !== 'Todas' &&
        filters.period !== 'Todos os Meses'
      ) {
        const tripMonth = (trip.mes || '').trim().toUpperCase();
        const filterPeriod = filters.period.trim().toUpperCase();
        if (tripMonth !== filterPeriod) return false;
      }

      // Filtro 2: Dia
      if (filters.day && filters.day !== 'Todos' && filters.day !== 'Todas' && filters.day !== 'Todos os Dias') {
        const tripDate = (trip.date || '').trim();
        if (tripDate !== filters.day.trim()) return false;
      }

      // Filtro 3: Revenda
      if (
        filters.reseller &&
        filters.reseller !== 'Todas' &&
        filters.reseller !== 'Todos' &&
        filters.reseller !== 'Todas as Revendas' &&
        filters.reseller !== 'Todas as Revendas (Consolidado)'
      ) {
        const tripRevenda = (trip.revenda || trip.reseller || '').trim().toUpperCase();
        const selectedRevenda = filters.reseller.trim().toUpperCase();
        if (tripRevenda !== selectedRevenda && !tripRevenda.includes(selectedRevenda)) {
          return false;
        }
      }

      // Filtro 4: Turno
      if (
        filters.shift &&
        filters.shift !== 'Todos' &&
        filters.shift !== 'Todas' &&
        filters.shift !== 'Todos os Turnos' &&
        filters.shift !== 'Todos (T1, T2, T3)'
      ) {
        const tripShift = (trip.shift || '').trim().toUpperCase();
        const filterShift = filters.shift.trim().toUpperCase();
        if (tripShift !== filterShift) return false;
      }

      // Filtro 5: Unidade / Origem
      if (
        filters.origin &&
        filters.origin !== 'Todas' &&
        filters.origin !== 'Todos' &&
        filters.origin !== 'Todas as Unidades'
      ) {
        const tripOrigin = (trip.unidade || trip.origin || '').trim().toUpperCase();
        const filterOrigin = filters.origin.trim().toUpperCase();
        if (tripOrigin !== filterOrigin && !tripOrigin.includes(filterOrigin) && !filterOrigin.includes(tripOrigin)) {
          return false;
        }
      }

      // Filtro 6: Frota
      if (
        filters.fleet &&
        filters.fleet !== 'Todas' &&
        filters.fleet !== 'Todos' &&
        filters.fleet !== 'Todas as Frotas'
      ) {
        const tripFleet = (trip.fleetType || '').trim().toUpperCase();
        const filterFleet = filters.fleet.trim().toUpperCase();
        if (tripFleet !== filterFleet) return false;
      }

      // Filtro de Categoria / Status
      if (filters.categoryFilter && filters.categoryFilter !== 'ALL') {
        if (trip.category !== filters.categoryFilter) return false;
      }

      // Filtro de Busca Geral (Motorista, Placa, ID, Revenda, Data)
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesDriver = (trip.driver || '').toLowerCase().includes(query);
        const matchesPlate = (trip.plate || '').toLowerCase().includes(query);
        const matchesId = (trip.id || '').toLowerCase().includes(query);
        const matchesRevenda = (trip.revenda || trip.reseller || '').toLowerCase().includes(query);
        const matchesDate = (trip.date || '').toLowerCase().includes(query);
        if (!matchesDriver && !matchesPlate && !matchesId && !matchesRevenda && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [filters, tripsData]);

  // Cálculo reativo e dinâmico de KPIs de acordo com as viagens filtradas e metas da revenda
  const dynamicKPIs = useMemo(() => {
    return calculateKPIsFromTrips(filteredTrips, activeMetas);
  }, [filteredTrips, activeMetas]);

  const handleExportXLSX = () => {
    // Generate CSV content from filtered trips
    const headers = [
      'ID Viagem',
      'Data',
      'Turno',
      'Motorista',
      'Placa',
      'Frota',
      'Revenda',
      'Ciclo Total',
      'TMA (CDR)',
      'TMV Ida',
      'TMV Volta',
      'TR (Revenda)',
      'Status Meta'
    ];

    const rows = filteredTrips.map((t) => [
      t.id,
      t.date,
      t.shift,
      `"${t.driver}"`,
      t.plate,
      t.fleetType,
      `"${t.revenda || t.reseller}"`,
      t.cycleTotal,
      t.tmaCDR,
      t.tmvOutbound,
      t.tmvInbound,
      t.trRevenda,
      `"${t.metaStatus}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Base_Viagens_Operacional_LogSLA.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Base com ${filteredTrips.length} viagens exportada com sucesso em formato CSV/XLSX!`);
  };

  const handleExportRelatorio = () => {
    setIsParecerOpen(true);
  };

  const handleSaveMetasConfig = (resellerKey: string, newMetas: RevendaMetas) => {
    setMetasConfig((prev) => ({
      ...prev,
      [resellerKey]: newMetas
    }));
    showToast(`Metas de SLA para "${resellerKey}" atualizadas com sucesso!`);
  };

  const handleSelectTripById = (tripId: string) => {
    const found = tripsData.find((t) => t.id === tripId);
    if (found) {
      setSelectedTrip(found);
    }
  };

  const handleGoogleSheetsDataLoaded = (
    newTrips: TripRecord[],
    newKpis: KPIStats,
    sourceTitle: string
  ) => {
    setTripsData(newTrips);
    setDatabaseSource(sourceTitle);
    showToast(`Base atualizada! ${newTrips.length} viagens carregadas do Google Sheets.`);
  };

  const handleResetToDefault = () => {
    setTripsData(TRIPS_DATA);
    setDatabaseSource('Base Padrão Homologada (38 Viagens CDR Ambev)');
    showToast('Base padrão homologada restaurada com sucesso.');
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'executivo':
        return 'Painel Executivo de Ciclo & SLA';
      case 'indicadores':
        return 'Indicadores & Metas de Desempenho';
      case 'relatorios':
        return 'Relatórios & Evidências Telemétricas';
      case 'configuracoes':
        return 'Configurações do Sistema';
      case 'analitico':
      default:
        return 'Painel Analítico';
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex selection:bg-primary-container selection:text-on-primary-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/40 text-on-surface text-[12px] shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-secondary text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar Navigation (Collapsible / Retrátil) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfigMetas={() => setIsConfigMetasOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
      />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onExportXLSX={handleExportXLSX}
          onEmitirParecerPDF={() => setIsParecerOpen(true)}
          onExportRelatorio={handleExportRelatorio}
          onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
          sourceTitle={databaseSource}
          activeTabTitle={getActiveTabTitle()}
          tableMode={tableMode}
          onToggleTableMode={() => setTableMode((m) => (m === 'audit' ? 'sheets' : 'audit'))}
          totalTripsCount={filteredTrips.length}
        />

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          availableMonths={availableMonths}
          availableDays={availableDays}
          availableResellers={availableResellers}
          availableShifts={availableShifts}
          availableOrigins={availableOrigins}
          availableFleets={availableFleets}
          totalFilteredCount={filteredTrips.length}
          totalCount={tripsData.length}
        />

        {/* Main Content View Container */}
        <main className="w-full px-4 sm:px-6 py-4 flex-1 flex flex-col gap-4 bg-surface">
          {activeTab === 'analitico' && (
            <>
              {/* Section 1: Executive KPI Cards */}
              <KPICards
                kpis={dynamicKPIs}
                onCardClick={(kpi) => {
                  if (kpi === 'tma') {
                    showToast('Visualizando histórico do TMA vs Meta (Carga CDR Ambev).');
                  } else if (kpi === 'tr') {
                    showToast('Visualizando histórico do TR vs Meta (Retenção em Doca da Revenda).');
                  } else if (kpi === 'ciclo') {
                    showToast('Visualizando Ciclo Operacional (TMA + TMV).');
                  }
                }}
              />

              {/* Section 2: Painel de Gráficos Analíticos Avançados para Defesa */}
              <AnalyticsCharts
                trips={filteredTrips}
                allTrips={tripsData}
                currentReseller={filters.reseller}
                activeMetas={activeMetas}
                onSelectTrip={handleSelectTripById}
              />

              {/* Section 3: Operational Trips Table */}
              <TripsTable
                trips={filteredTrips}
                onSelectTrip={(trip) => setSelectedTrip(trip)}
                tableMode={tableMode}
                onToggleTableMode={() => setTableMode((m) => (m === 'audit' ? 'sheets' : 'audit'))}
              />
            </>
          )}

          {activeTab === 'executivo' && (
            <ExecutiveView
              kpis={dynamicKPIs}
              onOpenParecer={() => setIsParecerOpen(true)}
              onOpenConfigMetas={() => setIsConfigMetasOpen(true)}
              onExportXLSX={handleExportXLSX}
            />
          )}

          {activeTab === 'indicadores' && (
            <IndicatorsView
              kpis={dynamicKPIs}
              onOpenParecer={() => setIsParecerOpen(true)}
              onOpenConfigMetas={() => setIsConfigMetasOpen(true)}
              onExportXLSX={handleExportXLSX}
            />
          )}

          {activeTab === 'relatorios' && (
            <ReportsView
              kpis={dynamicKPIs}
              onOpenParecer={() => setIsParecerOpen(true)}
              onOpenConfigMetas={() => setIsConfigMetasOpen(true)}
              onExportXLSX={handleExportXLSX}
            />
          )}

          {activeTab === 'configuracoes' && (
            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 max-w-2xl space-y-6">
              <div>
                <h2 className="text-[18px] font-bold text-on-surface">Configurações do Sistema</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">
                  Gerencie parâmetros operacionais, fontes de dados e metas de SLA por Revenda.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card: Configurar Metas */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                      <h3 className="font-bold text-[14px] text-on-surface">Configurar Metas de SLA</h3>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Defina e ajuste as metas contratuais de Ciclo Total (16h), TMA (3h 30m), TMV (11h) e tolerância de TR (2h) por unidade ou consolidadas.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsConfigMetasOpen(true)}
                    className="w-full px-3.5 py-2 rounded-lg bg-primary text-[#00354a] font-bold text-[12px] hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>Editar Metas de SLA</span>
                  </button>
                </div>

                {/* Card: Google Sheets */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#34a853] text-[20px]">table_chart</span>
                      <h3 className="font-bold text-[14px] text-on-surface">Google Sheets</h3>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Conecte sua planilha online do Google Sheets com as 19 colunas operacionais para sincronização em tempo real e atualização de dados.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsGoogleSheetsOpen(true)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0f9d58]/20 hover:bg-[#0f9d58]/30 text-[#34a853] font-bold text-[12px] transition-colors flex items-center justify-center gap-1.5 border border-[#0f9d58]/40 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
                    <span>Conectar Google Sheets</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Global Footer */}
        <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 py-3">
          <div className="w-full px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-on-surface-variant text-[12px]">
            <div>
              &copy; 2024 LogSLA Pro Telemetria Operacional &bull; Sistema Integrado de SLA Logístico &bull; Ambientes Operacionais CDR Ambev / ADIB
            </div>
            <div className="flex items-center gap-4 font-label-caps text-[10px] text-on-surface-variant">
              <span>LATÊNCIA: 18ms</span>
              <span>STATUS: TELEMETRIA ATIVA</span>
              <span>VERSÃO: 3.4.2-PROD</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Trip Details Modal (Dossiê Operacional & Telemetria) */}
      <TripDetailsModal
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
      />

      {/* Parecer Técnico Modal (Defesa de SLA Jurídico-Operacional) */}
      <ParecerTecnicoModal
        isOpen={isParecerOpen}
        onClose={() => setIsParecerOpen(false)}
        kpis={dynamicKPIs}
        currentReseller={filters.reseller}
      />

      {/* Configure Metas Modal */}
      <ConfigureMetasModal
        isOpen={isConfigMetasOpen}
        onClose={() => setIsConfigMetasOpen(false)}
        metasConfig={metasConfig}
        currentReseller={filters.reseller}
        availableResellers={availableResellers.map((r) => r.name)}
        onSaveMetas={handleSaveMetasConfig}
      />

      {/* Google Sheets Import Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        onDataLoaded={handleGoogleSheetsDataLoaded}
        onResetToDefault={handleResetToDefault}
        currentSource={databaseSource}
      />
    </div>
  );
}
