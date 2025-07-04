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

// URLs para o Google Apps Script (AJUSTADAS PARA A URL FORNECIDA)
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec';
const GOOGLE_SHEETS_SCRIPT_URL = `${GOOGLE_SHEETS_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_USERS = GOOGLE_SHEETS_BASE_URL; // Base URL para ações de usuário e salvamento de leads
const GOOGLE_SHEETS_LEADS_FECHADOS = `${GOOGLE_SHEETS_BASE_URL}?v=pegar_clientes_fechados`;

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Carrega a imagem de fundo para evitar CLS
  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // INÍCIO - sincronização leads via Google Sheets
  const [leads, setLeads] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null); // movido para cá para usar no useEffect

  // Função para buscar leads da planilha do Google Sheets
  const fetchLeadsFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      const data = await response.json();

      console.log("Dados de leads recebidos:", data);

      if (Array.isArray(data)) {
        // Ordena o array por 'editado' (mais recente primeiro)
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado);
          const dateB = new Date(b.editado);
          return dateB - dateA; // decrescente (mais recente no topo)
        });

        // Formata os leads para o formato esperado pelo aplicativo
        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? String(item.id) : crypto.randomUUID(), // Garante que o ID seja string
          name: item.name || item.Name || '',
          vehicleModel: item.vehiclemodel || item.vehiclemodel || '',
          vehicleYearModel: item.vehicleyearmodel || item.vehicleyearmodel || '',
          city: item.city || '',
          phone: item.phone || item.Telefone || '',
          insuranceType: item.insurancetype || '',
          status: item.status || 'Selecione o status',
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
          usuarioId: item.usuarioId ? String(item.usuarioId) : null, // Garante que o usuarioId seja string
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          createdAt: item.data || new Date().toISOString(),
          responsavel: item.responsavel || '',
          editado: item.editado || ''
        }));

        console.log("Leads formatados:", formattedLeads);

        // Só atualiza leads se não houver lead selecionado para não atrapalhar o usuário
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

  // Efeito para buscar leads e configurar o intervalo de atualização
  useEffect(() => {
    fetchLeadsFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000); // Atualiza a cada 60 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [leadSelecionado]);
  // FIM - sincronização leads

  // Função para buscar leads fechados da planilha do Google Sheets
  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS);
      const data = await response.json();

      setLeadsFechados(data); // Atribui os dados diretamente
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  };

  // Efeito para buscar leads fechados e configurar o intervalo de atualização
  useEffect(() => {
    fetchLeadsFechadosFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFechadosFromSheet();
    }, 60000); // Atualiza a cada 60 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, []);

  const [usuarios, setUsuarios] = useState([]); // Começa vazio

  // Efeito para buscar usuários da planilha do Google Sheets
  useEffect(() => {
    const fetchUsuariosFromSheet = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_USERS + '?v=pegar_usuario');
        const data = await response.json();

        if (Array.isArray(data)) {
          // Formata os usuários para o formato esperado pelo aplicativo
          const formattedUsuarios = data.map((item) => ({
            id: item.id ? String(item.id) : crypto.randomUUID(), // Garante que o ID seja string
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
    }, 60000); // Atualiza a cada 60 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, []);

  const [ultimoFechadoId, setUltimoFechadoId] = useState(null);

  // Função para adicionar um novo usuário ao estado local
  const adicionarUsuario = (usuario) => {
    setUsuarios((prev) => [...prev, { ...usuario, id: usuario.id || crypto.randomUUID() }]); // Garante um ID único
  };

  // Função para adicionar um novo lead ao estado local
  const adicionarLead = (novoLead) => {
    setLeads((prevLeads) => [novoLead, ...prevLeads]); // Adiciona o novo lead no início da lista
  };

  // Função para atualizar o status de um lead existente
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

  // Função para atualizar o status de um lead e gerenciar leads fechados
  const atualizarStatusLead = async (id, novoStatus, phone) => { // Tornada async
    // Encontra o lead a ser atualizado
    const leadToUpdate = leads.find((lead) => lead.id === id);
    if (!leadToUpdate) {
      console.warn("Lead não encontrado para atualização de status.");
      return;
    }

    // Cria um objeto de lead atualizado com o novo status e a data de edição
    const updatedLead = {
      ...leadToUpdate,
      status: novoStatus,
      confirmado: novoStatus === 'Fechado' ? true : leadToUpdate.confirmado, // Define confirmado se for 'Fechado'
      editado: new Date().toISOString() // Atualiza a data de edição
    };

    // Atualiza o estado local imediatamente
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? updatedLead : lead
      )
    );

    // Se o status for 'Fechado', atualiza também a lista de leads fechados
    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const jaExiste = prev.some((lead) => lead.id === id); // Verifica pelo ID

        if (jaExiste) {
          return prev.map((lead) =>
            lead.id === id ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
        } else {
          // Se não existe, adiciona o lead atualizado
          const novoLeadFechado = {
            ID: updatedLead.id,
            name: updatedLead.name,
            vehicleModel: updatedLead.vehicleModel,
            vehicleYearModel: updatedLead.vehicleYearModel,
            city: updatedLead.city,
            phone: updatedLead.phone,
            insurer: updatedLead.insuranceType || updatedLead.insurer || "",
            Data: updatedLead.createdAt,
            Responsavel: updatedLead.responsavel || "",
            Status: "Fechado",
            Seguradora: updatedLead.insurer || "",
            PremioLiquido: updatedLead.premioLiquido || 0,
            Comissao: updatedLead.comissao || 0,
            Parcelamento: updatedLead.parcelamento || "",
            id: updatedLead.id,
            usuarioId: updatedLead.usuarioId,
            confirmado: true,
            insurerConfirmed: updatedLead.insurerConfirmed,
            editado: updatedLead.editado,
          };
          return [...prev, novoLeadFechado];
        }
      });
    }

    // Envia a atualização para o Google Apps Script
    try {
      await fetch(GOOGLE_SHEETS_USERS + '?v=salvar_lead', { // Usando 'salvar_lead' para atualizar
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLead), // Envia o objeto lead completo atualizado
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de atualização de status de lead enviada para o GAS.');
    } catch (error) {
      console.error('Erro ao enviar atualização de status de lead para o GAS:', error);
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

  // Função para limpar campos específicos de um lead
  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
  });

  // Função para confirmar a seguradora de um lead fechado
  const confirmarSeguradoraLead = (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leadsFechados.find((lead) => lead.ID === id);

    if (!lead) return; // Garante que o lead existe

    lead.Seguradora = seguradora;
    lead.PremioLiquido = premio;
    lead.Comissao = comissao;
    lead.Parcelamento = parcelamento;

    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        l.ID === id ? { ...l, insurerConfirmed: true } : l
      );
      return atualizados;
    });

    try {
      // Faz a chamada para o Apps Script via fetch POST
      fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=alterar_seguradora', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: lead
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar lead para o GAS:', error);
    }
  };

  // Função para atualizar detalhes de um lead fechado
  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, [campo]: valor } : lead
      )
    );
  };

  // Função para transferir um lead para outro responsável
  const transferirLead = async (leadId, responsavelId) => { // Tornar a função assíncrona
    let newResponsavelName = '';
    let updatedLead = null; // Variável para armazenar o lead atualizado para envio ao GAS

    // Encontra o lead na lista atual
    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) {
      console.warn("Lead não encontrado para transferência.");
      return;
    }

    if (responsavelId === null) {
      // Se for null, desatribui o responsável
      newResponsavelName = ''; // Define como vazio para enviar ao GAS
      updatedLead = { ...leadToUpdate, responsavel: null, editado: new Date().toISOString() }; // Atualiza o objeto e data de edição para o GAS
    } else {
      // Busca o usuário normalmente se responsavelId não for null
      let usuario = usuarios.find((u) => u.id === responsavelId);

      if (!usuario) {
        console.warn("Usuário não encontrado para transferência de lead.");
        return;
      }
      newResponsavelName = usuario.nome;
      updatedLead = { ...leadToUpdate, responsavel: newResponsavelName, editado: new Date().toISOString() }; // Atualiza o objeto e data de edição para o GAS
    }

    // Atualiza o estado local imediatamente
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: newResponsavelName } : lead
      )
    );

    // Enviar a atualização para o Google Apps Script
    try {
      // Usando GOOGLE_SHEETS_USERS como base para a URL do script
      await fetch(GOOGLE_SHEETS_USERS + '?v=salvar_lead', { // Usando 'salvar_lead' para atualizar
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLead), // Envia o objeto lead completo atualizado
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Requisição de transferência de lead enviada para o GAS.');
    } catch (error) {
      console.error('Erro ao enviar transferência de lead para o GAS:', error);
    }
  };

  // Função para atualizar o status ou tipo de um usuário
  const atualizarStatusUsuario = (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    // Atualizar só o que foi passado
    if (novoStatus !== null) usuario.status = novoStatus;
    if (novoTipo !== null) usuario.tipo = novoTipo;

    try {
      // Faz a chamada para o Apps Script via fetch POST
      fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=alterar_usuario', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          usuario: usuario
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar dados do usuário para o GAS:', error);
    }

    // Atualizar localmente também
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
  };

  // Abre os detalhes de um lead e navega para a rota apropriada
  const onAbrirLead = (lead) => {
    setLeadSelecionado(lead);

    let path = '/leads';
    if (lead.status === 'Fechado') path = '/leads-fechados';
    else if (lead.status === 'Perdido') path = '/leads-perdidos';

    navigate(path);
  };

  // Lida com o processo de login
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

  // Verifica se o usuário logado é um administrador
  const isAdmin = usuarioLogado?.tipo === 'Admin';

  // Renderiza o layout principal do aplicativo se autenticado
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar do aplicativo, visível para usuários autenticados */}
      <Sidebar isAdmin={isAdmin} nomeUsuario={usuarioLogado} />

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          {/* Rota padrão, redireciona para o dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Rota do Dashboard */}
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
          {/* Rota para a lista de Leads */}
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
          {/* Rota para a lista de Leads Fechados */}
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
          {/* Rota para a lista de Leads Perdidos */}
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
          {/* Rota para buscar um Lead */}
          <Route path="/buscar-lead" element={<BuscarLead
            leads={leads}
            fetchLeadsFromSheet={fetchLeadsFromSheet}
            fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
          />} />

          {/* Rotas exclusivas para administradores */}
          {isAdmin && (
            <>
              {/* Rota para criar um novo Usuário */}
              <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
              {/* Rota para criar um novo Lead */}
              <Route path="/criar-lead" element={<CriarLead adicionarLead={adicionarLead} usuarioLogado={usuarioLogado} />} />
              {/* Rota para gerenciar Usuários */}
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
          {/* Rota para o Ranking */}
          <Route path="/ranking" element={<Ranking
            usuarios={usuarios}
            fetchLeadsFromSheet={fetchLeadsFromSheet}
            fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
            leads={leads} />} />
          {/* Rota para páginas não encontradas */}
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
