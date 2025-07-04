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
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // INÍCIO - sincronização leads via Google Sheets
  const [leads, setLeads] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null); // movido para cá para usar no useEffect

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

        const formattedLeads = sortedData.map((item, index) => ({
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
        }
      } else {
        console.error('Dados de leads não são um array ou estão em formato inesperado:', data);
        if (!leadSelecionado) {
          setLeads([]); // Garante que é sempre um array
        }
      }
    } catch (error) {
      console.error('Erro ao buscar leads do Google Sheets:', error);
      if (!leadSelecionado) {
        setLeads([]); // Garante que é sempre um array
      }
    }
  };

  useEffect(() => {
    fetchLeadsFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, [leadSelecionado]);
  // FIM - sincronização leads


  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS);
      const data = await response.json();
      console.log("Leads Fechados Recebidos:", data);
      if (Array.isArray(data.data)) {
         setLeadsFechados(data.data);
      } else {
        console.error('Dados de leads fechados não são um array ou estão em formato inesperado:', data);
        setLeadsFechados([]); // Garante que é sempre um array
      }
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]); // Garante que é sempre um array
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

        if (Array.isArray(data.data)) {
          const formattedUsuarios = data.data.map((item, index) => ({
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
          setUsuarios([]); // Garante que é sempre um array
        }
      } catch (error) {
        console.error('Erro ao buscar usuários do Google Sheets:', error);
        setUsuarios([]); // Garante que é sempre um array
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
    setUsuarios((prev) => [...prev, { ...usuario, id: prev.length + 1 }]);
  };

  const adicionarLead = (lead) => {
    setLeads((prev) => [...prev, lead]);
  };


  const atualizarStatusLeadAntigo = (id, novoStatus, phone) => {
    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const atualizados = prev.map((leadsFechados) =>
          leadsFechados.phone === phone ? { ...leadsFechados, Status: novoStatus, confirmado: true } : leadsFechados
        );
        return atualizados;
      });
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    let leadParaAtualizar = leads.find((lead) => lead.phone === phone);

    if (!leadParaAtualizar) {
      console.warn("Lead não encontrado para atualização de status.");
      return;
    }

    const updatedLeadData = {
      id: String(leadParaAtualizar.id),
      name: leadParaAtualizar.name,
      vehicleModel: leadParaAtualizar.vehicleModel,
      vehicleYearModel: leadParaAtualizar.vehicleYearModel,
      city: leadParaAtualizar.city,
      phone: leadParaAtualizar.phone,
      insuranceType: leadParaAtualizar.insuranceType,
      status: novoStatus,
      confirmado: true,
      insurer: leadParaAtualizar.insurer,
      insurerConfirmed: leadParaAtualizar.insurerConfirmed,
      usuarioId: String(leadParaAtualizar.usuarioId || ''),
      premioLiquido: leadParaAtualizar.premioLiquido,
      comissao: leadParaAtualizar.comissao,
      parcelamento: leadParaAtualizar.parcelamento,
      data: leadParaAtualizar.createdAt,
      responsavel: leadParaAtualizar.responsavel,
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
        const jaExiste = prev.some((lead) => lead.phone === phone);

        if (jaExiste) {
          const atualizados = prev.map((lead) =>
            lead.phone === phone ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
          return atualizados;
        } else {
          const leadParaAdicionar = leads.find((lead) => lead.phone === phone);
          if (leadParaAdicionar) {
            const novoLeadFechado = {
              ID: leadParaAdicionar.id || crypto.randomUUID(),
              name: leadParaAdicionar.name,
              vehicleModel: leadParaAdicionar.vehicleModel,
              vehicleYearModel: leadParaAdicionar.vehicleYearModel,
              city: leadParaAdicionar.city,
              phone: leadParaAdicionar.phone,
              insurer: leadParaAdicionar.insuranceType || "",
              Data: leadParaAdicionar.createdAt || new Date().toISOString(),
              Responsavel: leadParaAdicionar.responsavel || "",
              Status: "Fechado",
              Seguradora: leadParaAdicionar.insurer || "",
              PremioLiquido: leadParaAdicionar.premioLiquido || "",
              Comissao: leadParaAdicionar.comissao || "",
              Parcelamento: leadParaAdicionar.parcelamento || "",
              id: leadParaAdicionar.id || null,
              usuario: leadParaAdicionar.usuario || "",
              nome: leadParaAdicionar.nome || "",
              email: leadParaAdicionar.email || "",
              senha: leadParaAdicionar.senha || "",
              status: leadParaAdicionar.status || "Ativo",
              tipo: leadParaAdicionar.tipo || "Usuario",
              "Ativo/Inativo": leadParaAdicionar["Ativo/Inativo"] || "Ativo",
              confirmado: true
            };
            return [...prev, novoLeadFechado];
          }
          console.warn("Lead não encontrado na lista principal para adicionar aos fechados.");
          return prev;
        }
      });
    }
  };


  const atualizarSeguradoraLead = (id, seguradora) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? limparCamposLead({ ...lead, insurer: seguradora })
          : lead
      )
    );
  };

  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
  });

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leadsFechados.find((lead) => lead.ID === id);

    if (!lead) {
      console.error("Lead fechado não encontrado para confirmação de seguradora.");
      return;
    }

    lead.Seguradora = seguradora;
    lead.PremioLiquido = premio;
    lead.Comissao = comissao;
    lead.Parcelamento = parcelamento;
    lead.insurerConfirmed = true;

    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        l.ID === id ? { ...lead } : l
      );
      return atualizados;
    });

    const updatedLeadDataForGAS = {
      id: String(lead.ID),
      insurer: seguradora,
      premioLiquido: premio,
      comissao: comissao,
      parcelamento: parcelamento,
      insurerConfirmed: true,
      status: lead.Status,
      name: lead.name,
      phone: lead.phone,
      vehicleModel: lead.vehicleModel,
      city: lead.city,
      responsavel: lead.Responsavel,
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
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, [campo]: valor } : lead
      )
    );
  };

  const transferirLead = async (leadId, responsavelId) => {
    let responsavelNome = null;
    if (responsavelId !== null) {
      let usuario = usuarios.find((u) => u.id == responsavelId);
      if (!usuario) {
        console.warn("Usuário responsável não encontrado para ID:", responsavelId);
        return;
      }
      responsavelNome = usuario.nome;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: responsavelNome } : lead
      )
    );

    try {
      const leadParaTransferir = leads.find(l => l.id === leadId);
      if (!leadParaTransferir) {
        console.error("Lead não encontrado para transferência:", leadId);
        return;
      }

      leadParaTransferir.responsavel = responsavelNome;
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
    const usuario = usuarios.find((usuario) => usuario.id === id);
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
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
              ...u,
              ...(novoStatus !== null ? { status: novoStatus } : {}),
              ...(novoTipo !== null ? { tipo: novoTipo } : {}),
            }
            : u
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status/tipo do usuário no Sheets:', error);
      alert('Erro ao atualizar status/tipo do usuário no servidor.');
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
                    ? (Array.isArray(leadsFechados) ? leadsFechados : [])
                    : (Array.isArray(leadsFechados) ? leadsFechados.filter((lead) => lead.Responsavel === usuarioLogado.nome) : [])
                }
                leads={
                  isAdmin
                    ? (Array.isArray(leads) ? leads : [])
                    : (Array.isArray(leads) ? leads.filter((lead) => lead.responsavel === usuarioLogado.nome) : [])
                }
                usuarioLogado={usuarioLogado}
              />
            }
          />
          <Route
            path="/leads"
            element={
              <Leads
                leads={isAdmin ? (Array.isArray(leads) ? leads : []) : (Array.isArray(leads) ? leads.filter((lead) => lead.responsavel === usuarioLogado.nome) : [])}
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
                leads={isAdmin ? (Array.isArray(leadsFechados) ? leadsFechados : []) : (Array.isArray(leadsFechados) ? leadsFechados.filter((lead) => lead.Responsavel === usuarioLogado.nome) : [])}
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
                leads={isAdmin ? (Array.isArray(leads) ? leads : []) : (Array.isArray(leads) ? leads.filter((lead) => lead.responsavel === usuarioLogado.nome) : [])}
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
                leads={Array.isArray(leads) ? leads : []} // Adiciona verificação aqui também
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
              />
            }
          />

          <Route
            path="/criar-lead"
            element={<CriarLead adicionarLead={adicionarLead} />}
          />

          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
              <Route
                path="/usuarios"
                element={
                  <Usuarios
                    leads={isAdmin ? (Array.isArray(leads) ? leads : []) : (Array.isArray(leads) ? leads.filter((lead) => lead.responsavel === usuarioLogado.nome) : [])}
                    usuarios={Array.isArray(usuarios) ? usuarios : []} // Adiciona verificação aqui
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
                usuarios={Array.isArray(usuarios) ? usuarios : []} // Adiciona verificação aqui
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                leads={Array.isArray(leads) ? leads : []} // Adiciona verificação aqui
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
