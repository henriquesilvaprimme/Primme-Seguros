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
import CriarLead from './pages/CriarLead';

// ATUALIZADAS PARA A NOVA URL DO SEU SCRIPT GAS
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec';

const GOOGLE_SHEETS_SCRIPT_URL = `${GOOGLE_SHEETS_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_USERS = GOOGLE_SHEETS_BASE_URL; // Ação 'pegar_usuario' é adicionada na chamada fetch
const GOOGLE_SHEETS_LEADS_FECHADOS = `${GOOGLE_SHEETS_BASE_URL}?v=pegar_clientes_fechados`;
const GOOGLE_SHEETS_LEAD_CREATION_URL = `${GOOGLE_SHEETS_BASE_URL}?action=criar_lead`; // Usado como base para todas as ações POST

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState(''); 
  const [usuarioLogado, setUsuarioLogado] = useState(null); // Pode ser null no início
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // INÍCIO - sincronização leads via Google Sheets
  const [leads, setLeads] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null); 

  const fetchLeadsFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      const data = await response.json();

      console.log("Dados de Leads Recebidos:", data);

      if (Array.isArray(data.data)) {
        const sortedData = data.data.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA;
        });

        const formattedLeads = sortedData.map((item) => ({ // Removido index, não é usado
          id: String(item.id || ''),
          name: item.name || '',
          vehicleModel: item.vehicleModel || '',
          vehicleYearModel: item.vehicleYearModel || '',
          city: item.city || '',
          phone: item.phone || '',
          insuranceType: item.insuranceType || '',
          status: item.status || 'Selecione o status',
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
          usuarioId: String(item.usuarioId || ''),
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          createdAt: item.data || new Date().toISOString(),
          responsavel: item.responsavel || '',
          editado: item.editado || ''
        }));

        console.log("Leads Formatados:", formattedLeads);

        if (!leadSelecionado || leadSelecionado.id !== formattedLeads.find(l => l.id === leadSelecionado.id)?.id) {
          setLeads(formattedLeads);
        } else {
          setLeads(formattedLeads); 
        }
      } else {
        console.error('Dados de leads não são um array ou estão em formato inesperado:', data);
        setLeads([]); 
      }
    } catch (error) {
      console.error('Erro ao buscar leads do Google Sheets:', error);
      setLeads([]); 
    }
  };

  useEffect(() => {
    fetchLeadsFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, [leadSelecionado]);


  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS);
      const data = await response.json();
      console.log("Leads Fechados Recebidos:", data);
      
      // GARANTIA FORTE: Se data.data não for um array, defina leadsFechados como array vazio.
      if (Array.isArray(data.data)) {
         setLeadsFechados(data.data);
      } else {
        console.error('Dados de leads fechados não são um array ou estão em formato inesperado:', data);
        setLeadsFechados([]); 
      }
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]); 
    }
  };

  useEffect(() => {
    fetchLeadsFechadosFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFechadosFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, []);


  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsuariosFromSheet = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_USERS + '?v=pegar_usuario');
        const data = await response.json();
        console.log("Usuários Recebidos:", data);

        // GARANTIA FORTE: Se data.data não for um array, defina usuarios como array vazio.
        if (Array.isArray(data.data)) {
          const formattedUsuarios = data.data.map((item) => ({ // Removido index, não é usado
            id: String(item.id || ''),
            usuario: item.usuario || '',
            nome: item.nome || '',
            email: item.email || '',
            senha: item.senha || '',
            status: item.status || 'Ativo',
            tipo: item.tipo || 'Usuario',
          }));
          setUsuarios(formattedUsuarios);
        } else {
          console.error('Dados de usuários não são um array ou estão em formato inesperado:', data);
          setUsuarios([]); 
        }
      } catch (error) {
        console.error('Erro ao buscar usuários do Google Sheets:', error);
        setUsuarios([]); 
      }
    };

    fetchUsuariosFromSheet();

    const interval = setInterval(() => {
      fetchUsuariosFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, []);


  const [ultimoFechadoId, setUltimoFechadoId] = useState(null);

  const adicionarUsuario = (usuario) => {
    setUsuarios((prev) => [...(Array.isArray(prev) ? prev : []), { ...usuario, id: (Array.isArray(prev) ? prev.length : 0) + 1 }]);
  };

  const adicionarLead = (lead) => {
    setLeads((prev) => [...(Array.isArray(prev) ? prev : []), lead]);
  };


  const atualizarStatusLeadAntigo = (id, novoStatus, phone) => {
    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const currentLeadsFechados = Array.isArray(prev) ? prev : [];
        const atualizados = currentLeadsFechados.map((lead) =>
          (lead && typeof lead.phone === 'string' && lead.phone === phone) ? { ...lead, Status: novoStatus, confirmado: true } : lead
        );
        return atualizados;
      });
    }

    setLeads((prev) => {
      const currentLeads = Array.isArray(prev) ? prev : [];
      return currentLeads.map((lead) =>
        (lead && typeof lead.phone === 'string' && lead.phone === phone) ? { ...lead, status: novoStatus, confirmado: true } : lead
      );
    });
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    setLeads((prev) => {
      const currentLeads = Array.isArray(prev) ? prev : [];
      return currentLeads.map((lead) =>
        (lead && typeof lead.phone === 'string' && lead.phone === phone) ? { ...lead, status: novoStatus, confirmado: true } : lead
      );
    });

    let leadParaAtualizar = Array.isArray(leads) ? leads.find((lead) => (lead && typeof lead.phone === 'string' && lead.phone === phone)) : null;

    if (!leadParaAtualizar) {
      console.warn("Lead não encontrado para atualização de status.");
      return;
    }

    const updatedLeadData = {
      id: String(leadParaAtualizar.id || ''),
      name: leadParaAtualizar.name || '',
      vehicleModel: leadParaAtualizar.vehicleModel || '',
      vehicleYearModel: leadParaAtualizar.vehicleYearModel || '',
      city: leadParaAtualizar.city || '',
      phone: leadParaAtualizar.phone || '',
      insuranceType: leadParaAtualizar.insuranceType || '',
      status: novoStatus,
      confirmado: true,
      insurer: leadParaAtualizar.insurer || '',
      insurerConfirmed: leadParaAtualizar.insurerConfirmed === 'true' || leadParaAtualizar.insurerConfirmed === true,
      usuarioId: String(leadParaAtualizar.usuarioId || ''),
      premioLiquido: leadParaAtualizar.premioLiquido || '',
      comissao: leadParaAtualizar.comissao || '',
      parcelamento: leadParaAtualizar.parcelamento || '',
      data: leadParaAtualizar.createdAt || new Date().toISOString(),
      responsavel: leadParaAtualizar.responsavel || '',
      editado: new Date().toISOString()
    };


    try {
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?action=salvar_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLeadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status do lead ${id} (${phone}) enviado para atualização no Sheets.`);
      fetchLeadsFromSheet();
      fetchLeadsFechadosFromSheet();

    } catch (error) {
      console.error('Erro ao atualizar status do lead no Sheets:', error);
      alert('Erro ao atualizar status do lead no servidor.');
    }

    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const currentLeadsFechados = Array.isArray(prev) ? prev : [];
        const jaExiste = currentLeadsFechados.some((lead) => (lead && typeof lead.phone === 'string' && lead.phone === phone));

        if (jaExiste) {
          const atualizados = currentLeadsFechados.map((lead) =>
            (lead && typeof lead.phone === 'string' && lead.phone === phone) ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
          return atualizados;
        } else {
          const leadParaAdicionar = Array.isArray(leads) ? leads.find((lead) => (lead && typeof lead.phone === 'string' && lead.phone === phone)) : null;
          if (leadParaAdicionar) {
            const novoLeadFechado = {
              ID: leadParaAdicionar.id || crypto.randomUUID(),
              name: leadParaAdicionar.name || '',
              vehicleModel: leadParaAdicionar.vehicleModel || '',
              vehicleYearModel: leadParaAdicionar.vehicleYearModel || '',
              city: leadParaAdicionar.city || '',
              phone: leadParaAdicionar.phone || '',
              insurer: leadParaAdicionar.insuranceType || "",
              Data: leadParaAdicionar.createdAt || new Date().toISOString(),
              Responsavel: leadParaAdicionar.responsavel || "",
              Status: "Fechado",
              Seguradora: leadParaAdicionar.insurer || "",
              PremioLiquido: leadParaAdicionar.premioLiquido || "",
              Comissao: leadParaAdicionar.comissao || "",
              Parcelamento: leadParaAdicionar.parcelamento || "",
              id: leadParaAdicionar.id || null, // Usar o ID do lead original se existir
              usuario: leadParaAdicionar.usuario || "",
              nome: leadParaAdicionar.nome || "",
              email: leadParaAdicionar.email || "",
              senha: leadParaAdicionar.senha || "",
              status: leadParaAdicionar.status || "Ativo",
              tipo: leadParaAdicionar.tipo || "Usuario",
              "Ativo/Inativo": leadParaAdicionar["Ativo/Inativo"] || "Ativo",
              confirmado: true
            };
            return [...currentLeadsFechados, novoLeadFechado];
          }
          console.warn("Lead não encontrado na lista principal para adicionar aos fechados.");
          return currentLeadsFechados;
        }
      });
    }
  };


  const atualizarSeguradoraLead = (id, seguradora) => {
    setLeads((prev) => {
      const currentLeads = Array.isArray(prev) ? prev : [];
      return currentLeads.map((lead) =>
        (lead && lead.id === id)
          ? limparCamposLead({ ...lead, insurer: seguradora })
          : lead
      );
    });
  };

  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
  });

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = Array.isArray(leadsFechados) ? leadsFechados.find((lead) => (lead && lead.ID === id)) : null;

    if (!lead) {
      console.error("Lead fechado não encontrado para confirmação de seguradora.");
      return;
    }

    // Certificando-se que as propriedades existem antes de atribuir
    lead.Seguradora = seguradora || '';
    lead.PremioLiquido = premio || '';
    lead.Comissao = comissao || '';
    lead.Parcelamento = parcelamento || '';
    lead.insurerConfirmed = true;

    setLeadsFechados((prev) => {
      const currentLeadsFechados = Array.isArray(prev) ? prev : [];
      const atualizados = currentLeadsFechados.map((l) =>
        (l && l.ID === id) ? { ...lead } : l
      );
      return atualizados;
    });

    const updatedLeadDataForGAS = {
      id: String(lead.ID || ''),
      insurer: seguradora || '',
      premioLiquido: premio || '',
      comissao: comissao || '',
      parcelamento: parcelamento || '',
      insurerConfirmed: true,
      status: lead.Status || '',
      name: lead.name || '',
      phone: lead.phone || '',
      vehicleModel: lead.vehicleModel || '',
      city: lead.city || '',
      responsavel: lead.Responsavel || '',
      editado: new Date().toISOString()
    };

    try {
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?action=alterar_seguradora`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLeadDataForGAS),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Seguradora e detalhes do lead fechado enviados para atualização no Sheets.');
      fetchLeadsFechadosFromSheet();
    } catch (error) {
      console.error('Erro ao enviar lead fechado para atualização de seguradora:', error);
      alert('Erro ao confirmar seguradora do lead no servidor.');
    }
  };

  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeads((prev) => {
      const currentLeads = Array.isArray(prev) ? prev : [];
      return currentLeads.map((lead) =>
        (lead && lead.id === id) ? { ...lead, [campo]: valor } : lead
      );
    });
  };

  const transferirLead = async (leadId, responsavelId) => {
    let responsavelNome = null;
    if (responsavelId !== null) {
      let usuario = Array.isArray(usuarios) ? usuarios.find((u) => (u && u.id == responsavelId)) : null; 
      if (!usuario) {
        console.warn("Usuário responsável não encontrado para ID:", responsavelId);
        return;
      }
      responsavelNome = usuario.nome;
    }

    setLeads((prev) => {
      const currentLeads = Array.isArray(prev) ? prev : [];
      return currentLeads.map((lead) =>
        (lead && lead.id === leadId) ? { ...lead, responsavel: responsavelNome || '' } : lead
      );
    });

    try {
      const leadParaTransferir = Array.isArray(leads) ? leads.find(l => (l && l.id === leadId)) : null; 
      if (!leadParaTransferir) {
        console.error("Lead não encontrado para transferência:", leadId);
        return;
      }

      leadParaTransferir.responsavel = responsavelNome || '';
      leadParaTransferir.editado = new Date().toISOString();

      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?action=transferir_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(leadParaTransferir),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Lead ${leadId} enviado para transferência para ${responsavelNome || 'Ninguém'} no Sheets.`);
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao transferir lead no Sheets:', error);
      alert('Erro ao transferir lead no servidor.');
    }
  };


  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = Array.isArray(usuarios) ? usuarios.find((usuario) => (usuario && usuario.id === id)) : null; 
    if (!usuario) return;

    const usuarioAtualizado = { ...usuario };
    if (novoStatus !== null) usuarioAtualizado.status = novoStatus;
    if (novoTipo !== null) usuarioAtualizado.tipo = novoTipo;

    try {
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?action=salvar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(usuarioAtualizado),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status/Tipo do usuário ${id} enviado para atualização no Sheets.`);
      setUsuarios((prev) => {
        const currentUsuarios = Array.isArray(prev) ? prev : [];
        return currentUsuarios.map((u) =>
          (u && u.id === id)
            ? {
              ...u,
              ...(novoStatus !== null ? { status: novoStatus } : {}),
              ...(novoTipo !== null ? { tipo: novoTipo } : {}),
            }
            : u
        );
      });
    } catch (error) {
      console.error('Erro ao atualizar status/tipo do usuário no Sheets:', error);
      alert('Erro ao atualizar status/tipo do usuário no servidor.');
    }
  };


  const onAbrirLead = (lead) => {
    setLeadSelecionado(lead);

    let path = '/leads';
    if (lead && lead.status === 'Fechado') path = '/leads-fechados';
    else if (lead && lead.status === 'Perdido') path = '/leads-perdidos';

    navigate(path);
  };

  const handleLogin = () => {
    const usuarioEncontrado = Array.isArray(usuarios) ? usuarios.find(
      (u) => (u && typeof u.usuario === 'string' && u.usuario === loginInput && typeof u.senha === 'string' && u.senha === senhaInput && u.status === 'Ativo')
    ) : null;

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

  // Define isAdmin com base em usuarioLogado ser um objeto e ter a propriedade 'tipo'
  const isAdmin = usuarioLogado && usuarioLogado.tipo === 'Admin';

  const filterLeadsByResponsavel = (leadsList) => {
    // Garante que leadsList é um array antes de filtrar
    if (!Array.isArray(leadsList)) {
        console.warn("leadsList não é um array na função filterLeadsByResponsavel.");
        return [];
    }
    // Garante que usuarioLogado existe e que usuarioLogado.nome é uma string
    if (usuarioLogado && typeof usuarioLogado.nome === 'string') {
      return leadsList.filter((lead) => (lead && typeof lead.responsavel === 'string' && lead.responsavel === usuarioLogado.nome));
    }
    return [];
  };

  const filterLeadsFechadosByResponsavel = (leadsFechadosList) => {
    // Garante que leadsFechadosList é um array antes de filtrar
    if (!Array.isArray(leadsFechadosList)) {
        console.warn("leadsFechadosList não é um array na função filterLeadsFechadosByResponsavel.");
        return [];
    }
    // Garante que usuarioLogado existe e que usuarioLogado.nome é uma string
    if (usuarioLogado && typeof usuarioLogado.nome === 'string') {
      return leadsFechadosList.filter((lead) => (lead && typeof lead.Responsavel === 'string' && lead.Responsavel === usuarioLogado.nome));
    }
    return [];
  };

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
                leadsClosed={isAdmin ? leadsFechados : filterLeadsFechadosByResponsavel(leadsFechados)}
                leads={isAdmin ? leads : filterLeadsByResponsavel(leads)}
                usuarioLogado={usuarioLogado}
              />
            }
          />
          <Route
            path="/leads"
            element={
              <Leads
                leads={isAdmin ? leads : filterLeadsByResponsavel(leads)}
                usuarios={Array.isArray(usuarios) ? usuarios : []}
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
                leads={isAdmin ? leadsFechados : filterLeadsFechadosByResponsavel(leadsFechados)}
                usuarios={Array.isArray(usuarios) ? usuarios : []}
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
                leads={isAdmin ? leads : filterLeadsByResponsavel(leads)}
                usuarios={Array.isArray(usuarios) ? usuarios : []}
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
                leads={Array.isArray(leads) ? leads : []}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
              />
            }
          />

          <Route
            path="/criar-lead"
            element={<CriarLead adicionarLead={adicionarLead} />}
          />

          {/* Somente renderiza rotas de admin se isAdmin for verdadeiro */}
          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
              <Route
                path="/usuarios"
                element={
                  <Usuarios
                    leads={isAdmin ? leads : []} // Para o componente Usuarios, leads é sempre todos se for admin
                    usuarios={Array.isArray(usuarios) ? usuarios : []}
                    fetchLeadsFromSheet={fetchLeadsFromSheet}
                    fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                    atualizarStatusUsuario={atualizarStatusUsuario}
                  />
                }
              />
            </>
          )}
          <Route
            path="/ranking"
            element={
              <Ranking
                usuarios={Array.isArray(usuarios) ? usuarios : []}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                leads={Array.isArray(leads) ? leads : []}
              />
            }
          />
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
