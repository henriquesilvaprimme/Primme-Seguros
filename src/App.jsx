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
  const [erroLogin, setErroLogin] = useState(''); // Novo estado para exibir erro de login
  
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
  const [leadsFechados, setLeadsFechados] = useState([]); // Será filtrado de 'leads' ou terá sua própria fetch
  const [leadsPerdidos, setLeadsPerdidos] = useState([]); // Será filtrado de 'leads'
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null); // Para detalhes de um lead específico

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
    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?v=getLeads`);
      const responseText = await response.text(); // Pega como texto primeiro para depuração
      console.log("Resposta bruta Leads:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Erro ao parsear JSON de Leads:", e, responseText);
        setLeads([]); // Limpa leads em caso de erro de parsing
        return;
      }

      console.log("Dados de Leads Recebidos:", data);

      if (data && data.success && Array.isArray(data.data)) {
        const sortedData = data.data.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA; // decrescente (mais recente no topo)
        });

        // Adaptação para o formato esperado pelo frontend
        const formattedLeads = sortedData.map((item) => ({
          id: Number(item.id),
          name: item.name || '',
          vehicleModel: item.vehiclemodel || '', // Mantenha camelCase aqui
          vehicleYearModel: item.vehicleyearmodel || '', // Mantenha camelCase aqui
          city: item.city || '',
          phone: item.phone || '',
          insuranceType: item.insurancetype || '', // Mantenha camelCase aqui
          status: item.status || 'Pendente', // Default para 'Pendente'
          confirmado: item.confirmado === true, // Garante que é booleano
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerconfirmed === true, // Garante que é booleano
          usuarioId: Number(item.usuarioid),
          premioLiquido: Number(item.premioliquido) || 0,
          comissao: Number(item.comissao) || 0,
          parcelamento: item.parcelamento || '',
          createdAt: item.data || new Date().toISOString(), // Use ISO string
          responsavel: item.responsavel || '',
          editado: item.editado || '' // Use ISO string
        }));

        setLeads(formattedLeads);
        // Filtra leads fechados e perdidos a partir da lista principal
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
  }, []); // Dependências vazias, esta função só precisa ser criada uma vez

  const fetchUsuariosFromSheet = useCallback(async () => {
    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?v=pegar_usuario`);
      const responseText = await response.text(); // Pega como texto para depuração
      console.log("Resposta bruta Usuários:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Erro ao parsear JSON de Usuários:", e, responseText);
        setUsuarios([]); // Limpa usuários em caso de erro de parsing
        return;
      }

      console.log("Usuários Recebidos:", data);

      if (data && data.success && Array.isArray(data.data)) {
        const formattedUsuarios = data.data.map((item) => ({
          id: Number(item.id), // Garante que ID é número
          usuario: item.usuario || '',
          nome: item.nome || '',
          email: item.email || '',
          senha: item.senha || '',
          status: item.status || 'Ativo', // Default para 'Ativo'
          tipo: item.tipo || 'Usuario', // Default para 'Usuario'
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
  }, []); // Dependências vazias

  // Efeitos para carregar dados ao montar o componente e a cada minuto
  useEffect(() => {
    fetchLeadsFromSheet(); // Busca leads (que filtra fechados e perdidos)
    fetchUsuariosFromSheet(); // Busca usuários

    const intervalLeads = setInterval(fetchLeadsFromSheet, 60000);
    const intervalUsuarios = setInterval(fetchUsuariosFromSheet, 60000);

    return () => {
      clearInterval(intervalLeads);
      clearInterval(intervalUsuarios);
    };
  }, [fetchLeadsFromSheet, fetchUsuariosFromSheet]); // Dependências das funções useCallback


  // --- Funções para manipulação de dados locais e comunicação com Apps Script ---

  // Função para adicionar um NOVO LEAD (chamada do CriarLead.jsx)
  const adicionarLead = (lead) => {
    setLeads((prev) => [...prev, lead]); // Adiciona o lead à lista local
    fetchLeadsFromSheet(); // Recarrega do Sheets para garantir sincronia
  };

  // Função para adicionar um NOVO USUÁRIO (chamada do CriarUsuario.jsx)
  const adicionarUsuario = (usuario) => {
    setUsuarios((prev) => [...prev, usuario]); // Adiciona o usuário à lista local
    fetchUsuariosFromSheet(); // Recarrega do Sheets para garantir sincronia
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    let leadParaAtualizar = leads.find((lead) => lead.phone === phone);

    if (!leadParaAtualizar) {
      console.warn("Lead não encontrado para atualização de status:", phone);
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
      confirmado: true, // Sempre setar como true ao mudar status
      insurer: leadParaAtualizar.insurer,
      insurerconfirmed: leadParaAtualizar.insurerConfirmed,
      usuarioid: leadParaAtualizar.usuarioId,
      premioliquido: leadParaAtualizar.premioLiquido,
      comissao: leadParaAtualizar.comissao,
      parcelamento: leadParaAtualizar.parcelamento,
      data: leadParaAtualizar.createdAt,
      responsavel: leadParaAtualizar.responsavel,
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
      const responseText = await response.text();
      const responseData = JSON.parse(responseText); // Parseia a resposta
      console.log(`Resposta do Sheets para atualização de status do lead ${id}:`, responseData);

      if (responseData.success) {
        console.log(`Status do lead ${id} (${phone}) atualizado para ${novoStatus} no Sheets.`);
        fetchLeadsFromSheet(); // Recarrega todos os leads para atualizar a UI
      } else {
        alert('Erro ao atualizar status do lead no servidor: ' + responseData.error);
        console.error('Erro na API ao atualizar status do lead:', responseData.error);
      }
    } catch (error) {
      console.error('Erro ao chamar API para atualizar status do lead:', error);
      alert('Erro ao atualizar status do lead no servidor.');
    }
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leads.find((lead) => lead.id === id); // Busca na lista principal de leads

    if (!lead) {
      console.error("Lead não encontrado para confirmação de seguradora (ID):", id);
      return;
    }

    const updatedLeadData = {
      id: lead.id,
      insurer: seguradora,
      insurerconfirmed: true, // Confirma a seguradora
      premioLiquido: Number(premio) || 0,
      comissao: Number(comissao) || 0,
      parcelamento: String(parcelamento), // Garante string
      editado: new Date().toISOString(), // Data/hora da última edição
      // Inclua outras propriedades necessárias que não estão sendo alteradas para garantir que o Apps Script as receba
      name: lead.name,
      vehiclemodel: lead.vehicleModel,
      vehicleyearmodel: lead.vehicleYearModel,
      city: lead.city,
      phone: lead.phone,
      insurancetype: lead.insuranceType,
      status: lead.status, // Não muda o status aqui
      confirmado: lead.confirmado,
      usuarioid: lead.usuarioId,
      createdAt: lead.createdAt,
      responsavel: lead.responsavel,
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
      const responseText = await response.text();
      const responseData = JSON.parse(responseText);
      console.log('Resposta do Sheets para confirmação de seguradora:', responseData);

      if (responseData.success) {
        console.log('Seguradora e detalhes do lead fechado atualizados no Sheets.');
        fetchLeadsFromSheet(); // Recarrega para atualizar a UI
      } else {
        alert('Erro ao confirmar seguradora do lead no servidor: ' + responseData.error);
        console.error('Erro na API ao confirmar seguradora:', responseData.error);
      }
    } catch (error) {
      console.error('Erro ao chamar API para confirmar seguradora:', error);
      alert('Erro ao confirmar seguradora do lead no servidor.');
    }
  };

  const transferirLead = async (leadId, responsavelId) => {
    let responsavelNome = null;
    if (responsavelId !== null) {
      const usuario = usuarios.find((u) => Number(u.id) === Number(responsavelId)); // Compara como número
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
      id: leadParaTransferir.id,
      responsavel: responsavelNome, // Atualiza apenas o responsável
      editado: new Date().toISOString(), // Data/hora da última edição
      // Mantenha outras propriedades para o Apps Script
      name: leadParaTransferir.name,
      vehiclemodel: leadParaTransferir.vehicleModel,
      vehicleyearmodel: leadParaTransferir.vehicleYearModel,
      city: leadParaTransferir.city,
      phone: leadParaTransferir.phone,
      insurancetype: leadParaTransferir.insuranceType,
      status: leadParaTransferir.status,
      confirmado: leadParaTransferir.confirmado,
      insurer: leadParaTransferir.insurer,
      insurerconfirmed: leadParaTransferir.insurerConfirmed,
      usuarioid: leadParaTransferir.usuarioId,
      premioliquido: leadParaTransferir.premioLiquido,
      comissao: leadParaTransferir.comissao,
      parcelamento: leadParaTransferir.parcelamento,
      data: leadParaTransferir.createdAt,
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
      const responseText = await response.text();
      const responseData = JSON.parse(responseText);
      console.log(`Resposta do Sheets para transferência do lead ${leadId}:`, responseData);

      if (responseData.success) {
        console.log(`Lead ${leadId} transferido para ${responsavelNome || 'Ninguém'} no Sheets.`);
        fetchLeadsFromSheet(); // Recarrega para atualizar a UI
      } else {
        alert('Erro ao transferir lead no servidor: ' + responseData.error);
        console.error('Erro na API ao transferir lead:', responseData.error);
      }
    } catch (error) {
      console.error('Erro ao chamar API para transferir lead:', error);
      alert('Erro ao transferir lead no servidor.');
    }
  };

  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => Number(u.id) === Number(id)); // Garante comparação numérica
    if (!usuario) {
      console.error("Usuário não encontrado para atualização:", id);
      return;
    }

    const usuarioAtualizado = { ...usuario }; // Cria uma cópia
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
      const responseText = await response.text();
      const responseData = JSON.parse(responseText);
      console.log(`Resposta do Sheets para atualização do usuário ${id}:`, responseData);

      if (responseData.success) {
        console.log(`Status/Tipo do usuário ${id} atualizado no Sheets.`);
        fetchUsuariosFromSheet(); // Recarrega para atualizar a UI
      } else {
        alert('Erro ao atualizar status/tipo do usuário no servidor: ' + responseData.error);
        console.error('Erro na API ao atualizar status/tipo do usuário:', responseData.error);
      }
    } catch (error) {
      console.error('Erro ao chamar API para atualizar usuário:', error);
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

  // --- Função de Login (Foco principal na correção) ---
  const handleLogin = async () => {
    setErroLogin(''); // Limpa mensagens de erro anteriores

    // Inserindo os logs solicitados:
    console.log('Tentando buscar usuários de:', `${GOOGLE_SHEETS_API_BASE_URL}?v=pegar_usuario`);

    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_BASE_URL}?v=pegar_usuario`);
      const responseText = await response.text(); // Pega o texto da resposta para depuração
      console.log('Resposta bruta da API de usuários (Login):', responseText);

      let data;
      try {
        data = JSON.parse(responseText); // Tenta parsear o JSON
      } catch (jsonError) {
        console.error('Erro ao parsear JSON da resposta de usuários (Login):', jsonError, responseText);
        setErroLogin('Erro ao processar dados de usuários do servidor.');
        return;
      }

      console.log('Usuários recebidos do Apps Script (Login):', data); // CRUCIAL

      if (!data || !data.success || !Array.isArray(data.data)) {
        setErroLogin(data.error || 'Erro desconhecido ao carregar usuários para login.');
        return;
      }

      const fetchedUsuarios = data.data; // Use os usuários recém-buscados
      console.log('Usuários processados para validação (Login):', fetchedUsuarios);

      console.log('Usuário tentando logar:', { usuarioDigitado: loginInput, senhaDigitada: senhaInput }); // CRUCIAL

      const usuarioAutenticado = fetchedUsuarios.find(
        (u) =>
          u.usuario === loginInput &&
          u.senha === senhaInput &&
          u.status === 'Ativo'
      );

      console.log('Usuário autenticado encontrado (Login):', usuarioAutenticado); // CRUCIAL

      if (usuarioAutenticado) {
        setUsuarioLogado(usuarioAutenticado);
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAutenticado));
        // setIsAuthenticated(true); // Não precisa mais, usuarioLogado já define a autenticação
        // Navegação ocorre automaticamente via `usuarioLogado` no JSX
      } else {
        setErroLogin('Login ou senha inválidos ou usuário inativo.');
      }
    } catch (error) {
      console.error('Erro durante o processo de login:', error);
      setErroLogin('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    }
  };

  // Redirecionamento baseado no estado de autenticação
  const isAuthenticated = !!usuarioLogado; // `!!` converte para booleano

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
          {erroLogin && <p className="text-red-300 text-sm mb-4">{erroLogin}</p>} {/* Exibe o erro de login */}
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
      <Sidebar isAdmin={isAdmin} nomeUsuario={usuarioLogado?.nome} /> {/* Passa apenas o nome */}

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
                onUpdateInsurer={confirmarSeguradoraLead} // Renomeado para refletir a ação correta
                // onConfirmInsurer removido, agora consolidado em onUpdateInsurer
                onUpdateDetalhes={() => {}} // Não é mais usado diretamente aqui
                fetchLeadsFromSheet={fetchLeadsFromSheet} // Recarrega leads principais tb
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
                leads={isAdmin ? leadsPerdidos : leadsPerdidos.filter((lead) => lead.responsavel === usuarioLogado.nome)} // Filtra leads perdidos
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
                leads={leads} // Busca em todos os leads
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFromSheet} // Pode ser o mesmo fetch
              />
            }
          />

          {/* Rota para Criar Lead */}
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
                    usuarios={usuarios}
                    fetchUsuariosFromSheet={fetchUsuariosFromSheet} // Passa para recarregar usuários
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
                leads={leads} // Todos os leads para o ranking
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
