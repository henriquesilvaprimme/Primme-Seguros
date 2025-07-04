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
import CriarLead from './pages/CriarLead'; // Importa o novo componente CriarLead

// URL BASE do seu Web App no Google Apps Script (ATUALIZADA)
const GOOGLE_APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// URLs para as Google Sheets APIs, usando a URL base
const GOOGLE_SHEETS_SCRIPT_URL_GET_LEADS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_SCRIPT_URL_USERS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_usuario`;
const GOOGLE_SHEETS_SCRIPT_URL_LEADS_FECHADOS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_clientes_fechados`;

// URLs para ações POST (sem parâmetro 'v' fixo, a ação é passada no corpo ou como 'action')
const GOOGLE_SHEETS_SCRIPT_URL_ACTIONS = GOOGLE_APPS_SCRIPT_BASE_URL;


const App = () => {
    const navigate = useNavigate();

    // Estados de autenticação
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginInput, setLoginInput] = useState('');
    const [senhaInput, setSenhaInput] = useState('');
    const [usuarioLogado, setUsuarioLogado] = useState(null);

    // Estado para carregamento da imagem de fundo
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);

    // Estados para dados do Google Sheets
    const [leads, setLeads] = useState([]);
    const [leadsFechados, setLeadsFechados] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    
    // Estado para o lead selecionado ao abrir detalhes
    const [leadSelecionado, setLeadSelecionado] = useState(null);

    // Carregar imagem de fundo
    useEffect(() => {
        const img = new Image();
        img.src = '/background.png';
        img.onload = () => setBackgroundLoaded(true);
    }, []);

    // Função para buscar leads da planilha
    const fetchLeadsFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_GET_LEADS);
            const data = await response.json();

            if (Array.isArray(data)) {
                // Ordena o array por 'editado' (mais recente primeiro), ou 'data' se 'editado' não existir
                const sortedData = data.sort((a, b) => {
                    const dateA = new Date(a.editado || a.data || 0); // Usar 0 para datas inválidas/ausentes
                    const dateB = new Date(b.editado || b.data || 0);
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
                
                // Atualiza leads apenas se nenhum lead estiver sendo editado
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
    }, [leadSelecionado]); // leadSelecionado como dependência para evitar re-fetch desnecessário

    // Função para buscar leads fechados da planilha
    const fetchLeadsFechadosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_LEADS_FECHADOS);
            const data = await response.json();
            if (Array.isArray(data)) {
                setLeadsFechados(data);
            } else {
                setLeadsFechados([]);
            }
        } catch (error) {
            console.error('Erro ao buscar leads fechados:', error);
            setLeadsFechados([]);
        }
    }, []);

    // Função para buscar usuários da planilha
    const fetchUsuariosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_USERS);
            const data = await response.json();

            if (Array.isArray(data)) {
                const formattedUsuarios = data.map((item) => ({
                    id: item.id || crypto.randomUUID(), // Usar UUID se o ID não existir
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
    }, []);

    // Efeitos para sincronização inicial e em intervalo
    useEffect(() => {
        fetchLeadsFromSheet();
        const interval = setInterval(fetchLeadsFromSheet, 60000);
        return () => clearInterval(interval);
    }, [fetchLeadsFromSheet]);

    useEffect(() => {
        fetchLeadsFechadosFromSheet();
        const interval = setInterval(fetchLeadsFechadosFromSheet, 60000);
        return () => clearInterval(interval);
    }, [fetchLeadsFechadosFromSheet]);

    useEffect(() => {
        fetchUsuariosFromSheet();
        const interval = setInterval(fetchUsuariosFromSheet, 60000);
        return () => clearInterval(interval);
    }, [fetchUsuariosFromSheet]);


    // Adicionar um novo usuário (usado em CriarUsuario)
    const adicionarUsuario = (usuario) => {
        setUsuarios((prev) => [...prev, { ...usuario, id: crypto.randomUUID() }]); // Garante um ID único
    };

    // Adicionar um novo lead (usado em CriarLead)
    const adicionarLead = (lead) => {
        // Atualiza o estado localmente. O salvamento no Apps Script é feito dentro de CriarLead
        setLeads((prev) => [lead, ...prev]); // Adiciona o novo lead no topo
    };

    // Atualiza o status de um lead e gerencia a lista de leads fechados
    const atualizarStatusLead = useCallback(async (id, novoStatus, phone) => {
        let leadToUpdate = leads.find((lead) => lead.phone === phone);

        if (!leadToUpdate) {
            console.warn("Lead não encontrado para atualização de status.");
            return;
        }

        // Atualiza o status localmente de imediato
        setLeads((prevLeads) =>
            prevLeads.map((lead) =>
                lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
            )
        );

        const updatedLeadData = {
            id: leadToUpdate.id,
            name: leadToUpdate.name,
            vehiclemodel: leadToUpdate.vehicleModel,
            vehicleyearmodel: leadToUpdate.vehicleYearModel,
            city: leadToUpdate.city,
            phone: leadToUpdate.phone,
            insurancetype: leadToUpdate.insuranceType,
            status: novoStatus,
            confirmado: true,
            insurer: leadToUpdate.insurer,
            insurerconfirmed: leadToUpdate.insurerConfirmed,
            usuarioid: leadToUpdate.usuarioId,
            premioliquido: leadToUpdate.premioLiquido,
            comissao: leadToUpdate.comissao,
            parcelamento: leadToUpdate.parcelamento,
            data: leadToUpdate.createdAt,
            responsavel: leadToUpdate.responsavel,
            editado: new Date().toLocaleString()
        };

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=salvar_lead`, {
                method: 'POST',
                mode: 'no-cors', // Lembre-se de que a configuração CORS deve ser no Apps Script
                body: JSON.stringify(updatedLeadData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Status do lead ${id} (${phone}) atualizado para ${novoStatus} no Sheets.`);
            fetchLeadsFromSheet(); // Recarrega os leads para garantir a sincronização
            fetchLeadsFechadosFromSheet(); // Recarrega os leads fechados também

        } catch (error) {
            console.error('Erro ao atualizar status do lead no Sheets:', error);
            alert('Erro ao atualizar status do lead no servidor.');
        }

        // Lógica para adicionar/atualizar em leadsFechados, se o status for "Fechado"
        if (novoStatus === 'Fechado') {
            setLeadsFechados((prevFechados) => {
                const existingClosedLead = prevFechados.find((closedLead) => closedLead.phone === phone);
                if (existingClosedLead) {
                    return prevFechados.map((closedLead) =>
                        closedLead.phone === phone ? { ...closedLead, Status: novoStatus, confirmado: true } : closedLead
                    );
                } else {
                    const newClosedLead = {
                        ID: leadToUpdate.id || crypto.randomUUID(),
                        name: leadToUpdate.name,
                        vehicleModel: leadToUpdate.vehicleModel,
                        vehicleYearModel: leadToUpdate.vehicleYearModel,
                        city: leadToUpdate.city,
                        phone: leadToUpdate.phone,
                        insurer: leadToUpdate.insuranceType || leadToUpdate.insurer || '',
                        Data: leadToUpdate.createdAt || new Date().toISOString(),
                        Responsavel: leadToUpdate.responsavel || '',
                        Status: "Fechado",
                        Seguradora: leadToUpdate.insurer || '',
                        PremioLiquido: leadToUpdate.premioLiquido || '',
                        Comissao: leadToUpdate.comissao || '',
                        Parcelamento: leadToUpdate.parcelamento || '',
                        confirmado: true,
                    };
                    return [...prevFechados, newClosedLead];
                }
            });
        }
    }, [leads, fetchLeadsFromSheet, fetchLeadsFechadosFromSheet]);


    // Limpa campos específicos de um lead
    const limparCamposLead = (lead) => ({
        ...lead,
        premioLiquido: "",
        comissao: "",
        parcelamento: "",
    });

    // Atualiza a seguradora de um lead
    const atualizarSeguradoraLead = useCallback((id, seguradora) => {
        setLeads((prev) =>
            prev.map((lead) =>
                lead.id === id
                    ? limparCamposLead({ ...lead, insurer: seguradora })
                    : lead
            )
        );
    }, []);

    // Confirma a seguradora e envia os dados para a planilha
    const confirmarSeguradoraLead = useCallback(async (id, premio, seguradora, comissao, parcelamento) => {
        const lead = leadsFechados.find((l) => l.ID == id);

        if (!lead) {
            console.error("Lead fechado não encontrado para confirmação de seguradora.");
            return;
        }

        const updatedLead = {
            ...lead,
            Seguradora: seguradora,
            PremioLiquido: premio,
            Comissao: comissao,
            Parcelamento: parcelamento,
            insurerConfirmed: true // Atualiza o status de confirmação
        };

        // Atualiza localmente a lista de leads fechados
        setLeadsFechados((prev) =>
            prev.map((l) => (l.ID === id ? updatedLead : l))
        );

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=alterar_seguradora`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ lead: updatedLead }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            fetchLeadsFechadosFromSheet(); // Recarrega para garantir consistência
        } catch (error) {
            console.error('Erro ao enviar lead para Apps Script:', error);
            alert('Erro ao salvar os dados da seguradora. Tente novamente.');
        }
    }, [leadsFechados, fetchLeadsFechadosFromSheet]);

    // Atualiza detalhes de um lead fechado (presume-se que seja para LeadsFechados)
    const atualizarDetalhesLeadFechado = useCallback(async (id, campo, valor) => {
        const leadToUpdate = leadsFechados.find((l) => l.ID == id);
        if (!leadToUpdate) {
            console.error("Lead fechado não encontrado para atualização de detalhes.");
            return;
        }
        
        const updatedLead = { ...leadToUpdate, [campo]: valor };

        setLeadsFechados((prev) =>
            prev.map((lead) =>
                lead.ID === id ? { ...lead, [campo]: valor } : lead
            )
        );

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=atualizar_detalhe_fechado`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ lead: updatedLead }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Detalhe "${campo}" do lead ${id} atualizado para "${valor}" no Sheets.`);
            fetchLeadsFechadosFromSheet();
        } catch (error) {
            console.error('Erro ao atualizar detalhes do lead fechado no Sheets:', error);
            alert('Erro ao atualizar detalhes do lead no servidor.');
        }
    }, [leadsFechados, fetchLeadsFechadosFromSheet]);

    // Transfere a responsabilidade de um lead para outro usuário
    const transferirLead = useCallback(async (leadId, responsavelId) => {
        let responsavelNome = null;
        if (responsavelId !== null) {
            const usuario = usuarios.find((u) => u.id == responsavelId);
            if (!usuario) {
                console.warn(`Usuário com ID ${responsavelId} não encontrado.`);
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
    
            const dataToSend = {
                ...leadParaTransferir,
                responsavel: responsavelNome
            };

            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=transferir_lead`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ lead: dataToSend }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Lead ${leadId} transferido para ${responsavelNome || 'Ninguém'} no Sheets.`);
            fetchLeadsFromSheet();
        } catch (error) {
            console.error('Erro ao transferir lead no Sheets:', error);
            alert('Erro ao transferir lead no servidor.');
        }

    }, [usuarios, leads, fetchLeadsFromSheet]);

    // Atualiza o status ou tipo de um usuário
    const atualizarStatusUsuario = useCallback(async (id, novoStatus = null, novoTipo = null) => {
        const usuario = usuarios.find((u) => u.id === id);
        if (!usuario) {
            console.error("Usuário não encontrado para atualização.");
            return;
        }

        const updatedUsuario = { ...usuario };
        if (novoStatus !== null) updatedUsuario.status = novoStatus;
        if (novoTipo !== null) updatedUsuario.tipo = novoTipo;

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=salvar_usuario`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ usuario: updatedUsuario }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // Atualizar localmente
            setUsuarios((prev) =>
                prev.map((u) => (u.id === id ? updatedUsuario : u))
            );
            fetchUsuariosFromSheet();
        } catch (error) {
            console.error('Erro ao atualizar usuário no Apps Script:', error);
            alert('Erro ao atualizar o usuário. Tente novamente.');
        }
    }, [usuarios, fetchUsuariosFromSheet]);


    // Função para abrir os detalhes de um lead e navegar para a rota correta
    const onAbrirLead = useCallback((lead) => {
        setLeadSelecionado(lead);
        let path = '/leads';
        if (lead.status === 'Fechado') path = '/leads-fechados';
        else if (lead.status === 'Perdido') path = '/leads-perdidos';
        navigate(path);
    }, [navigate]);

    // Lógica de autenticação
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

    // Determina se o usuário logado é um administrador
    const isAdmin = usuarioLogado?.tipo === 'Admin';

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar é renderizada aqui. Certifique-se que o componente Sidebar.jsx tenha estilos para ser visível */}
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
                                onAbrirLead={onAbrirLead}
                                leadSelecionado={leadSelecionado}
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
                                onAbrirLead={onAbrirLead}
                            />
                        }
                    />

                    {/* Rota para Criar Lead */}
                    <Route
                        path="/criar-lead"
                        element={<CriarLead googleAppsScriptUrl={GOOGLE_SHEETS_SCRIPT_URL_ACTIONS} adicionarLead={adicionarLead} />}
                    />

                    {isAdmin && (
                        <>
                            <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
                            <Route
                                path="/usuarios"
                                element={
                                    <Usuarios
                                        leads={leads}
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
