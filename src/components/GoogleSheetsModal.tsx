import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  getAccessToken,
  logout,
  initAuth
} from '../services/googleAuth';
import {
  listUserSpreadsheets,
  getSpreadsheetDetails,
  fetchSheetValues,
  parseRowsToTrips,
  calculateKPIsFromTrips,
  extractSpreadsheetId,
  GOOGLE_SHEETS_STANDARD_COLUMNS,
  DriveSpreadsheet,
  SheetTab
} from '../services/googleSheets';
import { TripRecord, KPIStats } from '../types';
import { TRIPS_DATA, INITIAL_KPIS } from '../data/tripsData';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
  ExternalLink,
  Table,
  UploadCloud
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (newTrips: TripRecord[], newKpis: KPIStats, sourceTitle: string) => void;
  onResetToDefault: () => void;
  currentSource: string;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  onResetToDefault,
  currentSource
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheet[]>([]);

  const [inputUrlOrId, setInputUrlOrId] = useState('');
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState('');
  const [sheetTabs, setSheetTabs] = useState<SheetTab[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // When token is available, load user's Google Drive spreadsheets
  useEffect(() => {
    if (token) {
      loadDriveFiles(token);
    }
  }, [token]);

  const loadDriveFiles = async (accToken: string) => {
    setIsLoadingDrive(true);
    setErrorMessage(null);
    try {
      const files = await listUserSpreadsheets(accToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        'Não foi possível listar arquivos do Google Drive automaticamente. Você ainda pode colar o link da planilha abaixo.'
      );
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Falha ao autenticar com Google. Verifique o bloqueador de pop-ups.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    setSelectedSpreadsheetId('');
    setSheetTabs([]);
    setPreviewRows([]);
  };

  // Inspect selected spreadsheet and list tabs
  const handleSelectSpreadsheet = async (sheetId: string) => {
    if (!token) return;
    const cleanId = extractSpreadsheetId(sheetId);
    if (!cleanId) return;

    setSelectedSpreadsheetId(cleanId);
    setIsLoadingSheets(true);
    setErrorMessage(null);
    setPreviewRows([]);
    setPreviewHeaders([]);

    try {
      const details = await getSpreadsheetDetails(cleanId, token);
      setSpreadsheetTitle(details.title);
      setSheetTabs(details.sheets);
      if (details.sheets.length > 0) {
        const firstTab = details.sheets[0].title;
        setSelectedTab(firstTab);
        await loadTabPreview(cleanId, firstTab, token);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        'Erro ao acessar a planilha. Verifique se o ID ou URL está correto e se sua conta tem permissão de leitura.'
      );
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const loadTabPreview = async (sheetId: string, tabName: string, accToken: string) => {
    try {
      const rawRows = await fetchSheetValues(sheetId, tabName, accToken);
      if (rawRows.length > 0) {
        setPreviewHeaders(rawRows[0]);
        setPreviewRows(rawRows.slice(1, 6)); // First 5 rows preview
      } else {
        setPreviewHeaders([]);
        setPreviewRows([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao carregar os dados desta aba da planilha.');
    }
  };

  const handleTabChange = async (tabName: string) => {
    setSelectedTab(tabName);
    if (token && selectedSpreadsheetId) {
      setIsLoadingSheets(true);
      await loadTabPreview(selectedSpreadsheetId, tabName, token);
      setIsLoadingSheets(false);
    }
  };

  const handleImport = async () => {
    if (!token || !selectedSpreadsheetId || !selectedTab) return;
    setIsImporting(true);
    setErrorMessage(null);

    try {
      const rawRows = await fetchSheetValues(selectedSpreadsheetId, selectedTab, token);
      if (rawRows.length < 2) {
        throw new Error('A planilha precisa ter pelo menos uma linha de cabeçalho e uma de dados.');
      }

      const parsedTrips = parseRowsToTrips(rawRows);
      if (parsedTrips.length === 0) {
        throw new Error(
          'Nenhuma viagem válida foi identificada. Verifique se os nomes das colunas correspondem ao padrão.'
        );
      }

      const calculatedKPIs = calculateKPIsFromTrips(parsedTrips);
      const sourceName = `${spreadsheetTitle || 'Google Sheets'} (${selectedTab}) - ${
        parsedTrips.length
      } viagens`;

      onDataLoaded(parsedTrips, calculatedKPIs, sourceName);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao processar dados da planilha.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadSample38 = () => {
    onDataLoaded(TRIPS_DATA, INITIAL_KPIS, 'Base Homologada (38 Viagens da Planilha)');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f9d58]/15 border border-[#0f9d58]/40 flex items-center justify-center text-[#34a853] shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-[#0f9d58]" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-on-surface">
                Integração Google Sheets
              </h2>
              <p className="text-[12px] text-on-surface-variant">
                Conecte planilhas operacionais e sincronize as 19 colunas de dados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-on-surface text-[13px]">
          {/* Active Database Info */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Database className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono text-on-surface-variant block font-semibold">
                  Base Ativa no Painel
                </span>
                <span className="font-semibold text-on-surface text-[13px] truncate block">
                  {currentSource || 'Base Padrão Homologada (38 Viagens CDR Ambev)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSample38}
                className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 text-[11px] font-mono font-semibold hover:bg-primary/30 transition-colors cursor-pointer"
              >
                Carregar 38 Viagens
              </button>
              <button
                onClick={() => {
                  onResetToDefault();
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-on-surface hover:border-primary/50 text-[11px] cursor-pointer"
              >
                Restaurar
              </button>
            </div>
          </div>

          {/* Standard 19 Columns Display */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-primary uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" />
                Estrutura das 19 Colunas Reconhecidas
              </span>
              <span className="text-[10px] font-mono text-secondary font-semibold">
                100% Mapeado
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {GOOGLE_SHEETS_STANDARD_COLUMNS.map((col, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-[10px] font-mono text-on-surface-variant"
                >
                  <strong className="text-primary font-bold">{idx + 1}.</strong> {col}
                </span>
              ))}
            </div>
          </div>

          {/* Google Authentication */}
          {!user ? (
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UploadCloud className="w-5 h-5 text-primary" />
              </div>
              <div className="max-w-md">
                <h3 className="text-[14px] font-bold text-on-surface mb-1">
                  Conectar ao Google Sheets
                </h3>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Faça login para selecionar qualquer planilha diretamente do seu Google Drive ou
                  importar via link compartilhado.
                </p>
              </div>

              <button
                onClick={handleLogin}
                disabled={isSigningIn}
                className="px-5 py-2 rounded-full bg-white text-gray-800 font-semibold text-[13px] hover:bg-gray-100 transition-all shadow-md flex items-center gap-2.5 cursor-pointer border border-gray-300 disabled:opacity-50"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                </svg>
                <span>
                  {isSigningIn ? 'Conectando ao Google...' : 'Entrar com o Google'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Connected Card */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuário'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-primary/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[13px]">
                      {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-on-surface text-[12px] block">
                      {user.displayName || 'Conta Google Conectada'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant block font-mono">
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded text-[11px] text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                >
                  Desconectar
                </button>
              </div>

              {/* Spreadsheets in Drive */}
              <div>
                <label className="block text-[11px] font-mono text-on-surface-variant uppercase font-bold mb-1.5">
                  Planilhas no seu Google Drive
                </label>
                {isLoadingDrive ? (
                  <div className="p-4 text-center text-[12px] text-on-surface-variant">
                    Buscando planilhas no Google Drive...
                  </div>
                ) : driveFiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {driveFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handleSelectSpreadsheet(file.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          selectedSpreadsheetId === file.id
                            ? 'bg-[#0f9d58]/15 border-[#0f9d58] text-on-surface'
                            : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#0f9d58] shrink-0" />
                        <span className="text-[12px] font-medium truncate flex-1">{file.name}</span>
                        {selectedSpreadsheetId === file.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34a853] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-on-surface-variant/80">
                    Nenhuma planilha encontrada automaticamente no Drive. Cole o link ou ID abaixo:
                  </p>
                )}
              </div>

              {/* Paste ID / URL */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-on-surface-variant uppercase font-bold">
                  Ou Cole o Link / ID da Planilha Google Sheets
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    value={inputUrlOrId}
                    onChange={(e) => setInputUrlOrId(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] outline-none focus:border-primary/50 font-mono"
                  />
                  <button
                    onClick={() => handleSelectSpreadsheet(inputUrlOrId)}
                    disabled={!inputUrlOrId.trim() || isLoadingSheets}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-[12px] font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Inspecionar
                  </button>
                </div>
              </div>

              {/* Selected Spreadsheet & Tabs */}
              {selectedSpreadsheetId && (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-[#0f9d58]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#34a853] uppercase font-bold block">
                        Planilha Carregada
                      </span>
                      <strong className="text-[13px] text-on-surface">{spreadsheetTitle}</strong>
                    </div>

                    {sheetTabs.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-on-surface-variant font-mono">Aba:</span>
                        <select
                          value={selectedTab}
                          onChange={(e) => handleTabChange(e.target.value)}
                          className="bg-surface-container-high border border-outline-variant/40 text-on-surface text-[12px] rounded px-2 py-1 outline-none font-mono"
                        >
                          {sheetTabs.map((t) => (
                            <option key={t.sheetId} value={t.title}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Preview Table */}
                  {isLoadingSheets ? (
                    <div className="p-4 text-center text-[12px] text-on-surface-variant">
                      Carregando colunas e linhas da planilha...
                    </div>
                  ) : previewHeaders.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                        <span>PRÉVIA DOS DADOS ({previewHeaders.length} COLUNAS IDENTIFICADAS)</span>
                        <span className="text-secondary font-semibold">Cabeçalho Validado</span>
                      </div>
                      <div className="max-w-full overflow-x-auto border border-outline-variant/20 rounded-lg">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-surface-container-lowest text-on-surface-variant font-medium font-mono text-[10px]">
                              {previewHeaders.slice(0, 8).map((h, idx) => (
                                <th
                                  key={idx}
                                  className="p-1.5 px-2 border-b border-outline-variant/15 whitespace-nowrap"
                                >
                                  {h || `Col ${idx + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10 font-mono text-[10px]">
                            {previewRows.map((r, rIdx) => (
                              <tr key={rIdx} className="hover:bg-surface-container">
                                {r.slice(0, 8).map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="p-1.5 px-2 whitespace-nowrap text-on-surface"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-high border-t border-outline-variant/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-surface border border-outline-variant/30 text-on-surface text-[12px] hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {user && selectedSpreadsheetId && (
            <button
              onClick={handleImport}
              disabled={isImporting || isLoadingSheets}
              className="px-4 py-1.5 rounded-lg bg-[#0f9d58] text-white font-semibold text-[12px] hover:bg-[#0f9d58]/90 transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
              <span>{isImporting ? 'Importando Viagens...' : 'Carregar e Atualizar Painel'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
