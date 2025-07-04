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

// --- URLs do Google Apps Script ---
const GOOGLE_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
const GOOGLE_SHEETS_LEADS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_USERS_API = `${GOOGLE_SCRIPT_BASE_URL}?v=pegar_usuario`;
const GOOGLE_SHEETS_POST_ACTION_URL = `${GOOGLE_SCRIPT_BASE_URL}`;

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // 'leads' é a única fonte de verdade para todos os leads (ativos, fechados, perdidos)
  const [leads, setLeads] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png'; // Verifique o caminho correto da imagem
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // Função para buscar leads do Google Sheet
  const fetchLeadsFromSheet = useCallback(async () => {
    try {
      console.log("Fetching leads from:", GOOGLE_SHEETS_LEADS_API);
      const response = await fetch(GOOGLE_SHEETS_LEADS_API);

      if (!response.ok) {
        console.error(`HTTP error fetching leads: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dados de Leads Recebidos (Crus):", data);

      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA;
        });

        const formattedLeads = sortedData.map((item, index) => {
          // Função auxiliar para padronizar o acesso a propriedades
          const getProp = (propNames, defaultValue = '') => {
            for (const name of propNames) {
              if (item[name] !== undefined && item[name] !== null) {
                return item[name];
              }
            }
            return defaultValue;
          };

          return {
            // Padroniza todas as chaves para camelCase e garante os tipos corretos
            id: String(getProp(['id'], String(index + 1))),
            name: getProp(['name', 'Name']),
            vehicleModel: getProp(['vehiclemodel', 'vehicleModel']),
            vehicleYearModel: getProp(['vehicleyearmodel', 'vehicleYearModel']),
            city: getProp(['city']),
            phone: String(getProp(['phone', 'Telefone'])), // Garante que telefone seja string
            insuranceType: getProp(['insurancetype', 'insuranceType']),
            status: getProp(['status'], 'Selecione o status'),
            confirmado: getProp(['confirmado']) === 'true' || getProp(['confirmado']) === true,
            insurer: getProp(['insurer', 'Seguradora']), // Agora 'insurer' ou 'Seguradora' é o campo principal
            insurerConfirmed: getProp(['insurerconfirmed']) === 'true' || getProp(['insurerconfirmed']) === true,
            usuarioId: String(getProp(['usuarioid'], '')),
            
            // Para Prêmio Líquido, Comissão, Parcelamento:
            // Preferimos que o valor seja numérico ou vazio para manipulação.
            // Para 'PremioLiquido' e 'Comissao', o Sheets pode retornar como string,
            // então usamos parseFloat e tratamos NaN.
            premioLiquido: parseFloat(String(getProp(['premioliquido', 'PremioLiquido'], '0')).replace(',', '.')) || 0,
            comissao: parseFloat(String(getProp(['comissao', 'Comissao'], '0')).replace(',', '.')) || 0,
            parcelamento: getProp(['parcelamento', 'Parcelamento']),

            createdAt: getProp(['data'], new Date().toISOString()),
            responsavel: getProp(['responsavel', 'Responsavel']),
            editado: getProp(['editado']),

            // *** IMPORTANTE: Mapeamento explícito para as chaves esperadas pelo `LeadsFechados` ***
            // Isso garante que o componente `LeadsFechados` encontre as propriedades
            // com as chaves exatas que ele espera (ex: `ID`, `Data`, `Seguradora`, `PremioLiquido`, etc.)
            // que foram definidas no código LeadsFechados.jsx que você enviou.
            ID: String(getProp(['id'], String(index + 1))), // ID do lead
            Data: getProp(['data'], new Date().toISOString()).split('T')[0], // Apenas a data (AAAA-MM-DD)
            Seguradora: getProp(['insurer', 'Seguradora']),
            PremioLiquido: parseFloat(String(getProp(['premioliquido', 'PremioLiquido'], '0')).replace(',', '.')) || 0,
            Comissao: parseFloat(String(getProp(['comissao', 'Comissao'], '0')).replace(',', '.')) || 0,
            Parcelamento: getProp(['parcelamento', 'Parcelamento']),
            Responsavel: getProp(['responsavel', 'Responsavel']),
            Telefone: String(getProp(['phone', 'Telefone'])),
            Status: getProp(['status'], 'Selecione o status'), // 'Status' com S maiúsculo
          };
        });

        console.log("Leads Formatados para estado global:", formattedLeads);
        setLeads(formattedLeads); // Atualiza o estado principal com todos os leads
      } else {
        setLeads([]);
        console.warn("Dados de leads não são um array:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar leads do Google Sheets:', error);
      setLeads([]);
    }
  }, []);

  // Função para buscar usuários do Google Sheet
  const fetchUsuariosFromSheet = useCallback(async () => {
    try {
      console.log("Tentando buscar usuários de:", GOOGLE_SHEETS_USERS_API);
      const response = await fetch(GOOGLE_SHEETS_USERS_API);

      if (!response.ok) {
        console.error(`HTTP error fetching users: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Usuários Recebidos no Frontend (para login):", data);

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item) => ({
          id: String(item.id || ''),
          usuario: String(item.usuario || ''),
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
  }, []);

  // Efeitos para buscar dados periodicamente
  useEffect(() => {
    fetchLeadsFromSheet();
    const interval = setInterval(fetchLeadsFromSheet, 60000); // Atualiza leads a cada 1 minuto
    return () => clearInterval(interval);
  }, [fetchLeadsFromSheet]);

  useEffect(() => {
    fetchUsuariosFromSheet();
    const interval = setInterval(fetchUsuariosFromSheet, 60000); // Atualiza usuários a cada 1 minuto
    return () => clearInterval(interval);
  }, [fetchUsuariosFromSheet]);

  const adicionarUsuario = (usuario) => {
    // Adiciona localmente, mas o CriarUsuario DEVE chamar fetchUsuariosFromSheet após o POST
    setUsuarios((prev) => [...prev, { ...usuario, id: String(prev.length + 1) }]);
  };

  const adicionarLead = (lead) => {
    // Adiciona localmente, mas o CriarLead DEVE chamar fetchLeadsFromSheet após o POST
    setLeads((prev) => [...prev, lead]);
  };

  // Função para atualizar status do lead (COM no-cors)
  const atualizarStatusLead = async (id, novoStatus, phone) => {
    // Otimisticamente atualiza o estado local para resposta rápida da UI
    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.phone) === String(phone) ? { ...lead, status: novoStatus, Status: novoStatus, confirmado: true } : lead
      )
    );

    try {
      const payload = {
        action: 'alterar_status',
        phone: String(phone).trim(),
        status: novoStatus,
      };

      console.log("Enviando atualização de status do lead (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("Requisição de atualização de status do lead enviada. Verifique os logs do GAS.");

      setTimeout(() => {
        fetchLeadsFromSheet();
      }, 100);

    } catch (error) {
      console.error('Erro ao enviar atualização de status do lead:', error);
      alert('Erro de rede ao atualizar status do lead. Por favor, tente novamente.');
      fetchLeadsFromSheet();
    }
  };

  // NOVA FUNÇÃO: Atualiza um detalhe específico do lead fechado
  // (Prêmio Líquido, Comissão, Parcelamento, Seguradora temporária)
  const onUpdateDetalhesFechados = async (id, campo, valor) => {
    // Atualiza otimisticamente o estado local
    setLeads((prevLeads) =>
      prevLeads.map((lead) => {
        if (String(lead.ID) === String(id)) {
          // Mapeia o nome do campo recebido para a chave correta no estado
          const updatedLead = { ...lead };
          switch (campo) {
            case 'PremioLiquido':
              updatedLead.PremioLiquido = valor;
              updatedLead.premioliquido = valor; // Também atualiza a chave camelCase
              break;
            case 'Comissao':
              updatedLead.Comissao = valor;
              updatedLead.comissao = valor; // Também atualiza a chave camelCase
              break;
            case 'Parcelamento':
              updatedLead.Parcelamento = valor;
              updatedLead.parcelamento = valor; // Também atualiza a chave camelCase
              break;
            case 'Seguradora': // Para o caso de atualizarmos a seguradora antes da confirmação final
              updatedLead.Seguradora = valor;
              updatedLead.insurer = valor;
              break;
            default:
              break;
          }
          return updatedLead;
        }
        return lead;
      })
    );

    // Nota: Esta função não faz um POST direto para o Sheets.
    // Ela apenas atualiza o estado local. O POST para o Sheets
    // acontece apenas quando `confirmarSeguradoraLead` é chamada.
    // Isso é importante para evitar múltiplos envios para o Sheets
    // a cada digitação/seleção.
  };


  // Função para confirmar seguradora do lead (COM no-cors)
  const confirmarSeguradoraLead = async (id, premioLiquido, seguradora, comissao, parcelamento) => {
    const leadToUpdate = leads.find((l) => String(l.ID) === String(id) || String(l.id) === String(id));

    if (!leadToUpdate) {
      console.error("Lead não encontrado para confirmação de seguradora (ID:", id, ").");
      return;
    }

    // Otimisticamente atualiza o estado local (já garantindo que as chaves do Sheet estejam corretas)
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        String(l.ID) === String(id) || String(l.id) === String(id)
          ? {
              ...l,
              Seguradora: seguradora,
              PremioLiquido: premioLiquido,
              Comissao: comissao,
              Parcelamento: parcelamento,
              insurerConfirmed: true,
              // As chaves camelCase também são atualizadas para consistência interna
              insurer: seguradora,
              premioliquido: premioLiquido,
              comissao: comissao,
              parcelamento: parcelamento,
            }
          : l
      )
    );

    try {
      const payload = {
        action: 'alterar_seguradora',
        lead: {
          ID: String(id), // ID do lead para o Apps Script
          Seguradora: seguradora,
          PremioLiquido: premioLiquido,
          Comissao: comissao,
          Parcelamento: parcelamento,
        },
      };

      console.log("Enviando confirmação de seguradora (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("Requisição de confirmação de seguradora enviada. Verifique os logs do GAS.");

      setTimeout(() => {
        fetchLeadsFromSheet();
      }, 100);

    } catch (error) {
      console.error('Erro ao enviar lead fechado para atualização de seguradora:', error);
      alert('Erro de rede ao confirmar seguradora do lead.');
      fetchLeadsFromSheet();
    }
  };

  // Função para transferir lead (COM no-cors)
  const transferirLead = async (leadId, responsavelId) => {
    let responsavelNome = null;
    let usuario = usuarios.find((u) => String(u.id) === String(responsavelId));
    if (usuario) {
      responsavelNome = usuario.nome;
    } else {
      console.warn("Usuário responsável não encontrado para ID:", responsavelId);
      alert("Usuário responsável não encontrado. Verifique a lista de usuários.");
      return;
    }

    // Otimisticamente atualiza o estado local
    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(leadId) ? { ...lead, responsavel: responsavelNome, Responsavel: responsavelNome } : lead
      )
    );

    try {
      const payload = {
        action: 'alterar_atribuido',
        id: leadId,
        usuarioId: String(responsavelId),
      };

      console.log("Enviando transferência de lead (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      console.log("Requisição de transferência de lead enviada. Verifique os logs do GAS.");

      setTimeout(() => {
        fetchLeadsFromSheet();
      }, 100);

    } catch (error) {
      console.error('Erro ao transferir lead no Sheets:', error);
      alert('Erro de rede ao transferir lead.');
      fetchLeadsFromSheet();
    }
  };

  // Função para atualizar status/tipo do usuário (COM no-cors)
  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => String(u.id) === String(id));
    if (!usuario) {
      console.warn("Usuário não encontrado para atualização de status/tipo.");
      return;
    }

    // Otimisticamente atualiza o estado local
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

    try {
      const payload = {
        action: 'alterar_usuario',
        usuario: {
          id: String(id),
          status: novoStatus,
          tipo: novoTipo,
        },
      };

      console.log("Enviando atualização de status/tipo do usuário (POST com no-cors):", payload);
      await fetch(GOOGLE_SHEETS_POST_ACTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      console.log("Requisição de atualização de usuário enviada. Verifique os logs do GAS.");

      setTimeout(() => {
        fetchUsuariosFromSheet();
      }, 100);

    } catch (error) {
      console.error('Erro ao atualizar status/tipo do usuário no Sheets:', error);
      alert('Erro de rede ao atualizar status/tipo do usuário.');
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

  const handleLogin = () => {
    console.log("-----------------------------------");
    console.log("Tentativa de Login Iniciada:");
    console.log("Login digitado (input):", loginInput);
    console.log("Senha digitada (input):", senhaInput);
    console.log("Usuários carregados no estado 'usuarios':", usuarios);
    console.log("-----------------------------------");

    const usuarioEncontrado = usuarios.find(
      (u) => {
        const isUserMatch = String(u.usuario).trim() === loginInput.trim();
        const isPassMatch = String(u.senha).trim() === senhaInput.trim();
        const isActive = String(u.status).trim() === 'Ativo';

        console.log(`Comparando usuário: '${String(u.usuario).trim()}' (Sheet) === '${loginInput.trim()}' (Input) -> Match User: ${isUserMatch}`);
        console.log(`Comparando senha:   '${String(u.senha).trim()}' (Sheet) === '${senhaInput.trim()}' (Input) -> Match Pass: ${isPassMatch}`);
        console.log(`Comparando status:  '${String(u.status).trim()}' (Sheet) === 'Ativo' -> Is Active: ${isActive}`);

        return isUserMatch && isPassMatch && isActive;
      }
    );

    if (usuarioEncontrado) {
      setIsAuthenticated(true);
      setUsuarioLogado(usuarioEncontrado);
      console.log("Login bem-sucedido! Usuário logado:", usuarioEncontrado);
      navigate('/dashboard');
    } else {
      alert('Login ou senha inválidos, ou usuário inativo.');
      console.log("Falha no login: Usuário não encontrado, senha incorreta ou inativo.");
    }
  };

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

  const isAdmin = usuarioLogado?.tipo === 'Admin';

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar isAdmin={isAdmin} usuarioLogado={usuarioLogado} />

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard
                  leadsClosed={
                    isAdmin
                      ? leads.filter(lead => lead.Status === 'Fechado') // Use 'Status' aqui também
                      : leads.filter(lead => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim() && lead.Status === 'Fechado')
                  }
                  leads={
                    isAdmin
                      ? leads
                      : leads.filter(lead => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim())
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
                  leads={isAdmin ? leads : leads.filter(lead => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim())}
                  usuarios={usuarios}
                  onUpdateStatus={atualizarStatusLead}
                  onRefreshLeads={fetchLeadsFromSheet} // Renomeado para clareza
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
                  leads={
                    isAdmin
                      ? leads.filter(lead => lead.Status === 'Fechado') // Filtra por 'Status'
                      : leads.filter(lead => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim() && lead.Status === 'Fechado')
                  }
                  usuarios={usuarios}
                  onConfirmInsurer={confirmarSeguradoraLead}
                  onUpdateDetalhes={onUpdateDetalhesFechados} // Adicionada esta função
                  fetchLeadsFechadosFromSheet={fetchLeadsFromSheet} // Renomeado para onRefreshLeads na prop, mas a função é fetchLeadsFromSheet
                  isAdmin={isAdmin}
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
                  leads={
                    isAdmin
                      ? leads.filter(lead => lead.Status === 'Perdido') // Filtra por 'Status'
                      : leads.filter(lead => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim() && lead.Status === 'Perdido')
                  }
                  usuarios={usuarios}
                  onRefreshLeads={fetchLeadsFromSheet} // Renomeado para clareza
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
                  onRefreshLeads={fetchLeadsFromSheet} // Renomeado para clareza
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/criar-lead"
            element={<PrivateRoute><CriarLead adicionarLead={adicionarLead} googleSheetsPostUrl={GOOGLE_SHEETS_POST_ACTION_URL} usuarioLogado={usuarioLogado} onRefreshLeads={fetchLeadsFromSheet} /></PrivateRoute>}
          />

          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<PrivateRoute><CriarUsuario adicionarUsuario={adicionarUsuario} googleSheetsPostUrl={GOOGLE_SHEETS_POST_ACTION_URL} fetchUsuariosFromSheet={fetchUsuariosFromSheet} /></PrivateRoute>} />
              <Route
                path="/usuarios"
                element={
                  <PrivateRoute>
                    <Usuarios
                      leads={isAdmin ? leads : leads.filter(lead => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim())}
                      usuarios={usuarios}
                      onRefreshLeads={fetchLeadsFromSheet} // Renomeado para clareza
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
                  onRefreshLeads={fetchLeadsFromSheet} // Renomeado para clareza
                  leads={leads}
                />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
