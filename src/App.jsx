import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importações dos seus componentes e páginas
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './Leads'; // Verifique se é ./Leads ou ./pages/Leads
import LeadsFechados from './LeadsFechados'; // Verifique o caminho
import LeadsPerdidos from './LeadsPerdidos'; // Verifique o caminho
import BuscarLead from './BuscarLead'; // Verifique o caminho
import CriarUsuario from './pages/CriarUsuario';
import Usuarios from './pages/Usuarios';
import Ranking from './pages/Ranking';
import CriarLead from './pages/CriarLead';

// -----------------------------------------------------------------------------
// ATENÇÃO: ATUALIZE ESTA URL COM A SUA URL DE IMPLANTAÇÃO DO GOOGLE APPS SCRIPT
// Ela deve terminar em /exec
// -----------------------------------------------------------------------------
const GOOGLE_SHEETS_API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec';

const App = () => {
  const navigate = useNavigate();

  // Estados para Login
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  // Estado para o usuário logado, carregando do localStorage ao iniciar
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const storedUser = localStorage.getItem('usuarioLogado');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Erro ao parsear usuarioLogado do localStorage:", error);
      return null;
    }
  });

  // Estado para os dados da aplicação
  const [leads, setLeads] = useState([]);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [leadsPerdidos, setLeadsPerdidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);

  // Estado para o carregamento do background (melhora a experiência visual)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Efeito para pré-carregar a imagem de background
  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // --- Funções de Fetch de Dados do Google Sheets (Usando useCallback para otimização) ---

  const fetchLeadsFromSheet = useCallback(async () => {
    console.log("Iniciando fetchLeadsFromSheet...");
    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?v=getLeads`);
      const responseText = await response.text();
      console.log("Resposta bruta Leads:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Erro ao parsear JSON de Leads:", e, responseText);
        setLeads([]);
        return;
      }

      console.log("Dados de Leads Recebidos:", data);

      if (data && data.success && Array.isArray(data.data)) {
        const sortedData = data.data.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA; // decrescente (mais recente no topo)
        });

        const formattedLeads = sortedData.map((item) => ({
          id: item.id ? Number(item.id) : null, // Assumindo 'id' minúsculo do Apps Script
          name: item.name || '',
          vehicleModel: item.vehiclemodel || '',
          vehicleYearModel: item.vehicleyearmodel || '',
          city: item.city || '',
          phone: item.phone || '',
          insuranceType: item.insurancetype || '',
          status: item.status || 'Pendente',
          confirmado: item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerconfirmed === true,
          usuarioId: item.usuarioid ? Number(item.usuarioid) : null,
          premioLiquido: Number(item.premioliquido) || 0,
          comissao: Number(item.comissao) || 0,
          parcelamento: item.parcelamento || '',
          createdAt: item.data || new Date().toISOString(),
          responsavel: item.responsavel || '',
          editado: item.editado || ''
        }));

        setLeads(formattedLeads);
        setLeadsFechados(formattedLeads.filter(lead => lead.status === 'Fechado'));
        setLeadsPerdidos(formattedLeads.filter(lead => lead.status === 'Perdido'));
        
        console.log("Leads Formatados:", formattedLeads);
        console.log("Leads Fechados Filtrados (a partir de Leads):", formattedLeads.filter(lead => lead.status === 'Fechado'));
        console.log("Leads Perdidos Filtrados (a partir de Leads):", formattedLeads.filter(lead => lead.status === 'Perdido'));

      } else {
        console.warn("API de Leads retornou sucesso: false ou dados não são um array:", data);
        setLeads([]);
        setLeadsFechados([]);
        setLeadsPerdidos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads do Google Sheets:', error);
      setLeads([]);
      setLeadsFechados([]);
      setLeadsPerdidos([]);
    }
  }, []);

  const fetchUsuariosFromSheet = useCallback(async () => {
    console.log("Iniciando fetchUsuariosFromSheet...");
    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?v=pegar_usuario`);
      const responseText = await response.text();
      console.log("Resposta bruta Usuários:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Erro ao parsear JSON de Usuários:", e, responseText);
        setUsuarios([]);
        return;
      }

      console.log("Usuários Recebidos:", data);

      if (data && data.success && Array.isArray(data.data)) {
        const formattedUsuarios = data.data.map((item) => ({
          id: Number(item.id),
          usuario: item.usuario || '',
          nome: item.nome || '',
          email: item.email || '',
          senha: item.senha || '',
          status: item.status || 'Ativo',
          tipo: item.tipo || 'Usuario',
        }));
        setUsuarios(formattedUsuarios);
      } else {
        console.warn("API de Usuários retornou sucesso: false ou dados não são um array:", data);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do Google Sheets:', error);
      setUsuarios([]);
    }
  }, []);

  // Efeitos para carregar dados ao montar o componente e a cada minuto
  useEffect(() => {
    // Só busca dados se houver um usuário logado
    if (usuarioLogado) {
      fetchLeadsFromSheet();
      fetchUsuariosFromSheet();

      const intervalLeads = setInterval(fetchLeadsFromSheet, 60000);
      const intervalUsuarios = setInterval(fetchUsuariosFromSheet, 60000);

      return () => {
        clearInterval(intervalLeads);
        clearInterval(intervalUsuarios);
      };
    }
  }, [usuarioLogado, fetchLeadsFromSheet, fetchUsuariosFromSheet]);

  // --- Funções para manipulação de dados locais e comunicação com Apps Script ---

  // Gerar um ID único no frontend (para uso com no-cors)
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Função para adicionar um NOVO LEAD (chamada do CriarLead.jsx)
  const adicionarLead = async (leadData) => {
    const newId = generateUniqueId(); // Gera o ID no frontend
    const newLead = { ...leadData, id: newId, createdAt: new Date().toISOString() }; // Adiciona ID e data de criação

    // Imediatamente adiciona ao estado local para feedback rápido (UI)
    setLeads((prev) => [...prev, newLead]);

    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?action=salvar_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(newLead), // Envia o lead com o ID gerado
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de adicionar lead enviada (no-cors). Verifique logs do Apps Script.', response);
      alert('Lead criado! Recarregando dados para sincronização.');
      fetchLeadsFromSheet(); // Recarrega do Sheets para garantir sincronia
    } catch (error) {
      console.error('Erro ao chamar API para adicionar lead:', error);
      alert('Erro ao criar lead no servidor. Tente novamente.');
      fetchLeadsFromSheet(); // Recarrega para tentar corrigir o estado em caso de falha de envio
    }
  };

  // Função para adicionar um NOVO USUÁRIO (chamada do CriarUsuario.jsx)
  const adicionarUsuario = async (usuarioData) => {
    // Para usuários, o ID pode ser gerado no Apps Script, ou você pode gerar aqui
    // Se o Apps Script gera o ID, aqui só enviamos o resto dos dados.
    // Como estamos com no-cors, vamos confiar que o Apps Script adicionará
    // e recarregar a lista.
    
    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?action=salvar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(usuarioData), // Envia o usuário
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de adicionar usuário enviada (no-cors). Verifique logs do Apps Script.', response);
      alert('Usuário criado! Recarregando dados para sincronização.');
      fetchUsuariosFromSheet(); // Recarrega do Sheets para garantir sincronia
    } catch (error) {
      console.error('Erro ao chamar API para adicionar usuário:', error);
      alert('Erro ao criar usuário no servidor. Tente novamente.');
      fetchUsuariosFromSheet(); // Recarrega para tentar corrigir o estado
    }
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    let leadParaAtualizar = leads.find((lead) => lead.phone === phone);

    if (!leadParaAtualizar) {
      console.warn("Lead não encontrado para atualização de status:", phone);
      return;
    }

    const updatedLeadData = {
      ...leadParaAtualizar, // Mantém todas as propriedades existentes
      id: leadParaAtualizar.id, // Garante que o ID correto está sendo enviado
      status: novoStatus, // Novo status
      confirmado: true, // Sempre setar como true ao mudar status
      editado: new Date().toISOString() // Data/hora da última edição
    };

    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?action=salvar_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLeadData), // Envia o objeto completo com os dados atualizados
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Requisição de atualização de status do lead ${id} enviada (no-cors). Verifique logs do Apps Script.`, response);
      alert(`Status do lead ${leadParaAtualizar.name} atualizado para ${novoStatus}. Recarregando dados.`);
      fetchLeadsFromSheet(); // Recarrega todos os leads para atualizar a UI
    } catch (error) {
      console.error('Erro ao chamar API para atualizar status do lead:', error);
      alert('Erro ao atualizar status do lead no servidor.');
      fetchLeadsFromSheet(); // Tenta corrigir o estado
    }
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leads.find((lead) => lead.id === id); // Busca na lista principal de leads

    if (!lead) {
      console.error("Lead não encontrado para confirmação de seguradora (ID):", id);
      return;
    }

    const updatedLeadData = {
      ...lead, // Mantém todas as propriedades existentes
      id: lead.id, // Garante que o ID correto está sendo enviado
      insurer: seguradora,
      insurerConfirmed: true,
      premioLiquido: Number(premio) || 0,
      comissao: Number(comissao) || 0,
      parcelamento: String(parcelamento),
      editado: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?action=alterar_seguradora`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLeadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de confirmação de seguradora enviada (no-cors). Verifique logs do Apps Script.', response);
      alert('Seguradora e detalhes do lead fechado atualizados. Recarregando dados.');
      fetchLeadsFromSheet(); // Recarrega para atualizar a UI
    } catch (error) {
      console.error('Erro ao chamar API para confirmar seguradora:', error);
      alert('Erro ao confirmar seguradora do lead no servidor.');
      fetchLeadsFromSheet(); // Tenta corrigir o estado
    }
  };

  const transferirLead = async (leadId, responsavelId) => {
    let responsavelNome = null;
    if (responsavelId !== null && responsavelId !== "") { // Verifica se não é nulo ou vazio
      const usuario = usuarios.find((u) => Number(u.id) === Number(responsavelId));
      if (!usuario) {
        console.warn("Usuário responsável não encontrado para ID:", responsavelId);
        alert("Usuário responsável não encontrado.");
        return;
      }
      responsavelNome = usuario.nome;
    }

    const leadParaTransferir = leads.find(l => Number(l.id) === Number(leadId));
    if (!leadParaTransferir) {
      console.error("Lead não encontrado para transferência:", leadId);
      return;
    }

    const updatedLeadData = {
      ...leadParaTransferir,
      id: leadParaTransferir.id, // Garante que o ID correto está sendo enviado
      responsavel: responsavelNome, // Atualiza o responsável
      editado: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?action=transferir_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLeadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Requisição de transferência do lead ${leadId} enviada (no-cors). Verifique logs do Apps Script.`, response);
      alert(`Lead ${leadParaTransferir.name} transferido para ${responsavelNome || 'Ninguém'}. Recarregando dados.`);
      fetchLeadsFromSheet(); // Recarrega para atualizar a UI
    } catch (error) {
      console.error('Erro ao chamar API para transferir lead:', error);
      alert('Erro ao transferir lead no servidor.');
      fetchLeadsFromSheet(); // Tenta corrigir o estado
    }
  };

  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => Number(u.id) === Number(id));
    if (!usuario) {
      console.error("Usuário não encontrado para atualização:", id);
      alert("Usuário não encontrado.");
      return;
    }

    const usuarioAtualizado = { ...usuario };
    if (novoStatus !== null) usuarioAtualizado.status = novoStatus;
    if (novoTipo !== null) usuarioAtualizado.tipo = novoTipo;

    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?action=salvar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(usuarioAtualizado), // Envia o objeto de usuário completo
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Requisição de atualização do usuário ${id} enviada (no-cors). Verifique logs do Apps Script.`, response);
      alert(`Status/Tipo do usuário ${usuario.nome} atualizado. Recarregando dados.`);
      fetchUsuariosFromSheet(); // Recarrega para atualizar a UI
    } catch (error) {
      console.error('Erro ao chamar API para atualizar usuário:', error);
      alert('Erro ao atualizar status/tipo do usuário no servidor.');
      fetchUsuariosFromSheet(); // Tenta corrigir o estado
    }
  };

  const onAbrirLead = (lead) => {
    setLeadSelecionado(lead);
    let path = '/leads';
    if (lead.status === 'Fechado') path = '/leads-fechados';
    else if (lead.status === 'Perdido') path = '/leads-perdidos';
    navigate(path);
  };

  const handleLogin = async () => {
    setErroLogin('');
    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?v=pegar_usuario`);
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Erro ao parsear JSON da resposta de usuários (Login):', jsonError, responseText);
        setErroLogin('Erro ao processar dados de usuários do servidor.');
        return;
      }

      if (!data || !data.success || !Array.isArray(data.data)) {
        setErroLogin(data.error || 'Erro desconhecido ao carregar usuários para login.');
        return;
      }

      const fetchedUsuarios = data.data;
      const usuarioAutenticado = fetchedUsuarios.find(
        (u) =>
          u.usuario === loginInput &&
          u.senha === senhaInput &&
          u.status === 'Ativo'
      );

      if (usuarioAutenticado) {
        setUsuarioLogado(usuarioAutenticado);
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAutenticado));
        navigate('/dashboard');
      } else {
        setErroLogin('Login ou senha inválidos ou usuário inativo.');
      }
    } catch (error) {
      console.error('Erro durante o processo de login:', error);
      setErroLogin('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    localStorage.removeItem('usuarioLogado');
    navigate('/login');
  };

  const isAuthenticated = !!usuarioLogado;

  // Renderiza a tela de login se não estiver autenticado
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
          {erroLogin && <p className="text-red-300 text-sm mb-4">{erroLogin}</p>}
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

  // Se o usuário está autenticado, renderiza a aplicação principal
  const isAdmin = usuarioLogado?.tipo === 'Admin';

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar usuarioLogado={usuarioLogado} handleLogout={handleLogout} />

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                leadsClosed={isAdmin ? leadsFechados : leadsFechados.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                usuarioLogado={usuarioLogado}
              />
            }
          />
          <Route
            path="/leads"
            element={
              <Leads
                leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                usuarios={usuarios}
                onUpdateStatus={atualizarStatusLead}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                transferirLead={transferirLead}
                usuarioLogado={usuarioLogado}
                leadSelecionado={leadSelecionado}
              />
            }
          />
          <Route
            path="/leads-fechados"
            element={
              <LeadsFechados
                leads={isAdmin ? leadsFechados : leadsFechados.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                usuarios={usuarios}
                onUpdateInsurer={confirmarSeguradoraLead}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                isAdmin={isAdmin}
                leadSelecionado={leadSelecionado}
                onAbrirLead={onAbrirLead}
              />
            }
          />
          <Route
            path="/leads-perdidos"
            element={
              <LeadsPerdidos
                leads={isAdmin ? leadsPerdidos : leadsPerdidos.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                usuarios={usuarios}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                onAbrirLead={onAbrirLead}
                isAdmin={isAdmin}
                leadSelecionado={leadSelecionado}
              />
            }
          />
          <Route
            path="/buscar-lead"
            element={
              <BuscarLead
                leads={leads}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
              />
            }
          />
          <Route
            path="/ranking"
            element={
              <Ranking
                usuarios={usuarios}
                leads={leads}
              />
            }
          />

          {/* Rotas protegidas por isAdmin */}
          {isAdmin && (
            <>
              <Route
                path="/criar-lead"
                element={<CriarLead adicionarLead={adicionarLead} />}
              />
              <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
              <Route
                path="/usuarios"
                element={
                  <Usuarios
                    usuarios={usuarios}
                    fetchUsuariosFromSheet={fetchUsuariosFromSheet}
                    atualizarStatusUsuario={atualizarStatusUsuario}
                  />
                }
              />
            </>
          )}

          {/* Rota de fallback para páginas não encontradas, ou redireciona para o login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
