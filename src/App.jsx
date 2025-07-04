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

// URL BASE do seu Web App no Google Apps Script (ATUALIZADA E CONSISTENTE)
const GOOGLE_APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// URLs para as Google Sheets APIs, usando a URL base
const GOOGLE_SHEETS_SCRIPT_URL_GET_LEADS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_SCRIPT_URL_USERS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_usuario`;
const GOOGLE_SHEETS_SCRIPT_URL_LEADS_FECHADOS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_clientes_fechados`;

// URL para ações POST (sem parâmetro 'v' fixo, a ação é passada no corpo ou como 'action')
const GOOGLE_SHEETS_SCRIPT_URL_ACTIONS = GOOGLE_APPS_SCRIPT_BASE_URL;


const App = () => {
    const navigate = useNavigate();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginInput, setLoginInput] = useState('');
    const [senhaInput, setSenhaInput] = useState('');
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [leadsFechados, setLeadsFechados] = useState([]);
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);
    const [leads, setLeads] = useState([]);
    const [leadSelecionado, setLeadSelecionado] = useState(null);
    const [usuarios, setUsuarios] = useState([]); // Garante que 'usuarios' sempre seja um array, mesmo que vazio inicialmente

    // Carrega a imagem de fundo para evitar tela branca no início
    useEffect(() => {
        const img = new Image();
        img.src = '/background.png';
        img.onload = () => setBackgroundLoaded(true);
        img.onerror = () => {
            console.error("Erro ao carregar a imagem de fundo.");
            setBackgroundLoaded(true); // Ainda assim, permita que a tela carregue
        };
    }, []);

    // --- FUNÇÕES DE BUSCA DE DADOS ---

    // Função para buscar leads gerais
    const fetchLeadsFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_GET_LEADS);
            const data = await response.json();

            if (Array.isArray(data)) {
                const sortedData = data.sort((a, b) => {
                    const dateA = new Date(a.editado || a.data || 0);
                    const dateB = new Date(b.editado || b.data || 0);
                    return dateB - dateA;
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
                    insurer: item.insurer || item.Seguradora || '',
                    insurerConfirmed: item.insurerconfirmed === 'true' || item.insurerconfirmed === true,
                    usuarioId: item.usuarioid ? Number(item.usuarioid) : null,
                    premioLiquido: item.premioliquido || item.PremioLiquido || '',
                    comissao: item.comissao || item.Comissao || '',
                    parcelamento: item.parcelamento || item.Parcelamento || '',
                    Data: item.data || item.Data || new Date().toISOString(),
                    Responsavel: item.responsavel || item.Responsavel || '',
                    editado: item.editado || ''
                }));
                
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
    }, [leadSelecionado]);

    // Função para buscar leads fechados
    const fetchLeadsFechadosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_LEADS_FECHADOS);
            const data = await response.json();
            if (Array.isArray(data)) {
                const formattedFechados = data.map(item => ({
                    ID: item.ID || item.id || crypto.randomUUID(),
                    name: item.name || item.Name || '',
                    vehicleModel: item.vehicleModel || item.vehiclemodel || '',
                    vehicleYearModel: item.vehicleYearModel || item.vehicleyearmodel || '',
                    city: item.city || item.City || '',
                    phone: item.phone || item.Telefone || '',
                    insuranceType: item.insuranceType || item.insurancetype || '',
                    Status: item.Status || item.status || '',
                    confirmado: item.confirmado === 'true' || item.confirmado === true,
                    Seguradora: item.Seguradora || item.insurer || '',
                    insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
                    usuarioId: item.usuarioId || item.usuarioid ? Number(item.usuarioId || item.usuarioid) : null,
                    PremioLiquido: item.PremioLiquido || item.premioliquido || '',
                    Comissao: item.Comissao || item.comissao || '',
                    Parcelamento: item.Parcelamento || item.parcelamento || '',
                    Data: item.Data || item.data || '',
                    Responsavel: item.Responsavel || item.responsavel || '',
                    editado: item.editado || ''
                }));
                setLeadsFechados(formattedFechados);
            } else {
                setLeadsFechados([]);
            }
        } catch (error) {
            console.error('Erro ao buscar leads fechados:', error);
            setLeadsFechados([]);
        }
    }, []);

    // Função para buscar usuários (essencial para o login)
    const fetchUsuariosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_USERS);
            const data = await response.json();

            if (Array.isArray(data)) {
                const formattedUsuarios = data.map((item) => ({
                    id: item.id || crypto.randomUUID(),
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
            setUsuarios([]); // Garante que 'usuarios' seja um array vazio em caso de erro
        }
    }, []);

    // --- USE EFFECTS PARA BUSCA INICIAL E INTERVALOS ---

    // Chamar fetchUsuariosFromSheet imediatamente ao montar o componente
    // e depois em intervalos para manter os dados atualizados.
    // É importante que os usuários estejam disponíveis para o login.
    useEffect(() => {
        fetchUsuariosFromSheet();
        const interval = setInterval(fetchUsuariosFromSheet, 15000); // Intervalo para depuração
        return () => clearInterval(interval);
    }, [fetchUsuariosFromSheet]);

    useEffect(() => {
        // Só busca leads se o usuário estiver autenticado, ou se for a primeira carga
        // e ainda não tivermos um usuário logado (para não sobrecarregar)
        if (isAuthenticated || usuarios.length > 0) { // Pequeno ajuste aqui
            fetchLeadsFromSheet();
            const interval = setInterval(fetchLeadsFromSheet, 15000);
            return () => clearInterval(interval);
        }
    }, [fetchLeadsFromSheet, isAuthenticated, usuarios.length]);

    useEffect(() => {
        if (isAuthenticated || usuarios.length > 0) { // Pequeno ajuste aqui
            fetchLeadsFechadosFromSheet();
            const interval = setInterval(fetchLeadsFechadosFromSheet, 15000);
            return () => clearInterval(interval);
        }
    }, [fetchLeadsFechadosFromSheet, isAuthenticated, usuarios.length]);


    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (ADICIONAR/ATUALIZAR) ---

    const adicionarUsuario = (usuario) => {
        setUsuarios((prev) => [...prev, { ...usuario, id: crypto.randomUUID() }]);
    };

    const adicionarLead = (lead) => {
        setLeads((prev) => [lead, ...prev]);
    };

    const atualizarStatusLead = useCallback(async (id, novoStatus, phone) => {
        let leadToUpdate = leads.find((lead) => lead.phone === phone);

        if (!leadToUpdate) {
            console.warn("Lead não encontrado para atualização de status.");
            return;
        }

        setLeads((prevLeads) =>
            prevLeads.map((lead) =>
                lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
            )
        );

        const updatedLeadData = {
            id: leadToUpdate.id,
            name: leadToUpdate.name,
            vehicleModel: leadToUpdate.vehicleModel,
            vehicleYearModel: leadToUpdate.vehicleYearModel,
            city: leadToUpdate.city,
            phone: leadToUpdate.phone,
            insuranceType: leadToUpdate.insuranceType,
            status: novoStatus,
            confirmado: true,
            insurer: leadToUpdate.insurer,
            insurerConfirmed: leadToUpdate.insurerConfirmed,
            usuarioId: leadToUpdate.usuarioId,
            premioLiquido: leadToUpdate.premioLiquido,
            comissao: leadToUpdate.comissao,
            parcelamento: leadToUpdate.parcelamento,
            Data: leadToUpdate.Data,
            Responsavel: leadToUpdate.Responsavel,
            editado: new Date().toLocaleString()
        };

        console.log("Dados enviados para salvar_lead (status):", updatedLeadData);

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=salvar_lead`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(updatedLeadData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Status do lead ${id} (${phone}) atualizado para ${novoStatus} no Sheets.`);
            fetchLeadsFromSheet();
            fetchLeadsFechadosFromSheet();

        } catch (error) {
            console.error('Erro ao atualizar status do lead no Sheets:', error);
            alert('Erro ao atualizar status do lead no servidor.');
        }

        if (novoStatus === 'Fechado') {
            setLeadsFechados((prevFechados) => {
                const existingClosedLead = prevFechados.some((closedLead) => closedLead.phone === phone);
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
                        Seguradora: leadToUpdate.insurer || leadToUpdate.insuranceType || '',
                        Data: leadToUpdate.Data || new Date().toISOString(),
                        Responsavel: leadToUpdate.Responsavel || '',
                        Status: "Fechado",
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

    const limparCamposLead = (lead) => ({
        ...lead,
        PremioLiquido: "",
        Comissao: "",
        Parcelamento: "",
    });

    const atualizarSeguradoraLead = useCallback((id, seguradora) => {
        setLeadsFechados((prev) =>
            prev.map((lead) =>
                lead.ID === id
                    ? { ...lead, Seguradora: seguradora, ...limparCamposLead(lead) }
                    : lead
            )
        );
    }, []);

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
            insurerConfirmed: true
        };

        setLeadsFechados((prev) =>
            prev.map((l) => (l.ID === id ? updatedLead : l))
        );

        console.log("Dados enviados para alterar_seguradora:", updatedLead);

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=alterar_seguradora`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ lead: updatedLead }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Seguradora do lead ${id} confirmada para ${seguradora} no Sheets.`);
            fetchLeadsFechadosFromSheet();
        } catch (error) {
            console.error('Erro ao enviar lead para Apps Script:', error);
            alert('Erro ao salvar os dados da seguradora. Tente novamente.');
        }
    }, [leadsFechados, fetchLeadsFechadosFromSheet]);

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
        
        console.log(`Dados enviados para atualizar_detalhe_fechado (campo: ${campo}, valor: ${valor}):`, updatedLead);

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
                lead.id === leadId ? { ...lead, Responsavel: responsavelNome } : lead
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
                Responsavel: responsavelNome
            };
            console.log("Dados enviados para transferir_lead:", dataToSend);

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

    const atualizarStatusUsuario = useCallback(async (id, novoStatus = null, novoTipo = null) => {
        const usuario = usuarios.find((u) => u.id === id);
        if (!usuario) {
            console.error("Usuário não encontrado para atualização.");
            return;
        }

        const updatedUsuario = { ...usuario };
        if (novoStatus !== null) updatedUsuario.status = novoStatus;
        if (novoTipo !== null) updatedUsuario.tipo = novoTipo;

        console.log("Dados enviados para salvar_usuario:", updatedUsuario);

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=salvar_usuario`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ usuario: updatedUsuario }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
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
            fetchUsuariosFromSheet();
        } catch (error) {
            console.error('Erro ao atualizar usuário no Apps Script:', error);
            alert('Erro ao atualizar o usuário. Tente novamente.');
        }
    }, [usuarios, fetchUsuariosFromSheet]);

    const onAbrirLead = useCallback((lead) => {
        setLeadSelecionado(lead);
        let path = '/leads';
        if (lead.status === 'Fechado') path = '/leads-fechados';
        else if (lead.status === 'Perdido') path = '/leads-perdidos';
        navigate(path);
    }, [navigate]);

    const handleLogin = () => {
        // Garante que 'usuarios' não é undefined ao tentar usar .find
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

    // --- RENDERIZAÇÃO CONDICIONAL ---
    // Sempre renderiza a tela de login se não estiver autenticado.
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

    // Se estiver autenticado, renderiza o layout principal
    const isAdmin = usuarioLogado?.tipo === 'Admin';

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <div style={{ flexShrink: 0, width: '256px' }}>
                <Sidebar isAdmin={isAdmin} usuarioLogado={usuarioLogado} />
            </div>

            <main style={{ flexGrow: 1, overflowY: 'auto' }}>
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
                                        : leads.filter((lead) => lead.Responsavel === usuarioLogado.nome)
                                }
                                usuarioLogado={usuarioLogado}
                            />
                        }
                    />
                    <Route
                        path="/leads"
                        element={
                            <Leads
                                leads={isAdmin ? leads : leads.filter((lead) => lead.Responsavel === usuarioLogado.nome)}
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
                                leads={isAdmin ? leads : leads.filter((lead) => lead.Responsavel === usuarioLogado.nome)}
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
