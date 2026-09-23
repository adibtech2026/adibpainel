import React, { useState, useMemo } from 'react';
import { TripRecord, TripCategory } from '../types';
import { parseTimeToMinutes } from '../services/googleSheets';
import {
  FileSpreadsheet,
  Layers,
  ChevronLeft,
  ChevronRight,
  User,
  Truck,
  Calendar,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface TripsTableProps {
  trips: TripRecord[];
  onSelectTrip: (trip: TripRecord) => void;
  categoryFilter?: 'ALL' | TripCategory;
  onCategoryFilterChange?: (cat: 'ALL' | TripCategory) => void;
  tableMode?: 'audit' | 'sheets';
  onToggleTableMode?: () => void;
}

export const TripsTable: React.FC<TripsTableProps> = ({
  trips,
  onSelectTrip,
  tableMode = 'audit',
  onToggleTableMode
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dedicated table filters requested by user: Motorista, Placa, Frota, Data
  const [driverFilter, setDriverFilter] = useState('');
  const [plateFilter, setPlateFilter] = useState('');
  const [fleetFilter, setFleetFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Extract unique options from trips dataset
  const driverOptions = useMemo(() => {
    return Array.from(new Set(trips.map((t) => t.driver).filter(Boolean))).sort();
  }, [trips]);

  const plateOptions = useMemo(() => {
    return Array.from(new Set(trips.map((t) => t.plate).filter(Boolean))).sort();
  }, [trips]);

  const fleetOptions = useMemo(() => {
    return Array.from(new Set(trips.map((t) => t.fleetType).filter(Boolean))).sort();
  }, [trips]);

  const dateOptions = useMemo(() => {
    const parseDate = (d: string) => {
      const parts = d.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
      }
      return 0;
    };
    return Array.from(new Set(trips.map((t) => t.date).filter(Boolean))).sort(
      (a, b) => parseDate(a) - parseDate(b)
    );
  }, [trips]);

  type SortField = 'date' | 'driver' | 'plate' | 'cycle' | 'tma' | 'tmv' | 'tr' | null;
  type SortOrder = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    const isActive = sortField === field;
    if (isActive) {
      return sortOrder === 'asc' ? (
        <ArrowUp className="w-3 h-3 text-primary shrink-0" />
      ) : (
        <ArrowDown className="w-3 h-3 text-primary shrink-0" />
      );
    }
    return (
      <ArrowUpDown className="w-2.5 h-2.5 text-outline/40 group-hover:text-on-surface-variant shrink-0 transition-colors" />
    );
  };

  // Filter trips by the 4 criteria
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (driverFilter && t.driver !== driverFilter) return false;
      if (plateFilter && t.plate !== plateFilter) return false;
      if (fleetFilter && t.fleetType !== fleetFilter) return false;
      if (dateFilter && t.date !== dateFilter) return false;
      return true;
    });
  }, [trips, driverFilter, plateFilter, fleetFilter, dateFilter]);

  // Sort trips when a column is selected for sorting
  const sortedTrips = useMemo(() => {
    if (!sortField) return filteredTrips;

    const parseDateToMs = (d: string) => {
      if (!d) return 0;
      const parts = d.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
      }
      return 0;
    };

    return [...filteredTrips].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date': {
          comparison = parseDateToMs(a.date) - parseDateToMs(b.date);
          break;
        }
        case 'driver': {
          comparison = (a.driver || '').localeCompare(b.driver || '', 'pt-BR');
          break;
        }
        case 'plate': {
          comparison = (a.plate || '').localeCompare(b.plate || '') || (a.fleetType || '').localeCompare(b.fleetType || '');
          break;
        }
        case 'cycle': {
          const aSec = a.cycleTotalSeconds || (parseTimeToMinutes(a.cycleTotal) * 60);
          const bSec = b.cycleTotalSeconds || (parseTimeToMinutes(b.cycleTotal) * 60);
          comparison = aSec - bSec;
          break;
        }
        case 'tma': {
          const aMin = parseTimeToMinutes(a.tmaCDR) || 0;
          const bMin = parseTimeToMinutes(b.tmaCDR) || 0;
          comparison = aMin - bMin;
          break;
        }
        case 'tmv': {
          const aMin = parseTimeToMinutes(a.tmvTotal || a.tmvOutbound) || 0;
          const bMin = parseTimeToMinutes(b.tmvTotal || b.tmvOutbound) || 0;
          comparison = aMin - bMin;
          break;
        }
        case 'tr': {
          const aMin = parseTimeToMinutes(a.trRevenda) || 0;
          const bMin = parseTimeToMinutes(b.trRevenda) || 0;
          comparison = aMin - bMin;
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTrips, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedTrips.length / pageSize));
  const paginatedTrips = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTrips.slice(start, start + pageSize);
  }, [sortedTrips, page, pageSize]);

  const hasActiveFilters = Boolean(driverFilter || plateFilter || fleetFilter || dateFilter || sortField);

  const handleClearFilters = () => {
    setDriverFilter('');
    setPlateFilter('');
    setFleetFilter('');
    setDateFilter('');
    setSortField(null);
    setSortOrder('asc');
    setPage(1);
  };

  return (
    <section className="rounded-xl bg-surface-container-low shadow-sm flex flex-col overflow-hidden border border-outline-variant/30">
      {/* Table Header Bar with Motorista, Placa, Frota, Data filters */}
      <div className="p-3.5 sm:p-4 bg-surface-container border-b border-outline-variant/20 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[14px] sm:text-[15px] font-bold text-on-surface tracking-tight">
              {tableMode === 'sheets'
                ? 'Google Sheets (19 Colunas)'
                : 'Painel Operacional de Viagens'}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/30 text-[11px] font-mono text-primary font-semibold">
              {filteredTrips.length} de {trips.length} viagens
            </span>
            {sortField && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/30 text-[11px] font-mono text-secondary font-semibold">
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                <span>
                  {sortField === 'date' && 'Data'}
                  {sortField === 'driver' && 'Motorista'}
                  {sortField === 'plate' && 'Placa/Frota'}
                  {sortField === 'cycle' && 'Ciclo'}
                  {sortField === 'tma' && 'TMA'}
                  {sortField === 'tmv' && 'TMV'}
                  {sortField === 'tr' && 'TR'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSortField(null);
                    setSortOrder('asc');
                  }}
                  className="hover:text-error ml-0.5 text-[12px] font-bold cursor-pointer"
                  title="Remover classificação"
                >
                  &times;
                </button>
              </span>
            )}
          </div>

          {/* Quick Filters for Motorista, Placa, Frota, Data */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            {/* Filtro Motorista */}
            <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1">
              <User className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                aria-label="Filtrar por Motorista"
                value={driverFilter}
                onChange={(e) => {
                  setDriverFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-on-surface text-[11px] font-medium outline-none cursor-pointer pr-1 max-w-[140px] truncate"
              >
                <option value="">Motorista (Todos)</option>
                {driverOptions.map((d) => (
                  <option key={d} value={d} className="bg-surface-container-high text-on-surface">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Placa */}
            <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1">
              <Truck className="w-3.5 h-3.5 text-secondary shrink-0" />
              <select
                aria-label="Filtrar por Placa"
                value={plateFilter}
                onChange={(e) => {
                  setPlateFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-on-surface text-[11px] font-mono font-medium outline-none cursor-pointer pr-1 max-w-[110px]"
              >
                <option value="">Placa (Todas)</option>
                {plateOptions.map((p) => (
                  <option key={p} value={p} className="bg-surface-container-high text-on-surface font-mono">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Frota */}
            <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1">
              <Layers className="w-3.5 h-3.5 text-tertiary shrink-0" />
              <select
                aria-label="Filtrar por Frota"
                value={fleetFilter}
                onChange={(e) => {
                  setFleetFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-on-surface text-[11px] font-medium outline-none cursor-pointer pr-1 max-w-[100px]"
              >
                <option value="">Frota (Todas)</option>
                {fleetOptions.map((f) => (
                  <option key={f} value={f} className="bg-surface-container-high text-on-surface">
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Data */}
            <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                aria-label="Filtrar por Data"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-on-surface text-[11px] font-mono font-medium outline-none cursor-pointer pr-1 max-w-[110px]"
              >
                <option value="">Data (Todas)</option>
                {dateOptions.map((d) => (
                  <option key={d} value={d} className="bg-surface-container-high text-on-surface font-mono">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Limpar Filtros */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-[11px] font-mono text-tertiary transition-colors cursor-pointer"
                title="Limpar filtros da tabela"
                type="button"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* View mode toggle & Page size */}
        <div className="flex items-center gap-3 self-end xl:self-auto text-[11px] text-on-surface-variant">
          {onToggleTableMode && (
            <button
              onClick={onToggleTableMode}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all cursor-pointer ${
                tableMode === 'sheets'
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border-outline-variant/30'
              }`}
              title="Alternar entre visão operacional sintetizada e a visão das 19 colunas do Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{tableMode === 'sheets' ? 'Ver Modo Sintético' : 'Ver 19 Colunas'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Exibir:</span>
            <select
              aria-label="Registros por página"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-surface-container-high border border-outline-variant/30 text-on-surface rounded px-2 py-1 text-[11px] font-mono outline-none cursor-pointer"
            >
              <option value={8}>8 / pág</option>
              <option value={10}>10 / pág</option>
              <option value={15}>15 / pág</option>
              <option value={38}>38 (Todos)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Body Container */}
      <div className="w-full overflow-x-auto">
        {tableMode === 'sheets' ? (
          /* ========================================================
             VISÃO GOOGLE SHEETS COM AS 19 COLUNAS EXATAS
             ======================================================== */
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-surface-container-lowest text-on-surface-variant font-mono text-[10px] uppercase tracking-wider border-b border-outline-variant/20">
                <th className="py-2.5 px-3 font-semibold text-primary">#</th>
                <th className="py-2.5 px-3 font-semibold">1. MOTORISTA</th>
                <th className="py-2.5 px-3 font-semibold">2. FROTA</th>
                <th className="py-2.5 px-3 font-semibold">3. PLACA</th>
                <th className="py-2.5 px-3 font-semibold">4. UNIDADE</th>
                <th className="py-2.5 px-3 font-semibold">5. MÊS NUM</th>
                <th className="py-2.5 px-3 font-semibold">6. MÊS</th>
                <th className="py-2.5 px-3 font-semibold">7. DATA</th>
                <th className="py-2.5 px-3 font-semibold text-on-surface">8. CICLO TOTAL</th>
                <th className="py-2.5 px-3 font-semibold">9. TURNO REVENDA</th>
                <th className="py-2.5 px-3 font-semibold">10. DIA DA SEMAN</th>
                <th className="py-2.5 px-3 font-semibold">11. PARADA</th>
                <th className="py-2.5 px-3 font-semibold">12. REVENDA</th>
                <th className="py-2.5 px-3 font-semibold">13. TEMPO CARGA</th>
                <th className="py-2.5 px-3 font-semibold">14. TMV IDA</th>
                <th className="py-2.5 px-3 font-semibold">15. TMV VOLTA</th>
                <th className="py-2.5 px-3 font-semibold">16. TMV</th>
                <th className="py-2.5 px-3 font-semibold">17. TMA</th>
                <th className="py-2.5 px-3 font-semibold">18. FILA</th>
                <th className="py-2.5 px-3 font-semibold text-error">19. TR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface text-[12px] font-mono">
              {paginatedTrips.map((trip, idx) => {
                const isBottleneck = trip.category === 'EXCEDENTE_REVENDA';
                return (
                  <tr
                    key={trip.id}
                    onClick={() => onSelectTrip(trip)}
                    className={`hover:bg-surface-container transition-colors cursor-pointer group ${
                      isBottleneck ? 'bg-error-container/5' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-on-surface-variant font-medium">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface font-semibold">
                      {trip.driver}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                      {trip.fleetType}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-primary font-bold">
                      {trip.plate}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                      {trip.unidade}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                      {trip.mesNum}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                      {trip.mes}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface">
                      {trip.date}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface font-semibold">
                      {trip.cycleTotal}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                      {trip.shift}
                    </td>
                    <td className="py-2 px-3 text-center text-on-surface-variant">
                      {trip.diaSemana || '—'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {trip.stopReason === 'OFICINA' ? (
                        <span className="px-1.5 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold text-[10px]">
                          OFICINA
                        </span>
                      ) : (
                        <span className="text-outline">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant font-medium">
                      {trip.revenda || trip.reseller || '—'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-outline">
                      {trip.tempoCarga || '00:00:00'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                      {trip.tmvOutbound}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-on-surface-variant">
                      {trip.tmvInbound}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-primary font-semibold">
                      {trip.tmvTotal || '12:00:00'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-secondary font-semibold">
                      {trip.tmaCDR}
                    </td>
                    <td className="py-2 px-3 text-center text-outline">{trip.fila || '0'}</td>
                    <td
                      className={`py-2 px-3 font-bold whitespace-nowrap ${
                        isBottleneck ? 'text-error' : 'text-on-surface'
                      }`}
                    >
                      {trip.trRevenda}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* ========================================================
             VISÃO AUDITORIA OPERACIONAL SINTÉTICA
             Colunas: Data, Motorista, Placa / Frota, Ciclo Total,
             TMA (CDR), TMV Ida / Volta, TR (Revenda)
             (Turno e Status Meta removidos conforme solicitado)
             ======================================================== */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-on-surface-variant font-mono text-[10px] uppercase tracking-wider border-b border-outline-variant/20">
                <th className="py-2.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('date')}
                    className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer select-none group text-left"
                    title="Classificar por Data"
                  >
                    <span>Data</span>
                    {renderSortIcon('date')}
                  </button>
                </th>
                <th className="py-2.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('driver')}
                    className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer select-none group text-left"
                    title="Classificar por Motorista"
                  >
                    <span>Motorista</span>
                    {renderSortIcon('driver')}
                  </button>
                </th>
                <th className="py-2.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('plate')}
                    className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer select-none group text-left"
                    title="Classificar por Placa / Frota"
                  >
                    <span>Placa / Frota</span>
                    {renderSortIcon('plate')}
                  </button>
                </th>
                <th className="py-2.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('cycle')}
                    className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer select-none group text-left"
                    title="Classificar por Ciclo Total"
                  >
                    <span>Ciclo Total</span>
                    {renderSortIcon('cycle')}
                  </button>
                </th>
                <th className="py-2.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('tma')}
                    className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer select-none group text-left"
                    title="Classificar por TMA (CDR)"
                  >
                    <span>TMA (CDR)</span>
                    {renderSortIcon('tma')}
                  </button>
                </th>
                <th className="py-2.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('tmv')}
                    className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer select-none group text-left"
                    title="Classificar por TMV Ida / Volta"
                  >
                    <span>TMV Ida / Volta</span>
                    {renderSortIcon('tmv')}
                  </button>
                </th>
                <th className="py-2.5 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('tr')}
                    className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer select-none group text-left"
                    title="Classificar por TR (Revenda)"
                  >
                    <span>TR (Revenda)</span>
                    {renderSortIcon('tr')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface text-[12px]">
              {paginatedTrips.map((trip) => {
                const isBottleneck = trip.category === 'EXCEDENTE_REVENDA';
                const isOficina = trip.category === 'OFICINA';

                return (
                  <tr
                    key={trip.id}
                    onClick={() => onSelectTrip(trip)}
                    className={`hover:bg-surface-container transition-colors cursor-pointer group ${
                      isBottleneck ? 'bg-error-container/5' : isOficina ? 'bg-tertiary/5' : ''
                    }`}
                    title="Clique para visualizar detalhes da viagem"
                  >
                    {/* Data (sem turno) */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[12px] font-semibold text-on-surface">
                      {trip.date}
                    </td>

                    {/* Motorista */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[13px] text-on-surface font-medium">
                          {trip.driver}
                        </span>
                      </div>
                    </td>

                    {/* Placa / Frota & Revenda */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[12px]">
                      <span className="text-primary font-bold">{trip.plate}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-on-surface-variant text-[11px]">
                          {trip.fleetType}
                        </span>
                        <span className="text-outline text-[10px]">&bull;</span>
                        <span className="text-secondary text-[11px] font-medium max-w-[130px] truncate" title={trip.revenda || trip.reseller}>
                          {trip.revenda || trip.reseller || 'Revenda'}
                        </span>
                      </div>
                    </td>

                    {/* Ciclo Total */}
                    <td
                      className={`py-2.5 px-4 whitespace-nowrap font-mono text-[12px] font-semibold ${
                        isBottleneck
                          ? 'text-error'
                          : isOficina
                          ? 'text-tertiary'
                          : 'text-on-surface'
                      }`}
                    >
                      {trip.cycleTotal}
                      <span className="block text-[10px] text-on-surface-variant font-normal">
                        Meta: 16h 00m
                      </span>
                    </td>

                    {/* TMA (CDR) */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[12px] text-on-surface">
                      {trip.tmaCDR}
                      <span className="block text-[10px] text-secondary font-medium">
                        {trip.tmaDiffMeta}
                      </span>
                    </td>

                    {/* TMV Ida / Volta */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[12px] text-on-surface-variant">
                      <span className="text-on-surface">{trip.tmvOutbound}</span> /{' '}
                      <span className="text-on-surface">{trip.tmvInbound}</span>
                    </td>

                    {/* TR (Revenda) */}
                    <td
                      className={`py-2.5 px-4 whitespace-nowrap font-mono text-[12px] ${
                        isBottleneck ? 'text-error font-bold' : 'text-on-surface'
                      }`}
                    >
                      {trip.trRevenda}
                      <span
                        className={`block text-[10px] ${
                          isBottleneck ? 'text-error font-medium' : 'text-secondary font-medium'
                        }`}
                      >
                        {trip.trDiffMeta}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Pagination & Footer */}
      <div className="p-3 px-4 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-on-surface-variant font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <span>
            Exibindo {paginatedTrips.length} de {filteredTrips.length} viagens operacionais
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface disabled:opacity-30 cursor-pointer hover:bg-surface-container-high transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface disabled:opacity-30 cursor-pointer hover:bg-surface-container-high transition-colors"
                title="Próxima Página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
        </div>
      </div>
    </section>
  );
};
