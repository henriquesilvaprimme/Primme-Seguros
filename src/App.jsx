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
import CriarLead from './pages/CriarLead'; // Importa o novo componente CriarLead

// --- URL BASE DO SEU APP WEB GOOGLE APPS SCRIPT ---
// Esta é a URL principal para todas as suas requisições GAS
const GAS_BASE_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec';

// As URLs específicas agora usam a base e adicionam os parâmetros de ação
const GOOGLE_SHEETS_SCRIPT_URL = `${GAS_BASE_URL}?v=getLeads`; // Para buscar leads ativos/gerais
const GOOGLE_SHEETS_USERS = GAS_BASE_URL; // A URL base será usada para criar/buscar usuários com os parâmetros corretos
const GOOGLE_SHEETS_LEADS_FECHADOS = `${GAS_BASE_URL}?v=pegar_clientes_fechados`; // Para buscar leads fechados

// Esta é a URL para o CriarLead.jsx. Ele usa a URL base sem um 'v' ou 'action' específico no URL,
// pois o Apps Script deve inferir a ação pela ausência do parâmetro 'v' (ou pelo 'action' no body, se preferir uma abordagem mais explícita no body).
// No seu App.jsx, quando você faz POSTs para salvar/atualizar, usará a URL base e adicionará 'action' como parâmetro.
const GOOGLE_SHEETS_LEAD_ACTION_URL = GAS_BASE_URL; // Renomeado para ser mais genérico para ações de lead

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
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL); // Usa sua URL com ?v=getLeads
      const data = await response.json();

      console.log("Dados de Leads Recebidos:", data);

      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA; // decrescente (mais recente no topo)
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

        if (!leadSelecionado || leadSelecionado.id !== formattedLeads.find(l => l.id === leadSelecionado.id)?.id) {
          setLeads(formattedLeads);
        }
      } else {
        if (!leadSelecionado) {
          setLeads([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar leads do Google Sheets:', error);
      if (!leadSelecionado) {
        setLeads([]);
      }
    }
  };

  useEffect(() => {
    fetchLeadsFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, [leadSelecionado]);
  // FIM - sincronização leads


  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS); // Usa sua URL com ?v=pegar_clientes_fechados
      const data = await response.json();
      console.log("Leads Fechados Recebidos:", data);
      setLeadsFechados(data);
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  };

  useEffect(() => {
    fetchLeadsFechadosFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFechadosFromSheet();
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, []);


  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsuariosFromSheet = async () => {
      try {
        const response = await fetch(`${GOOGLE_SHEETS_USERS}?v=pegar_usuario`); // Usa sua URL base + ?v=pegar_usuario
        const data = await response.json();
        console.log("Usuários Recebidos:", data);

        if (Array.isArray(data)) {
          const formattedUsuarios = data.map((item, index) => ({
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

    fetchUsuariosFromSheet();

    const interval = setInterval(() => {
      fetchUsuariosFromSheet();
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, []);


  const [ultimoFechadoId, setUltimoFechadoId] = useState(null);

  const adicionarUsuario = (usuario) => {
    // Adiciona o usuário localmente. O salvamento no Sheets é feito dentro do CriarUsuario.jsx.
    setUsuarios((prev) => [...prev, { ...usuario, id: prev.length + 1 }]);
    // Após adicionar, pode ser útil recarregar os usuários para garantir a sincronização com o Sheet
    // fetchUsuariosFromSheet(); // Descomente se preferir recarregar imediatamente
  };

  // Função para adicionar um NOVO LEAD
  const adicionarLead = (lead) => {
    // Adiciona o lead localmente. O salvamento no Sheets é feito dentro do CriarLead.jsx.
    setLeads((prev) => [...prev, lead]);
    // Após adicionar, pode ser útil recarregar os leads para garantir a sincronização com o Sheet
    // fetchLeadsFromSheet(); // Descomente se preferir recarregar imediatamente
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
    // Atualiza o estado local imediatamente para feedback visual
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
      id: leadParaAtualizar.id,
      name: leadParaAtualizar.name,
      vehiclemodel: leadParaAtualizar.vehicleModel,
      vehicleyearmodel: leadParaAtualizar.vehicleYearModel,
      city: leadParaAtualizar.city,
      phone: leadParaAtualizar.phone,
      insurancetype: leadParaAtualizar.insuranceType,
      status: novoStatus,
      confirmado: true, // Ou algum valor dinâmico se for o caso
      insurer: leadParaAtualizar.insurer,
      insurerconfirmed: leadParaAtualizar.insurerConfirmed,
      usuarioid: leadParaAtualizar.usuarioId,
      premioliquido: leadParaAtualizar.premioLiquido,
      comissao: leadParaAtualizar.comissao,
      parcelamento: leadParaAtualizar.parcelamento,
      data: leadParaAtualizar.createdAt,
      responsavel: leadParaAtualizar.responsavel,
      editado: new Date().toLocaleString()
    };


    try {
      // Usa a URL base do Apps Script com o parâmetro 'action=salvar_lead'
      await fetch(`${GAS_BASE_URL}?action=salvar_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLeadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status do lead ${id} (${phone}) atualizado para ${novoStatus} no Sheets.`);
      fetchLeadsFromSheet(); // Recarrega os leads para garantir a sincronização
      fetchLeadsFechadosFromSheet(); // Recarrega os leads fechados também, caso o status tenha mudado para "Fechado"

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
              ID: leadParaAdicionar.id || crypto.randomUUID(), // Use crypto.randomUUID() para IDs robustos se 'id' não existir
              name: leadParaAdicionar.name,
              vehicleModel: leadParaAdicionar.vehicleModel,
              vehicleYearModel: leadParaAdicionar.vehicleYearModel,
              city: leadParaAdicionar.city,
              phone: leadParaAdicionar.phone,
              insurer: leadParaAdicionar.insuranceType || "", // Note que aqui 'insurer' está pegando de 'insuranceType'
              Data: leadParaAdicionar.createdAt || new Date().toISOString(),
              Responsavel: leadParaAdicionar.responsavel || "",
              Status: "Fechado",
              Seguradora: leadParaAdicionar.Seguradora || "",
              PremioLiquido: leadParaAdicionar.premioLiquido || "",
              Comissao: leadParaAdicionar.comissao || "",
              Parcelamento: leadParaAdicionar.parcelamento || "",
              id: leadParaAdicionar.id || null, // Garante que o ID original esteja aqui se existir
              // Os campos abaixo provavelmente não são relevantes para leads fechados, mas mantidos para compatibilidade
              usuario: leadParaAdicionar.usuario || "",
              nome: leadParaAdicionar.nome || "",
              email: leadParaAdicionar.email || "",
              senha: leadParaAdicionar.senha || "",
              status: leadParaAdicionar.status || "Ativo", // Isso pode ser redundante com Status: "Fechado"
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

    // Atualiza os dados localmente
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

    try {
      // Usa a URL base do Apps Script com o parâmetro 'action=alterar_seguradora'
      await fetch(`${GAS_BASE_URL}?action=alterar_seguradora`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: lead }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Seguradora e detalhes do lead fechado atualizados no Sheets.');
      fetchLeadsFechadosFromSheet(); // Recarrega os leads fechados para garantir a sincronização
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
      let usuario = usuarios.find((u) => u.id == responsavelId); // Note o uso de '==' para comparar string com number
      if (!usuario) {
        console.warn("Usuário responsável não encontrado para ID:", responsavelId);
        return;
      }
      responsavelNome = usuario.nome;
    }

    // Atualiza o estado local imediatamente
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

      // Garante que o objeto enviado tenha o responsável atualizado
      const transferData = {
        ...leadParaTransferir,
        responsavel: responsavelNome
      };

      // Usa a URL base do Apps Script com o parâmetro 'action=transferir_lead'
      await fetch(`${GAS_BASE_URL}?action=transferir_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: transferData }), // Envia o lead completo com o responsável atualizado
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Lead ${leadId} transferido para ${responsavelNome || 'Ninguém'} no Sheets.`);
      fetchLeadsFromSheet(); // Recarrega os leads para garantir a sincronização
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
      // Usa a URL base do Apps Script com o parâmetro 'action=salvar_usuario'
      await fetch(`${GAS_BASE_URL}?action=salvar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          usuario: usuarioAtualizado
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status/Tipo do usuário ${id} atualizado no Sheets.`);
      // Atualiza o estado local após o sucesso da chamada ao GAS
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
          <Route
            path="/buscar-lead"
            element={
              <BuscarLead
                leads={leads}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
              />
            }
          />

          {/* Rota para Criar Lead */}
          <Route
            path="/criar-lead"
            element={<CriarLead adicionarLead={adicionarLead} />} // Passa a função adicionarLead
          />

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
          <Route
            path="/ranking"
            element={
              <Ranking
                usuarios={usuarios}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                leads={leads}
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
