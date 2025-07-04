import React, { useState, useEffect } from 'react';
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

// Suas URLs para o Google Apps Script
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=getLeads';
const GOOGLE_SHEETS_USERS_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=pegar_usuario';
const GOOGLE_SHEETS_LEADS_FECHADOS_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=pegar_clientes_fechados';
const GOOGLE_SHEETS_POST_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';


const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const [leads, setLeads] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // Helper function to safely parse dates
  const parseDateSafely = (dateString) => {
    if (!dateString) return new Date(0); // Return a valid but old date for sorting if value is empty/null
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date(0) : date; // Check if date is valid
  };

  // --- FUNÇÃO PARA BUSCAR LEADS PENDENTES ---
  const fetchLeadsFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      const data = await response.json();

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na rede ou no servidor ao buscar leads: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (Array.isArray(data)) {
        const sortedData = [...data].sort((a, b) => {
          // Use the safe parser for sorting dates
          const dateA = parseDateSafely(a.editado || a.data); // Prefer 'editado' for recency, fallback to 'data'
          const dateB = parseDateSafely(b.editado || b.data);

          return dateB.getTime() - dateA.getTime();
        });

        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? Number(item.id) : index + 1,
          name: item.name || item.Name || '',
          vehicleModel: item.vehiclemodel || '',
          vehicleYearModel: item.vehicleyearmodel || '',
          city: item.city || '',
          phone: item.phone || item.Telefone || '',
          insuranceType: item.insurancetype || '',
          status: item.status || 'Pendente',
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
          usuarioId: item.usuarioId ? Number(item.usuarioId) : null,
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          // Ensure 'data' is always a valid ISO string.
          // If item.data is invalid, parseDateSafely will return a valid Date object (Jan 1, 1970)
          // and then toISOString() will work.
          data: parseDateSafely(item.data).toISOString(),
          responsavel: item.responsavel || '',
          editado: parseDateSafely(item.editado).toISOString() // Also make sure 'editado' is safe
        }));

        if (!leadSelecionado) {
          setLeads(formattedLeads);
        }
      } else {
        if (!leadSelecionado) {
          setLeads([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      if (!leadSelecionado) {
        setLeads([]);
      }
    }
  };

  // --- EFEITO PARA BUSCAR LEADS PENDENTES REGULARMENTE ---
  useEffect(() => {
    fetchLeadsFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, [leadSelecionado]);

  // --- FUNÇÃO PARA BUSCAR LEADS FECHADOS ---
  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS_URL);
      const data = await response.json();

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar leads fechados: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (Array.isArray(data)) {
        // Apply safe parsing to leadsFechados as well, if they have date fields that might be read
        const formattedFechados = data.map(item => ({
            ...item,
            Data: parseDateSafely(item.Data).toISOString() // Assuming 'Data' is the date field
        }));
        const reversedFechados = [...formattedFechados].reverse();
        setLeadsFechados(reversedFechados);
      } else {
        setLeadsFechados([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  };

  // --- EFEITO PARA BUSCAR LEADS FECHADOS REGULARMENTE ---
  useEffect(() => {
    fetchLeadsFechadosFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFechadosFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // --- FUNÇÃO PARA BUSCAR USUÁRIOS ---
  const fetchUsuariosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_USERS_URL);
      const data = await response.json();

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar usuários: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item) => ({
          id: item.id || '',
          usuario: item.usuario || '',
          nome: item.nome || '',
          email: item.email || '',
          senha: item.senha || '',
          status: item.status || 'Ativo',
          tipo: item.tipo || 'Usuario',
        }));
        setUsuarios(formattedUsuarios);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do Google Sheets:', error);
      setUsuarios([]);
    }
  };

  // --- EFEITO PARA BUSCAR USUÁRIOS REGULARMENTE ---
  useEffect(() => {
    fetchUsuariosFromSheet();

    const interval = setInterval(() => {
      fetchUsuariosFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const [ultimoFechadoId, setUltimoFechadoId] = useState(null);

  const adicionarUsuario = (usuario) => {
    setUsuarios((prev) => [...prev, { ...usuario, id: crypto.randomUUID() }]);
  };

  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
  });

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    const leadToUpdate = leads.find((lead) => lead.phone === phone);
    if (!leadToUpdate) return;

    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const jaExiste = prev.some((lead) => lead.phone === phone);

        if (jaExiste) {
          return prev.map((lead) =>
            lead.phone === phone ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
        } else {
          const leadParaAdicionar = {
            ID: leadToUpdate.id || crypto.randomUUID(),
            name: leadToUpdate.name,
            vehicleModel: leadToUpdate.vehicleModel,
            vehicleYearModel: leadToUpdate.vehicleYearModel,
            city: leadToUpdate.city,
            phone: leadToUpdate.phone,
            insurer: leadToUpdate.insuranceType || '',
            Data: parseDateSafely(leadToUpdate.data).toISOString(), // Ensure date is valid here too
            Responsavel: leadToUpdate.responsavel || '',
            Status: "Fechado",
            Seguradora: leadToUpdate.insurer || "",
            PremioLiquido: leadToUpdate.premioLiquido || "",
            Comissao: leadToUpdate.comissao || "",
            Parcelamento: leadToUpdate.parcelamento || "",
            confirmado: true
          };
          return [...prev, leadParaAdicionar];
        }
      });
    }

    const updatedLeadForScript = {
      ...leadToUpdate,
      status: novoStatus,
      confirmado: true,
      editado: new Date().toISOString(),
    };

    try {
      await fetch(`${GOOGLE_SHEETS_POST_URL}?v=alterar_status`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: updatedLeadForScript
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar atualização de status para o Apps Script:', error);
    }
  };

  const atualizarSeguradoraLead = (id, seguradora) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? { ...lead, insurer: seguradora }
          : lead
      )
    );
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leadsFechados.find((l) => l.ID == id);
    if (!lead) return;

    const updatedLeadLocal = {
      ...lead,
      Seguradora: seguradora,
      PremioLiquido: premio,
      Comissao: comissao,
      Parcelamento: parcelamento,
      insurerConfirmed: true,
    };

    setLeadsFechados((prev) =>
      prev.map((l) =>
        l.ID === id ? updatedLeadLocal : l
      )
    );

    try {
      await fetch(`${GOOGLE_SHEETS_POST_URL}?v=alterar_seguradora`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: updatedLeadLocal
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar detalhes de seguradora para o Apps Script:', error);
    }
  };

  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        lead.ID === id ? { ...lead, [campo]: valor } : lead
      )
    );
  };

  const transferirLead = async (leadId, responsavelId) => {
    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) return;

    let responsavelNome = null;
    let usuarioId = null;

    if (responsavelId !== null) {
      const usuario = usuarios.find((u) => u.id == responsavelId);
      if (!usuario) {
        console.warn(`Usuário com ID ${responsavelId} não encontrado.`);
        return;
      }
      responsavelNome = usuario.nome;
      usuarioId = usuario.id;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: responsavelNome, usuarioId: usuarioId } : lead
      )
    );

    const updatedLeadForScript = {
      ...leadToUpdate,
      responsavel: responsavelNome,
      usuarioId: usuarioId,
      editado: new Date().toISOString(),
    };

    try {
      await fetch(`${GOOGLE_SHEETS_POST_URL}?v=transferir_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: updatedLeadForScript
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao transferir lead para o Apps Script:', error);
    }
  };

  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    const updatedUsuario = { ...usuario };
    if (novoStatus !== null) updatedUsuario.status = novoStatus;
    if (novoTipo !== null) updatedUsuario.tipo = novoTipo;

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id ? updatedUsuario : u
      )
    );

    try {
      await fetch(`${GOOGLE_SHEETS_POST_URL}?v=alterar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          usuario: updatedUsuario
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário no Apps Script:', error);
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
    const usuarioEncontrado = usuarios.find(
      (u) => u.usuario === loginInput && u.senha === senhaInput && u.status === 'Ativo'
    );

    if (usuarioEncontrado) {
      setIsAuthenticated(true);
      setUsuarioLogado(usuarioEncontrado);
    } else {
      alert('Login ou senha inválidos ou usuário inativo.');
    }
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
      <Sidebar isAdmin={isAdmin} nomeUsuario={usuarioLogado} />

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                leadsClosed={
                  isAdmin
                    ? leadsFechados
                    : leadsFechados.filter((lead) => lead.Responsavel === usuarioLogado.nome)
                }
                leads={
                  isAdmin
                    ? leads
                    : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)
                }
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
              />
            }
          />
          <Route
            path="/leads-fechados"
            element={
              <LeadsFechados
                leads={isAdmin ? leadsFechados : leadsFechados.filter((lead) => lead.Responsavel === usuarioLogado.nome)}
                usuarios={usuarios}
                onUpdateInsurer={atualizarSeguradoraLead}
                onConfirmInsurer={confirmarSeguradoraLead}
                onUpdateDetalhes={atualizarDetalhesLeadFechado}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                isAdmin={isAdmin}
                ultimoFechadoId={ultimoFechadoId}
                onAbrirLead={onAbrirLead}
                leadSelecionado={leadSelecionado}
              />
            }
          />
          <Route
            path="/leads-perdidos"
            element={
              <LeadsPerdidos
                leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                usuarios={usuarios}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                onAbrirLead={onAbrirLead}
                isAdmin={isAdmin}
                leadSelecionado={leadSelecionado}
              />
            }
          />
          <Route path="/buscar-lead" element={<BuscarLead
                leads={leads}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                />} />
          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
              <Route
                path="/usuarios"
                element={
                  <Usuarios
                    leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                    usuarios={usuarios}
                    fetchLeadsFromSheet={fetchLeadsFromSheet}
                    fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                    atualizarStatusUsuario={atualizarStatusUsuario}
                  />
                }
              />
            </>
          )}
          <Route path="/ranking" element={<Ranking
                usuarios={usuarios}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                leads={leads} />} />
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
