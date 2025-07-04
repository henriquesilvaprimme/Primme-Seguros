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

// --- URLs do Google Apps Script ---
// URL base da sua nova implantação do Apps Script
const GOOGLE_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// URLs específicas usando a base
const GOOGLE_SHEETS_LEADS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=getLeads`; // Para buscar leads
const GOOGLE_SHEETS_USERS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=pegar_usuario`; // Para buscar usuários
const GOOGLE_SHEETS_LEADS_FECHADOS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=pegar_clientes_fechados`; // Para buscar leads fechados

// URL para ações POST (criar/salvar/transferir/alterar), usando a URL base
const GOOGLE_SHEETS_POST_ACTION_URL = `${GOOGLE_SCRIPT_BASE_URL}`;


const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Estado para armazenar os usuários carregados do Google Sheet
  const [usuarios, setUsuarios] = useState([]);

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
      console.log("Fetching leads from:", GOOGLE_SHEETS_LEADS_API); // Debug log
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
        console.warn("Dados de leads não são um array:", data); // Warning for non-array data
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
      console.log("Fetching closed leads from:", GOOGLE_SHEETS_LEADS_FECHADOS_API); // Debug log
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
  };

  useEffect(() => {
    fetchLeadsFechadosFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFechadosFromSheet();
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, []);

  // --- Lógica de Carregamento e Autenticação de Usuários ---
  useEffect(() => {
    const fetchUsuariosFromSheet = async () => {
      try {
        console.log("Tentando buscar usuários de:", GOOGLE_SHEETS_USERS_API); // Debug log
        const response = await fetch(GOOGLE_SHEETS_USERS_API);

        if (!response.ok) {
          console.error(`HTTP error fetching users: ${response.status} - ${response.statusText}`);
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Usuários Recebidos no Frontend (para login):", data);

        if (Array.isArray(data)) {
          const formattedUsuarios = data.map((item) => ({
            id: String(item.id || ''), // Garante que seja string
            usuario: String(item.usuario || ''), // Garante que seja string
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
    };

    fetchUsuariosFromSheet();

    const interval = setInterval(() => {
      fetchUsuariosFromSheet();
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, []);

  const [ultimoFechadoId, setUltimoFechadoId] = useState(null);

  const adicionarUsuario = (usuario) => {
    // Isso adiciona localmente, o salvamento no Sheets deve ser feito dentro do CriarUsuario
    setUsuarios((prev) => [...prev, { ...usuario, id: String(prev.length + 1) }]); // Converte ID para string
  };

  // Função para adicionar um NOVO LEAD
  const adicionarLead = (lead) => {
    setLeads((prev) => [...prev, lead]); // Adiciona o lead à lista local
    // O salvamento no Sheets é feito dentro do CriarLead
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
    // Primeiro, atualiza o estado local para uma resposta mais rápida na UI
    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    let leadParaAtualizar = leads.find((lead) => lead.phone === phone);

    if (!leadParaAtualizar) {
      console.warn("Lead não encontrado para atualização de status.");
      // Se não encontrou, talvez deva reverter o estado ou buscar novamente
      fetchLeadsFromSheet();
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
      status: novoStatus, // Novo status
      confirmado: true, // Sempre true ao atualizar o status
      insurer: leadParaAtualizar.insurer,
      insurerconfirmed: leadParaAtualizar.insurerConfirmed,
      usuarioid: leadParaAtualizar.usuarioId,
      premioliquido: leadParaAtualizar.premioLiquido,
      comissao: leadParaAtualizar.comissao,
      parcelamento: leadParaAtualizar.parcelamento,
      data: leadParaAtualizar.createdAt,
      responsavel: leadParaAtualizar.responsavel,
      editado: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) // Formato BR e fuso horário
    };

    try {
      // Usa a URL base do Apps Script com o parâmetro 'action=salvar_lead'
      console.log("Enviando atualização de status do lead para:", `${GOOGLE_SHEETS_POST_ACTION_URL}?action=salvar_lead`);
      const response = await fetch(`${GOOGLE_SHEETS_POST_ACTION_URL}?action=salvar_lead`, {
        method: 'POST',
        mode: 'no-cors', // Necessário para evitar erro CORS em algumas configurações, mas impede ver a resposta
        body: JSON.stringify(updatedLeadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Se mode for 'no-cors', response.ok sempre será true, então não podemos verificar o sucesso diretamente aqui.
      // O sucesso deve ser verificado pelos logs do Google Apps Script.
      console.log(`Status do lead ${id} (${phone}) atualizado para ${novoStatus} no Sheets. (Verifique logs do GAS para confirmação)`);
      fetchLeadsFromSheet(); // Re-busca para garantir a sincronização
      fetchLeadsFechadosFromSheet(); // Re-busca para leads fechados

    } catch (error) {
      console.error('Erro ao atualizar status do lead no Sheets:', error);
      alert('Erro ao atualizar status do lead no servidor. Por favor, tente novamente.');
    }

    // Lógica para leads fechados (atualização local)
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
            // Garante que o ID é string e o status/tipo são corretamente mapeados
            const novoLeadFechado = {
              ID: String(leadParaAdicionar.id || crypto.randomUUID()),
              name: leadParaAdicionar.name,
              vehicleModel: leadParaAdicionar.vehicleModel,
              vehicleYearModel: leadParaAdicionar.vehicleYearModel,
              city: leadParaAdicionar.city,
              phone: leadParaAdicionar.phone,
              insurer: leadParaAdicionar.insuranceType || "",
              Data: leadParaAdicionar.createdAt || new Date().toISOString(),
              Responsavel: leadParaAdicionar.responsavel || "",
              Status: "Fechado",
              Seguradora: leadParaAdicionar.Seguradora || "",
              PremioLiquido: leadParaAdicionar.premioLiquido || "",
              Comissao: leadParaAdicionar.Comissao || "", // Corrigido para Comissao (com C maiúsculo)
              Parcelamento: leadParaAdicionar.Parcelamento || "", // Corrigido para Parcelamento (com P maiúsculo)
              id: String(leadParaAdicionar.id || null), // Garante que seja string
              usuario: leadParaAdicionar.usuario || "",
              nome: leadParaAdicionar.nome || "",
              email: leadParaAdicionar.email || "",
              senha: leadParaAdicionar.senha || "",
              status: leadParaAdicionar.status || "Ativo",
              tipo: leadParaAdicionar.tipo || "Usuario",
              "Ativo/Inativo": leadParaAdicionar["Ativo/Inativo"] || "Ativo", // Este campo parece vir do sheet de usuários, talvez remover se não for relevante para leads
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
    const lead = leadsFechados.find((lead) => String(lead.ID) === String(id)); // Garante comparação de string

    if (!lead) {
      console.error("Lead fechado não encontrado para confirmação de seguradora.");
      return;
    }

    // Atualiza o objeto lead antes de enviá-lo
    lead.Seguradora = seguradora;
    lead.PremioLiquido = premio;
    lead.Comissao = comissao;
    lead.Parcelamento = parcelamento;
    lead.insurerConfirmed = true;

    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        String(l.ID) === String(id) ? { ...lead } : l // Garante comparação de string
      );
      return atualizados;
    });

    try {
      // Usa a URL base do Apps Script com o parâmetro 'action=alterar_seguradora'
      console.log("Enviando confirmação de seguradora para:", `${GOOGLE_SHEETS_POST_ACTION_URL}?action=alterar_seguradora`);
      await fetch(`${GOOGLE_SHEETS_POST_ACTION_URL}?action=alterar_seguradora`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: lead }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Seguradora e detalhes do lead fechado atualizados no Sheets. (Verifique logs do GAS)');
      fetchLeadsFechadosFromSheet(); // Re-busca para garantir a sincronização
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
      let usuario = usuarios.find((u) => String(u.id) === String(responsavelId)); // Garante comparação de string
      if (!usuario) {
        console.warn("Usuário responsável não encontrado para ID:", responsavelId);
        alert("Usuário responsável não encontrado. Verifique a lista de usuários.");
        return;
      }
      responsavelNome = usuario.nome;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(leadId) ? { ...lead, responsavel: responsavelNome } : lead // Garante comparação de string
      )
    );

    try {
      const leadParaTransferir = leads.find(l => String(l.id) === String(leadId)); // Garante comparação de string
      if (!leadParaTransferir) {
        console.error("Lead não encontrado para transferência:", leadId);
        return;
      }

      // Atualiza o responsavel no objeto antes de enviá-lo
      leadParaTransferir.responsavel = responsavelNome;
      leadParaTransferir.editado = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }); // Atualiza data de edição

      // Usa a URL base do Apps Script com o parâmetro 'action=transferir_lead'
      console.log("Enviando transferência de lead para:", `${GOOGLE_SHEETS_POST_ACTION_URL}?action=transferir_lead`);
      await fetch(`${GOOGLE_SHEETS_POST_ACTION_URL}?action=transferir_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: leadParaTransferir }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Lead ${leadId} transferido para ${responsavelNome || 'Ninguém'} no Sheets. (Verifique logs do GAS)`);
      fetchLeadsFromSheet(); // Re-busca para garantir a sincronização
    } catch (error) {
      console.error('Erro ao transferir lead no Sheets:', error);
      alert('Erro ao transferir lead no servidor.');
    }
  };


  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((usuario) => String(usuario.id) === String(id)); // Garante comparação de string
    if (!usuario) {
      console.warn("Usuário não encontrado para atualização de status/tipo.");
      return;
    }

    const usuarioAtualizado = { ...usuario };
    if (novoStatus !== null) usuarioAtualizado.status = novoStatus;
    if (novoTipo !== null) usuarioAtualizado.tipo = novoTipo;

    try {
      // Usa a URL base do Apps Script com o parâmetro 'action=salvar_usuario'
      console.log("Enviando atualização de status/tipo do usuário para:", `${GOOGLE_SHEETS_POST_ACTION_URL}?action=salvar_usuario`);
      await fetch(`${GOOGLE_SHEETS_POST_ACTION_URL}?action=salvar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          usuario: usuarioAtualizado
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status/Tipo do usuário ${id} atualizado no Sheets. (Verifique logs do GAS)`);
      // Atualiza o estado local após o sucesso da API
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

  // --- Lógica de Login Aprimorada com Debug Logs e .trim() ---
  const handleLogin = () => {
    console.log("-----------------------------------");
    console.log("Tentativa de Login Iniciada:");
    console.log("Login digitado (input):", loginInput);
    console.log("Senha digitada (input):", senhaInput);
    console.log("Usuários carregados no estado 'usuarios':", usuarios);
    console.log("-----------------------------------");

    const usuarioEncontrado = usuarios.find(
      (u) => {
        // Logs detalhados para depuração de cada comparação
        const isUserMatch = u.usuario.trim() === loginInput.trim();
        const isPassMatch = u.senha.trim() === senhaInput.trim();
        const isActive = u.status.trim() === 'Ativo'; // Confere se o status é 'Ativo' (com 'A' maiúsculo)

        console.log(`Comparando usuário: '${u.usuario.trim()}' (Sheet) === '${loginInput.trim()}' (Input) -> Match User: ${isUserMatch}`);
        console.log(`Comparando senha:   '${u.senha.trim()}' (Sheet) === '${senhaInput.trim()}' (Input) -> Match Pass: ${isPassMatch}`);
        console.log(`Comparando status:  '${u.status.trim()}' (Sheet) === 'Ativo' -> Is Active: ${isActive}`);

        return isUserMatch && isPassMatch && isActive;
      }
    );

    if (usuarioEncontrado) {
      setIsAuthenticated(true);
      setUsuarioLogado(usuarioEncontrado);
      console.log("Login bem-sucedido! Usuário logado:", usuarioEncontrado);
      navigate('/dashboard'); // Redireciona para o dashboard após o login
    } else {
      alert('Login ou senha inválidos, ou usuário inativo.');
      console.log("Falha no login: Usuário não encontrado, senha incorreta ou inativo.");
    }
  };

  // --- Componente de Rota Privada ---
  // Certifique-se de que todas as rotas que exigem login estejam envolvidas por este componente.
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

  const isAdmin = usuarioLogado?.tipo === 'Admin'; // Verifica se o usuário logado é 'Admin'

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Passa `usuarioLogado` completo para Sidebar, não apenas o nome */}
      <Sidebar isAdmin={isAdmin} usuarioLogado={usuarioLogado} />

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          {/* Rota raiz redireciona para dashboard se autenticado */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Rotas protegidas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
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
              </PrivateRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <PrivateRoute>
                <Leads
                  leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
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
              </PrivateRoute>
            }
          />
          <Route
            path="/leads-perdidos"
            element={
              <PrivateRoute>
                <LeadsPerdidos
                  leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
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

          {/* Rota para Criar Lead */}
          <Route
            path="/criar-lead"
            element={<PrivateRoute><CriarLead adicionarLead={adicionarLead} googleSheetsPostUrl={GOOGLE_SHEETS_POST_ACTION_URL} usuarioLogado={usuarioLogado} /></PrivateRoute>}
          />

          {/* Rotas de Administração (apenas para Admin) */}
          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<PrivateRoute><CriarUsuario adicionarUsuario={adicionarUsuario} googleSheetsPostUrl={GOOGLE_SHEETS_POST_ACTION_URL} /></PrivateRoute>} />
              <Route
                path="/usuarios"
                element={
                  <PrivateRoute>
                    <Usuarios
                      leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
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
                  leads={leads}
                />
              </PrivateRoute>
            }
          />
          {/* Catch-all para páginas não encontradas */}
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
