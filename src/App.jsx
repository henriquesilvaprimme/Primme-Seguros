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

// **ATENÇÃO: SUBSTITUA ESTA URL PELA URL DE IMPLANTAÇÃO DO SEU GOOGLE APPS SCRIPT**
// Deve ser a URL base, sem nenhum ?v= ou ?action= no final
const GOOGLE_APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

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
      // Usa a URL base com o parâmetro de ação para obter todos os leads
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?action=getLeads`);
      const data = await response.json();

      console.log("Dados de Leads Recebidos:", data);

      if (Array.isArray(data)) {
        // Ordena o array por editado (ou createdAt se editado não existir) mais recente primeiro
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado || a.data);
          const dateB = new Date(b.editado || b.data);
          return dateB - dateA; // decrescente (mais recente no topo)
        });

        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? Number(item.id) : index + 1,
          name: item.name || item.Name || '',
          vehicleModel: item.vehiclemodel || item.vehicleModel || '', // Ajuste para consistência
          vehicleYearModel: item.vehicleyearmodel || item.vehicleYearModel || '', // Ajuste para consistência
          city: item.city || '',
          phone: item.phone || item.Telefone || '',
          insuranceType: item.insurancetype || item.insuranceType || '', // Ajuste para consistência
          status: item.status || 'Selecione o status',
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerconfirmed === 'true' || item.insurerconfirmed === true, // Ajuste para consistência
          usuarioId: item.usuarioid ? Number(item.usuarioid) : null, // Ajuste para consistência
          premioLiquido: item.premioliquido || '', // Ajuste para consistência
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          createdAt: item.data || new Date().toISOString(), // Ajuste para consistência
          responsavel: item.responsavel || '',
          editado: item.editado || ''
        }));

        console.log("Leads Formatados:", formattedLeads);

        // Só atualiza leads se não houver lead selecionado para não atrapalhar o usuário
        // OU se o lead selecionado não for um lead sendo editado (para permitir a atualização da lista)
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
  }, [leadSelecionado]); // Depende de leadSelecionado para evitar loops desnecessários
  // FIM - sincronização leads


  const fetchLeadsFechadosFromSheet = async () => {
    try {
      // Usa a URL base com o parâmetro de ação
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?action=getLeadsFechados`); // Assumindo uma ação 'getLeadsFechados' no Apps Script
      const data = await response.json();
      console.log("Leads Fechados Recebidos:", data);
      setLeadsFechados(data); // atribui direto
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


  const [usuarios, setUsuarios] = useState([]); // Começa vazio

  useEffect(() => {
    const fetchUsuariosFromSheet = async () => {
      try {
        // Usa a URL base com o parâmetro de ação
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?action=getUsuarios`); // Assumindo uma ação 'getUsuarios' no Apps Script
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

  // Função para adicionar um NOVO USUÁRIO
  const adicionarUsuario = (usuario) => {
    setUsuarios((prev) => [...prev, { ...usuario, id: prev.length + 1 }]); // Adiciona localmente
    // O salvamento no Sheets é feito dentro do CriarUsuario
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
    // 1. Atualiza localmente o status do lead na lista principal
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

    // Cria um objeto com as propriedades necessárias para enviar ao Apps Script
    // Normaliza os nomes das chaves para minúsculas ou o formato esperado pelo Apps Script
    const updatedLeadData = {
      id: leadParaAtualizar.id,
      name: leadParaAtualizar.name,
      vehiclemodel: leadParaAtualizar.vehicleModel,
      vehicleyearmodel: leadParaAtualizar.vehicleYearModel,
      city: leadParaAtualizar.city,
      phone: leadParaAtualizar.phone,
      insurancetype: leadParaAtualizar.insuranceType,
      status: novoStatus, // O novo status
      confirmado: true, // Sempre verdadeiro ao mudar status
      insurer: leadParaAtualizar.insurer,
      insurerconfirmed: leadParaAtualizar.insurerConfirmed,
      usuarioid: leadParaAtualizar.usuarioId,
      premioliquido: leadParaAtualizar.premioLiquido,
      comissao: leadParaAtualizar.comissao,
      parcelamento: leadParaAtualizar.parcelamento,
      data: leadParaAtualizar.createdAt,
      responsavel: leadParaAtualizar.responsavel,
      editado: new Date().toLocaleString() // Atualiza a data de edição
    };


    try {
      // 2. Envia a atualização para o Apps Script
      // Usa `action=salvar_lead` para o Apps Script saber o que fazer
      await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?action=salvar_lead`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(updatedLeadData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status do lead ${id} (${phone}) atualizado para ${novoStatus} no Sheets.`);
      fetchLeadsFromSheet(); // Re-fetch para garantir consistência
      fetchLeadsFechadosFromSheet(); // Re-fetch para garantir consistência dos leads fechados

    } catch (error) {
      console.error('Erro ao atualizar status do lead no Sheets:', error);
      alert('Erro ao atualizar status do lead no servidor.');
    }

    // Lógica para leads fechados (mantida, mas o Apps Script também deve cuidar do movimento)
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
              Seguradora: leadParaAdicionar.Seguradora || "",
              PremioLiquido: leadParaAdicionar.premioLiquido || "",
              Comissao: leadParaAdicionar.comissao || "",
              Parcelamento: leadParaAdicionar.parcelamento || "",
              id: leadParaAdicionar.id || null, // Garante que o ID original esteja aqui
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

    // Atualiza o objeto do lead com as novas informações
    lead.Seguradora = seguradora;
    lead.PremioLiquido = premio;
    lead.Comissao = comissao;
    lead.Parcelamento = parcelamento;
    lead.insurerConfirmed = true; // Confirma a seguradora

    // Atualiza o estado local de leadsFechados
    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        l.ID === id ? { ...lead } : l
      );
      return atualizados;
    });

    try {
      // Faz a chamada para o Apps Script via fetch POST
      // Usa `action=alterar_seguradora` e envia o lead completo
      await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?action=alterar_seguradora`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: lead }), // Envie o objeto lead completo
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Seguradora e detalhes do lead fechado atualizados no Sheets.');
      fetchLeadsFechadosFromSheet(); // Re-fetch para garantir consistência
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

    // Atualiza o estado local
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: responsavelNome } : lead
      )
    );

    // Envia a atualização para o Google Sheets
    try {
      // Encontra o lead completo para enviar ao Apps Script
      const leadParaTransferir = leads.find(l => l.id === leadId);
      if (!leadParaTransferir) {
        console.error("Lead não encontrado para transferência:", leadId);
        return;
      }

      // Atualiza o responsável no objeto do lead
      leadParaTransferir.responsavel = responsavelNome;

      await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?action=transferir_lead`, { // Assumindo uma ação 'transferir_lead'
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: leadParaTransferir }), // Envia o lead completo
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Lead ${leadId} transferido para ${responsavelNome || 'Ninguém'} no Sheets.`);
      fetchLeadsFromSheet(); // Re-fetch para garantir consistência
    } catch (error) {
      console.error('Erro ao transferir lead no Sheets:', error);
      alert('Erro ao transferir lead no servidor.');
    }
  };


  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((usuario) => usuario.id === id);
    if (!usuario) return;

    // Cria uma cópia para enviar, sem modificar o estado diretamente ainda
    const usuarioAtualizado = { ...usuario };
    if (novoStatus !== null) usuarioAtualizado.status = novoStatus;
    if (novoTipo !== null) usuarioAtualizado.tipo = novoTipo;

    try {
      // Faz a chamada para o Apps Script via fetch POST
      // Usa `action=salvar_usuario` ou `v=alterar_usuario` se preferir manter o legado
      await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?action=salvar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          usuario: usuarioAtualizado // Envia o objeto de usuário completo atualizado
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status/Tipo do usuário ${id} atualizado no Sheets.`);
      // Se a atualização no Sheets foi bem-sucedida, atualiza o estado local
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
