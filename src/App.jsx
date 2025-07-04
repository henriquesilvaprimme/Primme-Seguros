import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './Leads';
import LeadsFechados from './LeadsFechados';
import LeadsPerdidos from './LeadsPerdidos';
import BuscarLead from './BuscarLead';
import CriarUsuario from './pages/CriarUsuario';
import Usuarios from './pages/Usuarios';
import Ranking from './pages/Ranking';
import CriarLead from './pages/CriarLead';

// --- URLs do Google Apps Script ---
// URL base da sua nova implantação do Apps Script
const GOOGLE_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// URLs específicas usando a base (para GET, ainda usam 'v' na URL)
const GOOGLE_SHEETS_LEADS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=getLeads`; // Para buscar leads
const GOOGLE_SHEETS_USERS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=pegar_usuario`; // Para buscar usuários
// REMOVIDO: const GOOGLE_SHEETS_LEADS_FECHADOS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=pegar_clientes_fechados`; // Esta URL não será mais necessária se 'fetchLeadsFromSheet' buscar todos os leads.

// URL para ações POST (criar/salvar/transferir/alterar), usando a URL base.
// A ação será passada no corpo do JSON.
const GOOGLE_SHEETS_POST_ACTION_URL = `${GOOGLE_SCRIPT_BASE_URL}`;

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // O estado 'leads' será a fonte de verdade para TODOS os leads
  const [leads, setLeads] = useState([]);
  // 'leadsFechados' não é mais um estado separado, será filtrado de 'leads' onde for necessário
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png'; // Verifique o caminho correto da imagem
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // Use useCallback para memorizar as funções de fetch e evitar loops infinitos em useEffect
  const fetchLeadsFromSheet = useCallback(async () => {
    try {
      console.log("Fetching leads from:", GOOGLE_SHEETS_LEADS_API);
      const response = await fetch(GOOGLE_SHEETS_LEADS_API);

      if (!response.ok) {
        console.error(`HTTP error fetching leads: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dados de Leads Recebidos:", data);

      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA;
        });

        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? Number(item.id) : index + 1,
          name: item.name || item.Name || '',
          vehicleModel: item.vehiclemodel || item.vehicleModel || '',
          vehicleYearModel: item.vehicleyearmodel || item.vehicleYearModel || '',
          city: item.city || '',
          phone: item.phone || item.Telefone || '',
          insuranceType: item.insurancetype || item.insuranceType || '',
          status: item.status || 'Selecione o status',
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerconfirmed === 'true' || item.insurerconfirmed === true,
          usuarioId: item.usuarioid ? Number(item.usuarioid) : null,
          premioLiquido: item.premioliquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          createdAt: item.data || new Date().toISOString(),
          responsavel: item.responsavel || '',
          editado: item.editado || '',
          // Mapeamento dos campos do Google Sheet para o componente
          // Estes devem coincidir com os nomes de coluna do seu Google Sheet para leads fechados
          ID: item.id ? Number(item.id) : index + 1, // 'ID' é usado no LeadsFechados
          Data: item.data || new Date().toISOString(), // 'Data' é usado no LeadsFechados
          Seguradora: item.seguradora || '', // 'Seguradora' é usado no LeadsFechados
          PremioLiquido: item.premioliquido || '', // 'PremioLiquido' é usado no LeadsFechados
          Comissao: item.comissao || '', // 'Comissao' é usado no LeadsFechados
          Parcelamento: item.parcelamento || '', // 'Parcelamento' é usado no LeadsFechados
          Responsavel: item.responsavel || '', // 'Responsavel' é usado no LeadsFechados
        }));

        console.log("Leads Formatados:", formattedLeads);
        setLeads(formattedLeads); // Sempre atualiza o estado principal
      } else {
        setLeads([]);
        console.warn("Dados de leads não são um array:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar leads do Google Sheets:', error);
      setLeads([]);
    }
  }, []); // Dependências vazias, pois a URL é constante

  // REMOVIDO: fetchLeadsFechadosFromSheet não é mais um fetch separado,
  // pois todos os leads vêm de fetchLeadsFromSheet
  // const fetchLeadsFechadosFromSheet = useCallback(async () => { ... });

  const fetchUsuariosFromSheet = useCallback(async () => {
    try {
      console.log("Tentando buscar usuários de:", GOOGLE_SHEETS_USERS_API);
      const response = await fetch(GOOGLE_SHEETS_USERS_API);

      if (!response.ok) {
        console.error(`HTTP error fetching users: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Usuários Recebidos no Frontend (para login):", data);

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item) => ({
          id: String(item.id || ''),
          usuario: String(item.usuario || ''),
          nome: String(item.nome || ''),
          email: String(item.email || ''),
          senha: String(item.senha || ''),
          status: String(item.status || 'Ativo'),
          tipo: String(item.tipo || 'Usuario'),
        }));
        setUsuarios(formattedUsuarios);
        console.log("Usuários formatados e setados no estado:", formattedUsuarios);
      } else {
        setUsuarios([]);
        console.warn("Dados de usuários não são um array:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do Google Sheets (Frontend):', error);
      setUsuarios([]);
    }
  }, []); // Dependências vazias

  // Efeitos para buscar dados periodicamente
  useEffect(() => {
    fetchLeadsFromSheet();
    const interval = setInterval(fetchLeadsFromSheet, 60000);
    return () => clearInterval(interval);
  }, [fetchLeadsFromSheet]);

  // REMOVIDO: Intervalo para fetchLeadsFechadosFromSheet, pois agora faz parte do fetchLeadsFromSheet
  // useEffect(() => {
  //   fetchLeadsFechadosFromSheet();
  //   const interval = setInterval(fetchLeadsFechadosFromSheet, 60000);
  //   return () => clearInterval(interval);
  // }, [fetchLeadsFechadosFromSheet]);

  useEffect(() => {
    fetchUsuariosFromSheet();
    const interval = setInterval(fetchUsuariosFromSheet, 60000);
    return () => clearInterval(interval);
  }, [fetchUsuariosFromSheet]);

  const adicionarUsuario = (usuario) => {
    // Apenas adiciona localmente. O CriarUsuario DEVE chamar fetchUsuariosFromSheet após o POST.
    setUsuarios((prev) => [...prev, { ...usuario, id: String(prev.length + 1) }]);
  };

  const adicionarLead = (lead) => {
    // Apenas adiciona localmente. O CriarLead DEVE chamar fetchLeadsFromSheet após o POST.
    setLeads((prev) => [...prev, lead]);
  };

  // Função para atualizar status do lead (COM no-cors)
  const atualizarStatusLead = async (id, novoStatus, phone) => {
    // Otimisticamente atualiza o estado local para resposta rápida da UI
    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    try {
      const payload = {
        action: 'alterar_status',
        phone: String(phone).trim(),
        status: novoStatus,
      };

      console.log("Enviando atualização de status do lead (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors', // Mantido no-cors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("Requisição de atualização de status do lead enviada. Verifique os logs do GAS.");

      // Forçamos o refresh dos dados após um pequeno delay
      setTimeout(() => {
        fetchLeadsFromSheet(); // Este fetch agora buscará todos os leads, incluindo os fechados/perdidos
      }, 100);

    } catch (error) {
      console.error('Erro ao enviar atualização de status do lead:', error);
      alert('Erro de rede ao atualizar status do lead. Por favor, tente novamente.');
      // Se houve um erro de rede (não CORS), ainda precisamos re-buscar
      fetchLeadsFromSheet();
    }
  };


  // Função para confirmar seguradora do lead (COM no-cors)
  const confirmarSeguradoraLead = async (id, premioLiquido, seguradora, comissao, parcelamento) => {
    // Encontrar o lead correto no estado 'leads' (a única fonte de verdade)
    const leadToUpdate = leads.find((l) => String(l.ID) === String(id) || String(l.id) === String(id));

    if (!leadToUpdate) {
      console.error("Lead não encontrado para confirmação de seguradora (ID:", id, ").");
      return;
    }

    // Otimisticamente atualiza o estado local
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        String(l.ID) === String(id) || String(l.id) === String(id)
          ? {
              ...l,
              Seguradora: seguradora,
              PremioLiquido: premioLiquido, // O valor já vem tratado em LeadsFechados
              Comissao: comissao, // O valor já vem tratado em LeadsFechados
              Parcelamento: parcelamento, // O valor já vem tratado em LeadsFechados
              insurerConfirmed: true, // Se aplicável
            }
          : l
      )
    );

    try {
      const payload = {
        action: 'alterar_seguradora',
        lead: {
          ID: String(id), // ID do lead
          Seguradora: seguradora,
          PremioLiquido: premioLiquido,
          Comissao: comissao,
          Parcelamento: parcelamento,
        },
      };

      console.log("Enviando confirmação de seguradora (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors', // Mantido no-cors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("Requisição de confirmação de seguradora enviada. Verifique os logs do GAS.");

      // Força o refresh de TODOS os leads para garantir a consistência
      setTimeout(() => {
        fetchLeadsFromSheet();
      }, 100);

    } catch (error) {
      console.error('Erro ao enviar lead fechado para atualização de seguradora:', error);
      alert('Erro de rede ao confirmar seguradora do lead.');
      fetchLeadsFromSheet(); // Reverte o estado visual em caso de erro de rede, buscando os dados reais
    }
  };

  // Função para transferir lead (COM no-cors)
  const transferirLead = async (leadId, responsavelId) => {
    let responsavelNome = null;
    let usuario = usuarios.find((u) => String(u.id) === String(responsavelId));
    if (usuario) {
      responsavelNome = usuario.nome;
    } else {
      console.warn("Usuário responsável não encontrado para ID:", responsavelId);
      alert("Usuário responsável não encontrado. Verifique a lista de usuários.");
      return;
    }

    // Otimisticamente atualiza o estado local
    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(leadId) ? { ...lead, responsavel: responsavelNome } : lead
      )
    );

    try {
      const payload = {
        action: 'alterar_atribuido',
        id: leadId,
        usuarioId: String(responsavelId),
      };

      console.log("Enviando transferência de lead (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Mantido no-cors
        body: JSON.stringify(payload),
      });

      console.log("Requisição de transferência de lead enviada. Verifique os logs do GAS.");

      // Força o refresh de TODOS os leads
      setTimeout(() => {
        fetchLeadsFromSheet();
      }, 100);

    } catch (error) {
      console.error('Erro ao transferir lead no Sheets:', error);
      alert('Erro de rede ao transferir lead.');
      fetchLeadsFromSheet();
    }
  };

  // Função para atualizar status/tipo do usuário (COM no-cors)
  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => String(u.id) === String(id));
    if (!usuario) {
      console.warn("Usuário não encontrado para atualização de status/tipo.");
      return;
    }

    // Otimisticamente atualiza o estado local
    setUsuarios((prev) =>
      prev.map((u) =>
        String(u.id) === String(id)
          ? {
              ...u,
              ...(novoStatus !== null ? { status: novoStatus } : {}),
              ...(novoTipo !== null ? { tipo: novoTipo } : {}),
            }
          : u
      )
    );

    try {
      const payload = {
        action: 'alterar_usuario',
        usuario: {
          id: String(id),
          status: novoStatus,
          tipo: novoTipo,
        },
      };

      console.log("Enviando atualização de status/tipo do usuário (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Mantido no-cors
        body: JSON.stringify(payload),
      });

      console.log("Requisição de atualização de usuário enviada. Verifique os logs do GAS.");

      // Força o refresh dos usuários
      setTimeout(() => {
        fetchUsuariosFromSheet();
      }, 100);

    } catch (error) {
      console.error('Erro ao atualizar status/tipo do usuário no Sheets:', error);
      alert('Erro de rede ao atualizar status/tipo do usuário.');
      fetchUsuariosFromSheet();
    }
  };

  const onAbrirLead = (lead) => {
    setLeadSelecionado(lead);

    let path = '/leads';
    if (lead.status === 'Fechado') path = '/leads-fechados';
    else if (lead.status === 'Perdido') path = '/leads-perdidos';

    navigate(path);
  };

  const handleLogin = () => {
    console.log("-----------------------------------");
    console.log("Tentativa de Login Iniciada:");
    console.log("Login digitado (input):", loginInput);
    console.log("Senha digitada (input):", senhaInput);
    console.log("Usuários carregados no estado 'usuarios':", usuarios);
    console.log("-----------------------------------");

    const usuarioEncontrado = usuarios.find(
      (u) => {
        const isUserMatch = String(u.usuario).trim() === loginInput.trim();
        const isPassMatch = String(u.senha).trim() === senhaInput.trim();
        const isActive = String(u.status).trim() === 'Ativo';

        console.log(`Comparando usuário: '${String(u.usuario).trim()}' (Sheet) === '${loginInput.trim()}' (Input) -> Match User: ${isUserMatch}`);
        console.log(`Comparando senha:   '${String(u.senha).trim()}' (Sheet) === '${senhaInput.trim()}' (Input) -> Match Pass: ${isPassMatch}`);
        console.log(`Comparando status:  '${String(u.status).trim()}' (Sheet) === 'Ativo' -> Is Active: ${isActive}`);

        return isUserMatch && isPassMatch && isActive;
      }
    );

    if (usuarioEncontrado) {
      setIsAuthenticated(true);
      setUsuarioLogado(usuarioEncontrado);
      console.log("Login bem-sucedido! Usuário logado:", usuarioEncontrado);
      navigate('/dashboard');
    } else {
      alert('Login ou senha inválidos, ou usuário inativo.');
      console.log("Falha no login: Usuário não encontrado, senha incorreta ou inativo.");
    }
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  if (!isAuthenticated) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen bg-cover bg-center transition-opacity duration-1000 ${
          backgroundLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url('/background.png')`,
        }}
      >
        <div className="bg-blue-900 bg-opacity-60 text-white p-10 rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 mb-2 flex items-center justify-center text-4xl text-yellow-400">
              👑
            </div>
            <h1 className="text-xl font-semibold">GRUPO</h1>
            <h2 className="text-2xl font-bold text-white">PRIMME SEGUROS</h2>
            <p className="text-sm text-white">CORRETORA DE SEGUROS</p>
          </div>

          <input
            type="text"
            placeholder="Usuário"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded text-black"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senhaInput}
            onChange={(e) => setSenhaInput(e.target.value)}
            className="w-full mb-2 px-4 py-2 rounded text-black"
          />
          <div className="text-right text-sm mb-4">
            <a href="#" className="text-white underline">
              Esqueci minha senha
            </a>
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            ENTRAR
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = usuarioLogado?.tipo === 'Admin';

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar isAdmin={isAdmin} usuarioLogado={usuarioLogado} />

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard
                  // Leads fechados agora são filtrados do estado 'leads' principal
                  leadsClosed={
                    isAdmin
                      ? leads.filter(lead => lead.status === 'Fechado')
                      : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim() && lead.status === 'Fechado')
                  }
                  leads={
                    isAdmin
                      ? leads
                      : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())
                  }
                  usuarioLogado={usuarioLogado}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <PrivateRoute>
                <Leads
                  leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())}
                  usuarios={usuarios}
                  onUpdateStatus={atualizarStatusLead}
                  fetchLeadsFromSheet={fetchLeadsFromSheet}
                  transferirLead={transferirLead}
                  usuarioLogado={usuarioLogado}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/leads-fechados"
            element={
              <PrivateRoute>
                <LeadsFechados
                  // Leads fechados agora são filtrados do estado 'leads' principal
                  leads={
                    isAdmin
                      ? leads.filter(lead => lead.status === 'Fechado')
                      : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim() && lead.status === 'Fechado')
                  }
                  usuarios={usuarios}
                  // onUpdateInsurer e onUpdateDetalhes removidos, pois a lógica está em onConfirmInsurer
                  onConfirmInsurer={confirmarSeguradoraLead}
                  fetchLeadsFechadosFromSheet={fetchLeadsFromSheet} {/* Mantém o nome da prop, mas chama fetchLeadsFromSheet */}
                  isAdmin={isAdmin}
                  onAbrirLead={onAbrirLead}
                  leadSelecionado={leadSelecionado}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/leads-perdidos"
            element={
              <PrivateRoute>
                <LeadsPerdidos
                  // Leads perdidos agora são filtrados do estado 'leads' principal
                  leads={
                    isAdmin
                      ? leads.filter(lead => lead.status === 'Perdido')
                      : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim() && lead.status === 'Perdido')
                  }
                  usuarios={usuarios}
                  fetchLeadsFromSheet={fetchLeadsFromSheet}
                  onAbrirLead={onAbrirLead}
                  isAdmin={isAdmin}
                  leadSelecionado={leadSelecionado}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/buscar-lead"
            element={
              <PrivateRoute>
                <BuscarLead
                  leads={leads}
                  fetchLeadsFromSheet={fetchLeadsFromSheet}
                  fetchLeadsFechadosFromSheet={fetchLeadsFromSheet} {/* Mantém o nome da prop, mas chama fetchLeadsFromSheet */}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/criar-lead"
            element={<PrivateRoute><CriarLead adicionarLead={adicionarLead} googleSheetsPostUrl={GOOGLE_SHEETS_POST_ACTION_URL} usuarioLogado={usuarioLogado} fetchLeadsFromSheet={fetchLeadsFromSheet} /></PrivateRoute>}
          />

          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<PrivateRoute><CriarUsuario adicionarUsuario={adicionarUsuario} googleSheetsPostUrl={GOOGLE_SHEETS_POST_ACTION_URL} fetchUsuariosFromSheet={fetchUsuariosFromSheet} /></PrivateRoute>} />
              <Route
                path="/usuarios"
                element={
                  <PrivateRoute>
                    <Usuarios
                      leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())}
                      usuarios={usuarios}
                      fetchLeadsFromSheet={fetchLeadsFromSheet}
                      fetchLeadsFechadosFromSheet={fetchLeadsFromSheet} {/* Mantém o nome da prop, mas chama fetchLeadsFromSheet */}
                      atualizarStatusUsuario={atualizarStatusUsuario}
                    />
                  </PrivateRoute>
                }
              />
            </>
          )}
          <Route
            path="/ranking"
            element={
              <PrivateRoute>
                <Ranking
                  usuarios={usuarios}
                  fetchLeadsFromSheet={fetchLeadsFromSheet}
                  fetchLeadsFechadosFromSheet={fetchLeadsFromSheet} {/* Mantém o nome da prop, mas chama fetchLeadsFromSheet */}
                  leads={leads}
                />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
