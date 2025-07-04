import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
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
const GOOGLE_SHEETS_LEADS_FECHADOS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=pegar_clientes_fechados`; // Para buscar leads fechados

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

  const [leads, setLeads] = useState([]);
  const [leadsFechados, setLeadsFechados] = useState([]);
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
          editado: item.editado || ''
        }));

        console.log("Leads Formatados:", formattedLeads);
        setLeads(formattedLeads); // Sempre atualiza o estado
      } else {
        setLeads([]);
        console.warn("Dados de leads não são um array:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar leads do Google Sheets:', error);
      setLeads([]);
    }
  }, []); // Dependências vazias, pois a URL é constante

  const fetchLeadsFechadosFromSheet = useCallback(async () => {
    try {
      console.log("Fetching closed leads from:", GOOGLE_SHEETS_LEADS_FECHADOS_API);
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS_API);

      if (!response.ok) {
        console.error(`HTTP error fetching closed leads: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Leads Fechados Recebidos:", data);
      if (Array.isArray(data)) {
        setLeadsFechados(data);
      } else {
        setLeadsFechados([]);
        console.warn("Dados de leads fechados não são um array:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  }, []); // Dependências vazias

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

  useEffect(() => {
    fetchLeadsFechadosFromSheet();
    const interval = setInterval(fetchLeadsFechadosFromSheet, 60000);
    return () => clearInterval(interval);
  }, [fetchLeadsFechadosFromSheet]);

  useEffect(() => {
    fetchUsuariosFromSheet();
    const interval = setInterval(fetchUsuariosFromSheet, 60000);
    return () => clearInterval(interval);
  }, [fetchUsuariosFromSheet]);

  const adicionarUsuario = (usuario) => {
    // Apenas adiciona localmente, o salvamento no Sheets deve ser feito dentro do CriarUsuario
    // O ideal é que CriarUsuario chame fetchUsuariosFromSheet após salvar
    setUsuarios((prev) => [...prev, { ...usuario, id: String(prev.length + 1) }]);
  };

  const adicionarLead = (lead) => {
    // Apenas adiciona localmente, o salvamento no Sheets deve ser feito dentro do CriarLead
    // O ideal é que CriarLead chame fetchLeadsFromSheet após salvar
    setLeads((prev) => [...prev, lead]);
  };

  // Função para atualizar status do lead (AGORA COM NOVA LÓGICA DO GAS)
  const atualizarStatusLead = async (id, novoStatus, phone) => {
    // Otimisticamente atualiza o estado local para resposta rápida da UI
    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    try {
      const payload = {
        action: 'alterar_status', // Ação para o GAS
        phone: String(phone).trim(),
        status: novoStatus,
      };

      console.log("Enviando atualização de status do lead (POST):", payload);
      const response = await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // REMOVIDO: mode: 'no-cors' para poder ler a resposta
        body: JSON.stringify(payload),
      });

      // Se não for no-cors, você pode ler a resposta
      const result = await response.json();
      console.log("Resposta do GAS (alterar_status):", result);

      if (result.status === "success") {
        alert(result.message);
        // Re-buscar dados para garantir a sincronização após a operação no Sheets
        fetchLeadsFromSheet();
        fetchLeadsFechadosFromSheet();
      } else {
        alert("Erro ao atualizar status do lead: " + result.message);
        // Em caso de erro, re-buscar para reverter o estado otimista, se desejar
        fetchLeadsFromSheet();
      }
    } catch (error) {
      console.error('Erro ao atualizar status do lead no Sheets:', error);
      alert('Erro de rede ou servidor ao atualizar status do lead. Por favor, tente novamente.');
      fetchLeadsFromSheet(); // Re-buscar em caso de erro de rede
    }
  };


  // Função para confirmar seguradora do lead (AGORA COM NOVA LÓGICA DO GAS)
  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leadsFechados.find((l) => String(l.ID) === String(id));

    if (!lead) {
      console.error("Lead fechado não encontrado para confirmação de seguradora.");
      return;
    }

    // Atualiza otimisticamente o estado local (opcional, pode ser feito após sucesso do GAS)
    setLeadsFechados((prev) =>
      prev.map((l) =>
        String(l.ID) === String(id)
          ? {
              ...l,
              Seguradora: seguradora,
              PremioLiquido: premio,
              Comissao: comissao,
              Parcelamento: parcelamento,
              insurerConfirmed: true,
            }
          : l
      )
    );

    try {
      const payload = {
        action: 'alterar_seguradora', // Ação para o GAS
        lead: {
          ID: String(lead.ID), // Envia o ID para o GAS identificar a linha
          Seguradora: seguradora,
          PremioLiquido: premio,
          Comissao: comissao,
          Parcelamento: parcelamento,
          // Não precisa enviar todos os outros campos do lead aqui, apenas os que serão atualizados
        },
      };

      console.log("Enviando confirmação de seguradora (POST):", payload);
      const response = await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Resposta do GAS (alterar_seguradora):", result);

      if (result.status === "success") {
        alert(result.message);
        fetchLeadsFechadosFromSheet(); // Re-busca para garantir a sincronização
      } else {
        alert("Erro ao confirmar seguradora do lead: " + result.message);
        fetchLeadsFechadosFromSheet(); // Re-buscar para reverter o estado otimista
      }
    } catch (error) {
      console.error('Erro ao enviar lead fechado para atualização de seguradora:', error);
      alert('Erro de rede ou servidor ao confirmar seguradora do lead.');
      fetchLeadsFechadosFromSheet(); // Re-buscar em caso de erro de rede
    }
  };

  // Função para transferir lead (AGORA COM NOVA LÓGICA DO GAS)
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
        action: 'alterar_atribuido', // Ação para o GAS
        id: leadId, // O GAS espera o número da linha aqui (dados.id)
        usuarioId: String(responsavelId), // Envia o ID do usuário para o GAS procurar o nome
      };

      console.log("Enviando transferência de lead (POST):", payload);
      const response = await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Resposta do GAS (transferir_lead):", result);

      if (result.status === "success") {
        alert(result.message);
        fetchLeadsFromSheet(); // Re-busca para garantir a sincronização
      } else {
        alert("Erro ao transferir lead: " + result.message);
        fetchLeadsFromSheet(); // Re-buscar para reverter o estado otimista
      }
    } catch (error) {
      console.error('Erro ao transferir lead no Sheets:', error);
      alert('Erro de rede ou servidor ao transferir lead.');
      fetchLeadsFromSheet(); // Re-buscar em caso de erro de rede
    }
  };

  // Função para atualizar status/tipo do usuário (AGORA COM NOVA LÓGICA DO GAS)
  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => String(u.id) === String(id));
    if (!usuario) {
      console.warn("Usuário não encontrado para atualização de status/tipo.");
      return;
    }

    const usuarioAtualizado = { ...usuario };
    if (novoStatus !== null) usuarioAtualizado.status = novoStatus;
    if (novoTipo !== null) usuarioAtualizado.tipo = novoTipo;

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
        action: 'alterar_usuario', // Ação para o GAS
        usuario: {
          id: String(id), // ID do usuário para o GAS identificar
          status: novoStatus, // Pode ser null se não for atualizado
          tipo: novoTipo,     // Pode ser null se não for atualizado
        },
      };

      console.log("Enviando atualização de status/tipo do usuário (POST):", payload);
      const response = await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Resposta do GAS (alterar_usuario):", result);

      if (result.status === "success") {
        alert(result.message);
        fetchUsuariosFromSheet(); // Re-busca para garantir a sincronização
      } else {
        alert("Erro ao atualizar status/tipo do usuário: " + result.message);
        fetchUsuariosFromSheet(); // Re-buscar para reverter o estado otimista
      }
    } catch (error) {
      console.error('Erro ao atualizar status/tipo do usuário no Sheets:', error);
      alert('Erro de rede ou servidor ao atualizar status/tipo do usuário.');
      fetchUsuariosFromSheet(); // Re-buscar em caso de erro de rede
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
                  leadsClosed={
                    isAdmin
                      ? leadsFechados
                      : leadsFechados.filter((lead) => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim())
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
                  leads={isAdmin ? leadsFechados : leadsFechados.filter((lead) => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim())}
                  usuarios={usuarios}
                  onUpdateInsurer={() => { /* Remover ou adaptar se não for mais usado */ }}
                  onConfirmInsurer={confirmarSeguradoraLead}
                  onUpdateDetalhes={() => { /* Remover ou adaptar se não for mais usado */ }}
                  fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
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
                  leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())}
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
                  fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/criar-lead"
            element={<PrivateRoute><CriarLead adicionarLead={adicionarLead} googleSheetsPostUrl={GOOGLE_SHEETS_POST_ACTION_URL} usuarioLogado={usuarioLogado} /></PrivateRoute>}
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
                      fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
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
                  fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                  leads={leads} // Pode ser útil, dependendo de como o ranking usa leads
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
