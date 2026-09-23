import React from 'react';
import { FilterState } from '../types';
import {
  Search,
  RotateCcw,
  Warehouse,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Truck,
  X
} from 'lucide-react';

export interface MonthOption {
  key: string;
  label: string;
  count?: number;
}

export interface DayOption {
  date: string;
  label: string;
  count?: number;
}

export interface FilterItemOption {
  name: string;
  count?: number;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableMonths?: MonthOption[];
  availableDays?: DayOption[];
  availableResellers?: (string | FilterItemOption)[];
  availableShifts?: (string | FilterItemOption)[];
  availableOrigins?: (string | FilterItemOption)[];
  availableFleets?: (string | FilterItemOption)[];
  totalFilteredCount?: number;
  totalCount?: number;
}

const normalizeOptions = (
  items?: (string | FilterItemOption)[]
): FilterItemOption[] => {
  if (!items) return [];
  return items.map((it) => (typeof it === 'string' ? { name: it } : it));
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableMonths = [],
  availableDays = [],
  availableResellers = [],
  availableShifts = [],
  availableOrigins = [],
  availableFleets = [],
  totalFilteredCount,
  totalCount
}) => {
  const resellersList = normalizeOptions(availableResellers);
  const shiftsList = normalizeOptions(availableShifts);
  const originsList = normalizeOptions(availableOrigins);
  const fleetsList = normalizeOptions(availableFleets);

  const isFiltered =
    Boolean(filters.search) ||
    (Boolean(filters.shift) && filters.shift !== 'Todos' && filters.shift !== 'Todas' && filters.shift !== 'Todos os Turnos') ||
    (Boolean(filters.period) && filters.period !== 'Todos' && filters.period !== 'Todas' && filters.period !== 'Todos os Meses') ||
    (Boolean(filters.day) && filters.day !== 'Todos' && filters.day !== 'Todas' && filters.day !== 'Todos os Dias') ||
    (Boolean(filters.fleet) && filters.fleet !== 'Todas' && filters.fleet !== 'Todos' && filters.fleet !== 'Todas as Frotas') ||
    (Boolean(filters.origin) && filters.origin !== 'Todas' && filters.origin !== 'Todos' && filters.origin !== 'Todas as Unidades') ||
    (Boolean(filters.reseller) && filters.reseller !== 'Todas' && filters.reseller !== 'Todos' && filters.reseller !== 'Todas as Revendas' && filters.reseller !== 'Todas as Revendas (Consolidado)') ||
    filters.categoryFilter !== 'ALL';

  return (
    <section className="w-full px-4 sm:px-6 py-2 bg-surface-container-low/95 border-b border-outline-variant/20 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Filters Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Mês Filter (Extraído estritamente da base de dados) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] shadow-sm hover:border-outline-variant/60 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Mês:
            </span>
            <select
              id="filter-mes"
              aria-label="Selecionar Mês"
              value={filters.period || 'Todos'}
              onChange={(e) => onFilterChange({ period: e.target.value, day: 'Todos' })}
              className="bg-transparent text-on-surface font-semibold text-[12px] outline-none cursor-pointer pr-1"
            >
              <option value="Todos" className="bg-[#171f33] text-white">
                Todos os Meses {totalCount ? `(${totalCount})` : ''}
              </option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key} className="bg-[#171f33] text-white">
                  {m.label} {m.count !== undefined ? `(${m.count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dia Filter (Extraído estritamente da base de dados) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] shadow-sm hover:border-outline-variant/60 transition-colors">
            <CalendarDays className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Dia:
            </span>
            <select
              id="filter-dia"
              aria-label="Selecionar Dia Operacional"
              value={filters.day || 'Todos'}
              onChange={(e) => onFilterChange({ day: e.target.value })}
              className="bg-transparent text-on-surface font-semibold text-[12px] outline-none cursor-pointer pr-1 max-w-[140px]"
            >
              <option value="Todos" className="bg-[#171f33] text-white">
                Todos os Dias
              </option>
              {availableDays.map((d) => (
                <option key={d.date} value={d.date} className="bg-[#171f33] text-white">
                  {d.label} {d.count !== undefined ? `(${d.count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Revenda Destino Filter (Extraído estritamente da base de dados) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] shadow-sm hover:border-primary/50 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Revenda:
            </span>
            <select
              id="filter-reseller"
              aria-label="Selecionar Revenda Destino"
              value={filters.reseller || 'Todas'}
              onChange={(e) => onFilterChange({ reseller: e.target.value })}
              className="bg-transparent text-primary font-semibold text-[12px] outline-none cursor-pointer pr-1"
            >
              <option value="Todas" className="bg-[#171f33] text-white">
                Todas as Revendas (Consolidado)
              </option>
              {resellersList.map((r) => (
                <option key={r.name} value={r.name} className="bg-[#171f33] text-white">
                  {r.name} {r.count !== undefined ? `(${r.count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Turno Filter (Extraído estritamente da base de dados) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] shadow-sm hover:border-outline-variant/60 transition-colors">
            <Clock className="w-3.5 h-3.5 text-outline shrink-0" />
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Turno:
            </span>
            <select
              id="filter-shift"
              aria-label="Selecionar Turno"
              value={filters.shift || 'Todos'}
              onChange={(e) => onFilterChange({ shift: e.target.value })}
              className="bg-transparent text-on-surface font-semibold text-[12px] outline-none cursor-pointer pr-1"
            >
              <option value="Todos" className="bg-[#171f33] text-white">
                Todos os Turnos
              </option>
              {shiftsList.map((s) => (
                <option key={s.name} value={s.name} className="bg-[#171f33] text-white">
                  {s.name} {s.count !== undefined ? `(${s.count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Unidade / Origem Filter (Extraído estritamente da base de dados) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] shadow-sm hover:border-outline-variant/60 transition-colors">
            <Warehouse className="w-3.5 h-3.5 text-outline shrink-0" />
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Unidade:
            </span>
            <select
              id="filter-origin"
              aria-label="Selecionar Unidade Origem"
              value={filters.origin || 'Todas'}
              onChange={(e) => onFilterChange({ origin: e.target.value })}
              className="bg-transparent text-on-surface font-semibold text-[12px] outline-none cursor-pointer pr-1"
            >
              <option value="Todas" className="bg-[#171f33] text-white">
                Todas as Unidades
              </option>
              {originsList.map((u) => (
                <option key={u.name} value={u.name} className="bg-[#171f33] text-white">
                  {u.name} {u.count !== undefined ? `(${u.count})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Frota Filter (Extraído estritamente da base de dados) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] shadow-sm hover:border-outline-variant/60 transition-colors">
            <Truck className="w-3.5 h-3.5 text-outline shrink-0" />
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Frota:
            </span>
            <select
              id="filter-fleet"
              aria-label="Selecionar Frota"
              value={filters.fleet || 'Todas'}
              onChange={(e) => onFilterChange({ fleet: e.target.value })}
              className="bg-transparent text-on-surface font-semibold text-[12px] outline-none cursor-pointer pr-1"
            >
              <option value="Todas" className="bg-[#171f33] text-white">
                Todas as Frotas
              </option>
              {fleetsList.map((f) => (
                <option key={f.name} value={f.name} className="bg-[#171f33] text-white">
                  {f.name} {f.count !== undefined ? `(${f.count})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Reset */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              id="search-input"
              type="text"
              placeholder="Buscar motorista, placa ou data..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-8 pr-3 py-1 text-[12px] rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 w-44 md:w-56"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              id="btn-reset-filters"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-tertiary hover:text-tertiary-fixed bg-surface-container hover:bg-surface-container-high border border-tertiary/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              title="Restaurar todos os filtros para o padrão"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}

          {typeof totalFilteredCount === 'number' && typeof totalCount === 'number' && (
            <span className="text-[11px] font-mono text-on-surface-variant hidden lg:inline-block">
              {totalFilteredCount} de {totalCount} viagens
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
