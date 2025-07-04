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
// Mantenha as URLs de GET separadas das de POST se elas tiverem sufixos diferentes (e.g., ?v=getLeads)
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=getLeads'; // URL para pegar leads
const GOOGLE_SHEETS_USERS_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=pegar_usuario'; // URL para pegar usuários
const GOOGLE_SHEETS_LEADS_FECHADOS_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=pegar_clientes_fechados'; // URL para pegar leads fechados

// URL para POSTs de alteração de dados (se for a mesma, tudo bem)
const GOOGLE_SHEETS_POST_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';


const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Estados para leads e usuários
  const [leads, setLeads] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null); // Usado para navegação e evitar refresh desnecessário

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png'; // Certifique-se de que este caminho está correto para seu background
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // --- FUNÇÃO PARA BUSCAR LEADS PENDENTES ---
  const fetchLeadsFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      const data = await response.json();

      if (!response.ok) {
          // Se a resposta não for OK (ex: 404, 500), tenta ler a mensagem de erro do corpo
          const errorText = await response.text();
          throw new Error(`Erro na rede ou no servidor ao buscar leads: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (Array.isArray(data)) {
        // Ordena o array por 'data' ou 'editado' decrescente (mais recente primeiro)
        // Se 'editado' sempre existe e reflete a última modificação/criação, use-o.
        // Caso contrário, 'data' (supondo que seja a data de criação original) é mais estável para "último recebido".
        const sortedData = [...data].sort((a, b) => { // Use spread para criar uma cópia e evitar mutação direta
          const dateA = new Date(a.data || a.editado); // Prefere 'data', fallback para 'editado'
          const dateB = new Date(b.data || b.editado); // Prefere 'data', fallback para 'editado'
          return dateB.getTime() - dateA.getTime(); // Ordena do mais recente para o mais antigo
        });

        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? Number(item.id) : index + 1, // Garante que 'id' é um número
          name: item.name || item.Name || '',
          vehicleModel: item.vehiclemodel || '', // Corrigido para consistência
          vehicleYearModel: item.vehicleyearmodel || '',
          city: item.city || '',
          phone: item.phone || item.Telefone || '',
          insuranceType: item.insurancetype || '',
          status: item.status || 'Pendente', // Status padrão para novos leads
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
          usuarioId: item.usuarioId ? Number(item.usuarioId) : null,
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          data: item.data || new Date().toISOString(), // Usando 'data' para consistência
          responsavel: item.responsavel || '',
          editado: item.editado || ''
        }));

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
        setLeads([]); // Limpa leads se houver erro e nenhum lead estiver selecionado
      }
    }
  };

  // --- EFEITO PARA BUSCAR LEADS PENDENTES REGULARMENTE ---
  useEffect(() => {
    fetchLeadsFromSheet(); // Chama na montagem inicial

    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000); // A cada 60 segundos (1 minuto)

    return () => clearInterval(interval); // Limpa o intervalo na desmontagem
  }, [leadSelecionado]); // leadSelecionado como dependência para controlar o refresh

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
        // Inverte os leads fechados para que os mais recentes apareçam primeiro, se desejar
        // Se a ordem de fechamento importa, pode ser necessário um campo 'dataFechamento' no Sheet
        const reversedFechados = [...data].reverse(); // Exemplo: inverte a ordem de recebimento
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
        const formattedUsuarios = data.map((item) => ({ // Removido index, pois não é usado para ID aqui
          id: item.id || '', // Assume que o ID vem do sheet, ou gere um UUID se o sheet não garantir
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

  const [ultimoFechadoId, setUltimoFechadoId] = useState(null); // Estado não usado para o propósito original, considerar remoção ou refatoração

  const adicionarUsuario = (usuario) => {
    // Esta função será melhor implementada enviando para o Sheets e depois re-buscando
    // Por enquanto, ela apenas adiciona localmente (não persistente sem chamada ao GAS)
    setUsuarios((prev) => [...prev, { ...usuario, id: crypto.randomUUID() }]); // Garante um ID único
  };

  // --- Atualiza status do lead no estado local e envia para o Apps Script ---
  const atualizarStatusLead = async (id, novoStatus, phone) => {
    // Encontra o lead no estado atual
    const leadToUpdate = leads.find((lead) => lead.phone === phone);
    if (!leadToUpdate) return;

    // Atualiza o estado local imediatamente para uma melhor UX
    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    // Lógica para leads fechados, se o status for 'Fechado'
    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const jaExiste = prev.some((lead) => lead.phone === phone);

        if (jaExiste) {
          // Se já existe, só atualiza
          return prev.map((lead) =>
            lead.phone === phone ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
        } else {
          // Se não existe, adiciona o lead à lista de fechados com os campos ajustados
          const leadParaAdicionar = {
            ID: leadToUpdate.id || crypto.randomUUID(),
            name: leadToUpdate.name,
            vehicleModel: leadToUpdate.vehicleModel,
            vehicleYearModel: leadToUpdate.vehicleYearModel,
            city: leadToUpdate.city,
            phone: leadToUpdate.phone,
            insurer: leadToUpdate.insuranceType || '', // Use insuranceType para consistência
            Data: leadToUpdate.data || new Date().toISOString(), // Use lead.data
            Responsavel: leadToUpdate.responsavel || '',
            Status: "Fechado",
            Seguradora: leadToUpdate.insurer || "", // Mapeia insurer para Seguradora
            PremioLiquido: leadToUpdate.premioLiquido || "",
            Comissao: leadToUpdate.comissao || "",
            Parcelamento: leadToUpdate.parcelamento || "",
            // Removidas propriedades de usuário, pois não pertencem ao objeto LeadFechado
            confirmado: true
          };
          return [...prev, leadParaAdicionar];
        }
      });
    }

    // Prepara os dados para o Apps Script (POST)
    const updatedLeadForScript = {
      ...leadToUpdate,
      status: novoStatus,
      confirmado: true,
      editado: new Date().toISOString(), // Atualiza a data de edição
    };

    try {
      await fetch(`${GOOGLE_SHEETS_POST_URL}?v=alterar_status`, { // Verifique se a função do Apps Script é 'alterar_status'
        method: 'POST',
        mode: 'no-cors', // Cuidado com 'no-cors' - não permite ler a resposta do servidor
        body: JSON.stringify({
          lead: updatedLeadForScript
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Após o sucesso da atualização no Apps Script, re-busque os leads para garantir consistência
      // fetchLeadsFromSheet(); // Chame se precisar de uma sincronização imediata
    } catch (error) {
      console.error('Erro ao enviar atualização de status para o Apps Script:', error);
      // Aqui você pode querer reverter o estado local ou mostrar uma mensagem de erro
    }
  };

  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
  });

  // --- Confirma seguradora e envia para o Apps Script (Leads Fechados) ---
  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leadsFechados.find((l) => l.ID == id); // Use 'ID' para leads fechados
    if (!lead) return;

    // Atualiza os dados do lead no estado local de leadsFechados
    const updatedLeadLocal = {
      ...lead,
      Seguradora: seguradora,
      PremioLiquido: premio,
      Comissao: comissao,
      Parcelamento: parcelamento,
      insurerConfirmed: true,
      // dataFechamento: new Date().toISOString() // Adicionar este campo se você rastrear a data de fechamento
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
      // Após o sucesso da atualização, re-busque leads fechados para sincronizar
      // fetchLeadsFechadosFromSheet();
    } catch (error) {
      console.error('Erro ao enviar detalhes de seguradora para o Apps Script:', error);
    }
  };

  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    // Isso deve atualizar leadsFechados, não 'leads' principal
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        lead.ID === id ? { ...lead, [campo]: valor } : lead // Use 'ID'
      )
    );
  };

  // --- Transfere lead para um responsável e envia para o Apps Script ---
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

    // Atualiza o estado local imediatamente
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: responsavelNome, usuarioId: usuarioId } : lead
      )
    );

    // Prepara os dados para o Apps Script (POST)
    const updatedLeadForScript = {
      ...leadToUpdate,
      responsavel: responsavelNome,
      usuarioId: usuarioId, // Garante que o usuarioId também seja enviado
      editado: new Date().toISOString(), // Atualiza data de edição
    };

    try {
      await fetch(`${GOOGLE_SHEETS_POST_URL}?v=transferir_lead`, { // Verifique o endpoint correto no GAS
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: updatedLeadForScript
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // fetchLeadsFromSheet(); // Re-busque para sincronizar
    } catch (error) {
      console.error('Erro ao transferir lead para o Apps Script:', error);
    }
  };

  // --- Atualiza status/tipo do usuário e envia para o Apps Script ---
  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    // Prepara o objeto para atualização local e para o script
    const updatedUsuario = { ...usuario };
    if (novoStatus !== null) updatedUsuario.status = novoStatus;
    if (novoTipo !== null) updatedUsuario.tipo = novoTipo;

    // Atualiza localmente
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
      // fetchUsuariosFromSheet(); // Re-busque para sincronizar, se necessário
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
                // 'leads' já está ordenado pelo fetchLeadsFromSheet
                leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                usuarios={usuarios}
                onUpdateStatus={atualizarStatusLead}
                fetchLeadsFromSheet={fetchLeadsFromSheet} // Passando a função para o botão de refresh
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
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet} // Passando a função para refresh
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
                fetchLeadsFromSheet={fetchLeadsFromSheet} // Passando a função para refresh
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
