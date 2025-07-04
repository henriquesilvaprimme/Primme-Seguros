import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importações dos seus componentes e páginas
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

// --- NOVA URL BASE DO GOOGLE APPS SCRIPT ---
// Esta é a parte comum de todas as suas URLs de implantação do Apps Script.
const NEW_BASE_GAS_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec';

// --- SUAS CONSTANTES DE URLS ESPECÍFICAS (ATUALIZADAS COM A NOVA BASE) ---
// Estas URLs serão usadas diretamente nas chamadas fetch.
const GOOGLE_SHEETS_SCRIPT_URL = `${NEW_BASE_GAS_URL}?v=getLeads`; // Para buscar todos os leads
const GOOGLE_SHEETS_USERS = `${NEW_BASE_GAS_URL}?v=pegar_usuario`; // Para buscar usuários
const GOOGLE_SHEETS_LEADS_FECHADOS = `${NEW_BASE_GAS_URL}?v=pegar_clientes_fechados`; // Para buscar leads fechados (nova ação no GAS)
const GOOGLE_SHEETS_LEAD_CREATION_URL = `${NEW_BASE_GAS_URL}?action=criar_lead`; // Para criar leads (POST com action no URL)

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
      console.error("Erro ao carregar usuário do localStorage:", error);
      return null;
    }
  });

  // Estado para os dados da aplicação, inicializados como arrays vazios
  const [leads, setLeads] = useState([]);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [leadsPerdidos, setLeadsPerdidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);

  // Estado para o carregamento do background
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Efeito para pré-carregar a imagem de background
  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // --- Funções de Fetch de Dados do Google Sheets ---

  const fetchLeadsFromSheet = useCallback(async () => {
    console.log("Iniciando fetchLeadsFromSheet...");
    try {
      // Usa GOOGLE_SHEETS_SCRIPT_URL
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Erro ao parsear JSON de Leads:", e, responseText);
        setLeads([]);
        setLeadsFechados([]);
        setLeadsPerdidos([]);
        return;
      }

      if (data.success && Array.isArray(data.data)) {
        const rawLeads = data.data;
        
        const sortedData = rawLeads.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA; // decrescente (mais recente no topo)
        });

        const formattedLeads = sortedData.map((item) => ({
          id: String(item.id || ''),
          name: String(item.name || ''),
          vehicleModel: String(item.vehiclemodel || ''),
          vehicleYearModel: String(item.vehicleyearmodel || ''),
          city: String(item.city || ''),
          phone: String(item.phone || ''),
          insuranceType: String(item.insurancetype || ''),
          status: String(item.status || 'Pendente'),
          confirmado: item.confirmado === true || String(item.confirmado).toLowerCase() === 'true',
          insurer: String(item.insurer || ''),
          insurerConfirmed: item.insurerconfirmed === true || String(item.insurerconfirmed).toLowerCase() === 'true',
          usuarioId: item.usuarioid ? String(item.usuarioid) : '',
          premioLiquido: Number(item.premioliquido) || 0,
          comissao: Number(item.comissao) || 0,
          parcelamento: String(item.parcelamento || ''),
          createdAt: (item.data instanceof Date ? item.data.toISOString() : String(item.data || '')),
          responsavel: String(item.responsavel || ''),
          editado: (item.editado instanceof Date ? item.editado.toISOString() : String(item.editado || ''))
        }));

        setLeads(formattedLeads);
        setLeadsFechados(formattedLeads.filter(lead => lead.status === 'Fechado'));
        setLeadsPerdidos(formattedLeads.filter(lead => lead.status === 'Perdido'));
        
      } else {
        console.warn("API de Leads retornou sucesso: false ou dados não são um array esperado:", data);
        setLeads([]);
        setLeadsFechados([]);
        setLeadsPerdidos([]);
      }
    } catch (error) {
      console.error('Erro geral ao buscar leads do Google Sheets:', error);
      setLeads([]);
      setLeadsFechados([]);
      setLeadsPerdidos([]);
    }
  }, []);

  const fetchUsuariosFromSheet = useCallback(async () => {
    console.log("Iniciando fetchUsuariosFromSheet...");
    try {
      // Usa GOOGLE_SHEETS_USERS
      const response = await fetch(GOOGLE_SHEETS_USERS);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Erro ao parsear JSON de Usuários:", e, responseText);
        setUsuarios([]);
        return;
      }

      if (data.success && Array.isArray(data.data)) {
        const rawUsuarios = data.data;

        const formattedUsuarios = rawUsuarios.map((item) => ({
          id: String(item.id || ''),
          usuario: String(item.usuario || ''),
          nome: String(item.nome || ''),
          email: String(item.email || ''),
          senha: String(item.senha || ''),
          status: String(item.status || 'Ativo'),
          tipo: String(item.tipo || 'Usuario'),
        }));
        setUsuarios(formattedUsuarios);
      } else {
        console.warn("API de Usuários retornou sucesso: false ou dados não são um array esperado:", data);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro geral ao buscar usuários do Google Sheets:', error);
      setUsuarios([]);
    }
  }, []);

  // Efeitos para carregar dados ao montar o componente e a cada minuto
  useEffect(() => {
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

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  };

  const adicionarLead = async (leadData) => {
    const newId = generateUniqueId();
    const newLead = {
      ...leadData,
      id: newId,
      data: new Date().toISOString(),
      status: 'Pendente',
      confirmado: false,
      insurer: '',
      insurerConfirmed: false,
      premioLiquido: 0,
      comissao: 0,
      parcelamento: '',
      responsavel: '',
      editado: '',
    };

    setLeads((prev) => [...prev, newLead]);

    try {
      console.log('Enviando novo lead para o Apps Script:', newLead);
      // Usa GOOGLE_SHEETS_LEAD_CREATION_URL
      await fetch(GOOGLE_SHEETS_LEAD_CREATION_URL, {
        method: 'POST',
        mode: 'no-cors',
        // A action 'criar_lead' já está na URL. O corpo envia os dados do lead.
        body: JSON.stringify({ lead: newLead }), // Removido 'action' do body, pois já está na URL
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de adicionar lead enviada (no-cors). Verifique logs do Apps Script.');
      alert('Lead criado! Recarregando dados para sincronização.');
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao chamar API para adicionar lead:', error);
      alert('Erro ao criar lead no servidor. Tente novamente.');
      fetchLeadsFromSheet();
    }
  };

  const adicionarUsuario = async (usuarioData) => {
    try {
      console.log('Enviando novo usuário para o Apps Script:', usuarioData);
      // Usa NEW_BASE_GAS_URL para POST de usuário, com action no body
      await fetch(NEW_BASE_GAS_URL, { // Use a base URL para POSTs com action no body
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'salvar_usuario', usuario: usuarioData }), // Action no body
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de adicionar usuário enviada (no-cors). Verifique logs do Apps Script.');
      alert('Usuário criado! Recarregando dados para sincronização.');
      fetchUsuariosFromSheet();
    } catch (error) {
      console.error('Erro ao chamar API para adicionar usuário:', error);
      alert('Erro ao criar usuário no servidor. Tente novamente.');
      fetchUsuariosFromSheet();
    }
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    let leadParaAtualizar = leads.find((lead) => String(lead.id) === String(id));

    if (!leadParaAtualizar) {
      console.warn("Lead não encontrado para atualização de status:", id);
      alert('Lead não encontrado para atualização.');
      return;
    }

    const updatedLeadData = {
      ...leadParaAtualizar,
      id: String(leadParaAtualizar.id),
      status: novoStatus,
      confirmado: true,
      editado: new Date().toISOString()
    };

    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(id) ? { ...updatedLeadData } : lead
      )
    );

    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const existing = prev.find(l => String(l.id) === String(id));
        if (existing) {
          return prev.map(l => String(l.id) === String(id) ? { ...updatedLeadData } : l);
        } else {
          return [...prev, { ...updatedLeadData }];
        }
      });
      setLeadsPerdidos((prev) => prev.filter(l => String(l.id) !== String(id)));
    } else if (novoStatus === 'Perdido') {
      setLeadsPerdidos((prev) => {
        const existing = prev.find(l => String(l.id) === String(id));
        if (existing) {
          return prev.map(l => String(l.id) === String(id) ? { ...updatedLeadData } : l);
        } else {
          return [...prev, { ...updatedLeadData }];
        }
      });
      setLeadsFechados((prev) => prev.filter(l => String(l.id) !== String(id)));
    } else {
      setLeadsFechados((prev) => prev.filter(l => String(l.id) !== String(id)));
      setLeadsPerdidos((prev) => prev.filter(l => String(l.id) !== String(id)));
    }

    try {
      console.log('Enviando atualização de status do lead para o Apps Script:', updatedLeadData);
      // Usa NEW_BASE_GAS_URL para POST de leads, com action no body
      await fetch(NEW_BASE_GAS_URL, { // Use a base URL para POSTs com action no body
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'salvar_lead', lead: updatedLeadData }), // Action no body
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Requisição de atualização de status do lead ${id} enviada (no-cors). Verifique logs do Apps Script.`);
      alert(`Status do lead ${leadParaAtualizar.name} atualizado para ${novoStatus}. Recarregando dados.`);
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao chamar API para atualizar status do lead:', error);
      alert('Erro ao atualizar status do lead no servidor. Tente novamente.');
      fetchLeadsFromSheet();
    }
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leadsFechados.find((l) => String(l.id) === String(id));

    if (!lead) {
      console.error("Lead não encontrado para confirmação de seguradora (ID):", id);
      alert('Lead não encontrado para confirmação de seguradora.');
      return;
    }

    const updatedLeadData = {
      ...lead,
      id: String(lead.id),
      insurer: String(seguradora || ''),
      insurerConfirmed: true,
      premioLiquido: Number(premio) || 0,
      comissao: Number(comissao) || 0,
      parcelamento: String(parcelamento || ''),
      editado: new Date().toISOString(),
    };

    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        String(l.id) === String(id) ? { ...updatedLeadData } : l
      );
      return atualizados;
    });

    setLeads((prev) =>
      prev.map((l) =>
        String(l.id) === String(id) ? { ...updatedLeadData } : l
      )
    );

    try {
      console.log('Enviando confirmação de seguradora para o Apps Script:', updatedLeadData);
      // Usa NEW_BASE_GAS_URL para POST de seguradora, com action no body
      await fetch(NEW_BASE_GAS_URL, { // Use a base URL para POSTs com action no body
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'alterar_seguradora', lead: updatedLeadData }), // Action no body
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de confirmação de seguradora enviada (no-cors). Verifique logs do Apps Script.');
      alert('Seguradora e detalhes do lead fechado atualizados. Recarregando dados.');
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao chamar API para confirmar seguradora:', error);
      alert('Erro ao confirmar seguradora do lead no servidor. Tente novamente.');
      fetchLeadsFromSheet();
    }
  };

  const transferirLead = async (leadId, responsavelId) => {
    let responsavelNome = null;
    if (responsavelId !== null && responsavelId !== "") {
      const usuario = usuarios.find((u) => String(u.id) === String(responsavelId));
      if (!usuario) {
        console.warn("Usuário responsável não encontrado para ID:", responsavelId);
        alert("Usuário responsável não encontrado.");
        return;
      }
      responsavelNome = usuario.nome;
    }

    const leadParaTransferir = leads.find(l => String(l.id) === String(leadId));
    if (!leadParaTransferir) {
      console.error("Lead não encontrado para transferência:", leadId);
      alert('Lead não encontrado para transferência.');
      return;
    }

    const updatedLeadData = {
      ...leadParaTransferir,
      id: String(leadParaTransferir.id),
      responsavel: String(responsavelNome || ''),
      editado: new Date().toISOString(),
    };

    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(leadId) ? { ...updatedLeadData } : lead
      )
    );

    try {
      console.log('Enviando transferência do lead para o Apps Script:', updatedLeadData);
      // Usa NEW_BASE_GAS_URL para POST de transferência, com action no body
      await fetch(NEW_BASE_GAS_URL, { // Use a base URL para POSTs com action no body
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'transferir_lead', lead: updatedLeadData }), // Action no body
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Requisição de transferência do lead ${leadId} enviada (no-cors). Verifique logs do Apps Script.`);
      alert(`Lead ${leadParaTransferir.name} transferido para ${responsavelNome || 'Ninguém'}. Recarregando dados.`);
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao chamar API para transferir lead:', error);
      alert('Erro ao transferir lead no servidor.');
      fetchLeadsFromSheet();
    }
  };

  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => String(u.id) === String(id));
    if (!usuario) {
      console.error("Usuário não encontrado para atualização:", id);
      alert("Usuário não encontrado.");
      return;
    }

    const usuarioAtualizado = {
      ...usuario,
      id: String(usuario.id)
    };
    if (novoStatus !== null) usuarioAtualizado.status = String(novoStatus);
    if (novoTipo !== null) usuarioAtualizado.tipo = String(novoTipo);

    setUsuarios((prev) =>
      prev.map((u) =>
        String(u.id) === String(id)
          ? {
              ...u,
              ...(novoStatus !== null ? { status: String(novoStatus) } : {}),
              ...(novoTipo !== null ? { tipo: String(novoTipo) } : {}),
            }
          : u
      )
    );

    try {
      console.log('Enviando atualização de usuário para o Apps Script:', usuarioAtualizado);
      // Usa NEW_BASE_GAS_URL para POST de usuário, com action no body
      await fetch(NEW_BASE_GAS_URL, { // Use a base URL para POSTs com action no body
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'salvar_usuario', usuario: usuarioAtualizado }), // Action no body
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Requisição de atualização do usuário ${id} enviada (no-cors). Verifique logs do Apps Script.`);
      alert(`Status/Tipo do usuário ${usuario.nome} atualizado. Recarregando dados.`);
      fetchUsuariosFromSheet();
    } catch (error) {
      console.error('Erro ao chamar API para atualizar usuário:', error);
      alert('Erro ao atualizar status/tipo do usuário no servidor. Tente novamente.');
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

  const handleLogin = async () => {
    setErroLogin('');
    try {
      // Usa GOOGLE_SHEETS_USERS para login
      const response = await fetch(GOOGLE_SHEETS_USERS);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

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
        console.warn('API de usuários para login não retornou um array de dados esperado ou a estrutura está incorreta:', data);
        setErroLogin(data?.error || 'Erro desconhecido ao carregar usuários para login. Formato de dados inválido ou sucesso: false.');
        return;
      }

      const fetchedUsuarios = data.data;

      const usuarioAutenticado = fetchedUsuarios.find(
        (u) =>
          String(u.usuario) === loginInput &&
          String(u.senha) === senhaInput &&
          String(u.status) === 'Ativo'
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
      setErroLogin('Ocorreu um erro ao tentar fazer login. Verifique sua conexão ou tente novamente.');
    }
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    localStorage.removeItem('usuarioLogado');
    navigate('/login');
  };

  const isAuthenticated = !!usuarioLogado;

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

  // Define isAdmin fora do JSX para maior clareza e para evitar re-calculo desnecessário
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
                leadsClosed={isAdmin ? leadsFechados : leadsFechados.filter((lead) => String(lead.responsavel) === String(usuarioLogado?.nome))}
                leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel) === String(usuarioLogado?.nome))}
                usuarioLogado={usuarioLogado}
              />
            }
          />
          <Route
            path="/leads"
            element={
              <Leads
                leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel) === String(usuarioLogado?.nome))}
                usuarios={usuarios}
                onUpdateStatus={atualizarStatusLead}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                transferirLead={transferirLead}
                usuarioLogado={usuarioLogado}
                leadSelecionado={leadSelecionado}
                onAbrirLead={onAbrirLead}
              />
            }
          />
          <Route
            path="/leads-fechados"
            element={
              <LeadsFechados
                leads={isAdmin ? leadsFechados : leadsFechados.filter((lead) => String(lead.responsavel) === String(usuarioLogado?.nome))}
                usuarios={usuarios}
                onConfirmInsurer={confirmarSeguradoraLead}
                fetchLeadsFromSheet={fetchLeadsFromSheet} // Ainda pode ser útil para re-fetch geral
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
                leads={isAdmin ? leadsPerdidos : leadsPerdidos.filter((lead) => String(lead.responsavel) === String(usuarioLogado?.nome))}
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
                fetchUsuariosFromSheet={fetchUsuariosFromSheet}
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

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
