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

// --- URLs do Google Apps Script (AJUSTADAS E CONSOLIDADAS) ---
// Use a URL base que você me forneceu. Ela será a raiz para todas as chamadas.
const GOOGLE_APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// URLs para ações GET (apenas para clareza, poderiam ser construídas on-the-fly)
const GOOGLE_SHEETS_SCRIPT_URL_GET_LEADS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_SCRIPT_URL_USERS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_usuario`;
const GOOGLE_SHEETS_SCRIPT_URL_LEADS_FECHADOS = `${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_clientes_fechados`;

// Ações POST usarão a URL base com um parâmetro 'action' no body ou na query.
// Recomendo usar no body (JSON) para POST, como já está sendo feito.
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
    const [usuarios, setUsuarios] = useState([]); // Garante que 'usuarios' é um array desde o início

    // Carrega a imagem de fundo para evitar tela branca no início
    useEffect(() => {
        const img = new Image();
        img.src = '/background.png';
        img.onload = () => setBackgroundLoaded(true);
        img.onerror = () => {
            console.error("Erro ao carregar a imagem de fundo. Exibindo o conteúdo mesmo assim.");
            setBackgroundLoaded(true); // Ainda assim, permita que a tela carregue
        };
    }, []);

    // --- FUNÇÕES DE BUSCA DE DADOS (USANDO useCallback PARA OTIMIZAÇÃO) ---

    // Função para buscar leads gerais
    const fetchLeadsFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_GET_LEADS);
            const data = await response.json();

            // console.log("Dados de Leads Recebidos:", data); // Manter para depuração

            if (Array.isArray(data)) {
                const sortedData = data.sort((a, b) => {
                    const dateA = new Date(a.editado || a.data || 0);
                    const dateB = new Date(b.editado || b.data || 0);
                    return dateB - dateA; // decrescente (mais recente no topo)
                });

                const formattedLeads = sortedData.map((item, index) => ({
                    // ATENÇÃO: As chaves devem corresponder EXATAMENTE aos nomes das colunas no seu Google Sheet.
                    // Ajuste a capitalização conforme necessário (ex: 'Responsavel' ou 'responsavel')
                    id: item.id ? Number(item.id) : index + 1,
                    name: item.name || item.Name || '',
                    vehicleModel: item.vehiclemodel || item.vehicleModel || '',
                    vehicleYearModel: item.vehicleyearmodel || item.vehicleYearModel || '',
                    city: item.city || '',
                    phone: item.phone || item.Telefone || '',
                    insuranceType: item.insurancetype || item.insuranceType || '',
                    status: item.status || 'Selecione o status',
                    confirmado: item.confirmado === 'true' || item.confirmado === true,
                    insurer: item.insurer || item.Seguradora || '', // Preferir 'Seguradora' se for o caso comum para leads em aberto também
                    insurerConfirmed: item.insurerconfirmed === 'true' || item.insurerconfirmed === true,
                    usuarioId: item.usuarioid ? Number(item.usuarioid) : null,
                    premioLiquido: item.premioliquido || item.PremioLiquido || '',
                    comissao: item.comissao || item.Comissao || '',
                    parcelamento: item.parcelamento || item.Parcelamento || '',
                    Data: item.data || item.Data || new Date().toISOString(), // Use 'Data' se for a coluna no Sheets
                    Responsavel: item.responsavel || item.Responsavel || '', // Use 'Responsavel' se for a coluna no Sheets
                    editado: item.editado || ''
                }));

                // console.log("Leads Formatados:", formattedLeads); // Manter para depuração

                // Evita re-renderizar desnecessariamente se o lead selecionado não mudou.
                // Mas, se o lead selecionado foi atualizado no Sheet, queremos que o componente o reflita.
                if (!leadSelecionado) {
                    setLeads(formattedLeads);
                } else {
                    const updatedSelectedLead = formattedLeads.find(l => l.id === leadSelecionado.id);
                    if (updatedSelectedLead) {
                        setLeads(formattedLeads); // Atualiza a lista completa
                        setLeadSelecionado(updatedSelectedLead); // Garante que o selecionado reflita as mudanças
                    } else {
                        setLeads(formattedLeads);
                    }
                }
            } else {
                setLeads([]);
            }
        } catch (error) {
            console.error('Erro ao buscar leads do Google Sheets:', error);
            setLeads([]);
        }
    }, [leadSelecionado]); // Depende de leadSelecionado para saber se deve atualizar o estado

    // Função para buscar leads fechados
    const fetchLeadsFechadosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_LEADS_FECHADOS);
            const data = await response.json();
            // console.log("Leads Fechados Recebidos:", data); // Manter para depuração

            if (Array.isArray(data)) {
                const formattedFechados = data.map(item => ({
                    // ATENÇÃO: As chaves devem corresponder EXATAMENTE aos nomes das colunas no seu Google Sheet de Leads Fechados.
                    ID: item.ID || item.id || crypto.randomUUID(), // Use ID com 'I' maiúsculo se for a coluna
                    name: item.name || item.Name || '',
                    vehicleModel: item.vehicleModel || item.vehiclemodel || '',
                    vehicleYearModel: item.vehicleYearModel || item.vehicleyearmodel || '',
                    city: item.city || item.City || '',
                    phone: item.phone || item.Telefone || '',
                    insuranceType: item.insuranceType || item.insurancetype || '',
                    Status: item.Status || item.status || '', // Use 'Status' com 'S' maiúsculo
                    confirmado: item.confirmado === 'true' || item.confirmado === true,
                    Seguradora: item.Seguradora || item.insurer || '', // Use 'Seguradora' com 'S' maiúsculo
                    insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
                    usuarioId: item.usuarioId || item.usuarioid ? Number(item.usuarioId || item.usuarioid) : null,
                    PremioLiquido: item.PremioLiquido || item.premioliquido || '', // Use 'PremioLiquido' com 'P' e 'L' maiúsculos
                    Comissao: item.Comissao || item.comissao || '', // Use 'Comissao' com 'C' maiúsculo
                    Parcelamento: item.Parcelamento || item.parcelamento || '', // Use 'Parcelamento' com 'P' maiúsculo
                    Data: item.Data || item.data || '', // Use 'Data' com 'D' maiúsculo
                    Responsavel: item.Responsavel || item.responsavel || '', // Use 'Responsavel' com 'R' maiúsculo
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

    // Função para buscar usuários (CRÍTICA PARA O LOGIN)
    const fetchUsuariosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL_USERS);
            const data = await response.json();
            // console.log("Usuários Recebidos:", data); // Manter para depuração

            if (Array.isArray(data)) {
                const formattedUsuarios = data.map((item) => ({
                    // ATENÇÃO: As chaves devem corresponder EXATAMENTE aos nomes das colunas no seu Google Sheet de Usuários.
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

    // Este useEffect é CRÍTICO: carrega os usuários ANTES de tudo para permitir o login.
    useEffect(() => {
        fetchUsuariosFromSheet();
        const interval = setInterval(fetchUsuariosFromSheet, 30000); // 30 segundos (reduzido para depuração)
        return () => clearInterval(interval);
    }, [fetchUsuariosFromSheet]);

    // Busca leads e leads fechados APENAS se o usuário estiver autenticado ou se já temos usuários carregados.
    // Isso evita chamadas desnecessárias antes do login.
    useEffect(() => {
        if (isAuthenticated || usuarios.length > 0) {
            fetchLeadsFromSheet();
            const interval = setInterval(fetchLeadsFromSheet, 60000);
            return () => clearInterval(interval);
        }
    }, [fetchLeadsFromSheet, isAuthenticated, usuarios.length]);

    useEffect(() => {
        if (isAuthenticated || usuarios.length > 0) {
            fetchLeadsFechadosFromSheet();
            const interval = setInterval(fetchLeadsFechadosFromSheet, 60000);
            return () => clearInterval(interval);
        }
    }, [fetchLeadsFechadosFromSheet, isAuthenticated, usuarios.length]);

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (ADICIONAR/ATUALIZAR) ---

    const adicionarUsuario = (usuario) => {
        setUsuarios((prev) => [...prev, { ...usuario, id: crypto.randomUUID() }]);
    };

    // Função para adicionar um NOVO LEAD (apenas no estado local, o salvamento no Sheets é feito em CriarLead)
    const adicionarLead = (lead) => {
        setLeads((prev) => [lead, ...prev]);
    };

    // Função para atualizar o status de um lead no Sheets
    const atualizarStatusLead = useCallback(async (id, novoStatus, phone) => {
        let leadToUpdate = leads.find((lead) => lead.phone === phone);

        if (!leadToUpdate) {
            console.warn("Lead não encontrado para atualização de status.");
            return;
        }

        // Atualiza o estado local imediatamente para feedback visual
        setLeads((prevLeads) =>
            prevLeads.map((lead) =>
                lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
            )
        );

        // PREPARA OS DADOS PARA ENVIO - AS CHAVES DEVEM CORRESPONDER ÀS COLUNAS NO SEU GOOGLE SHEET DE LEADS GERAIS
        const updatedLeadData = {
            id: leadToUpdate.id,
            name: leadToUpdate.name,
            vehicleModel: leadToUpdate.vehicleModel,
            vehicleYearModel: leadToUpdate.vehicleYearModel,
            city: leadToUpdate.city,
            phone: leadToUpdate.phone,
            insuranceType: leadToUpdate.insuranceType,
            status: novoStatus, // -> Coluna 'status' ou 'Status' no Sheets
            confirmado: true,
            insurer: leadToUpdate.insurer, // -> Coluna 'insurer' ou 'Seguradora' no Sheets
            insurerConfirmed: leadToUpdate.insurerConfirmed,
            usuarioId: leadToUpdate.usuarioId,
            premioLiquido: leadToUpdate.premioLiquido,
            comissao: leadToUpdate.comissao,
            parcelamento: leadToUpdate.parcelamento,
            Data: leadToUpdate.Data, // -> Coluna 'Data' no Sheets
            Responsavel: leadToUpdate.Responsavel, // -> Coluna 'Responsavel' no Sheets
            editado: new Date().toLocaleString()
        };

        console.log("Dados enviados para salvar_lead (status):", updatedLeadData);

        try {
            const response = await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=salvar_lead`, {
                method: 'POST',
                mode: 'no-cors', // Mantenha no-cors se não estiver lendo a resposta do Apps Script
                body: JSON.stringify(updatedLeadData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Status do lead ${id} (${phone}) atualizado para ${novoStatus} no Sheets.`);
            fetchLeadsFromSheet(); // Re-busca os leads após a atualização para refletir no Dashboard/Leads
            if (novoStatus === 'Fechado') {
                fetchLeadsFechadosFromSheet(); // Re-busca os leads fechados também, caso ele tenha mudado para fechado
            }

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
                        // Certifique-se que estas chaves batem EXATAMENTE com as colunas do Sheet de Leads Fechados
                        ID: leadToUpdate.id || crypto.randomUUID(),
                        name: leadToUpdate.name,
                        vehicleModel: leadToUpdate.vehicleModel,
                        vehicleYearModel: leadToUpdate.vehicleYearModel,
                        city: leadToUpdate.city,
                        phone: leadToUpdate.phone,
                        Seguradora: leadToUpdate.insurer || leadToUpdate.insuranceType || '', // Use a chave da coluna no Sheets
                        Data: leadToUpdate.Data || new Date().toISOString(), // Use a chave da coluna no Sheets
                        Responsavel: leadToUpdate.Responsavel || '', // Use a chave da coluna no Sheets
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
    }, [leads, fetchLeadsFromSheet, fetchLeadsFechadosFromSheet]); // Adicionado leads como dependência

    const limparCamposLead = (lead) => ({
        ...lead,
        PremioLiquido: "", // Use as mesmas chaves que o Sheets espera
        Comissao: "",
        Parcelamento: "",
    });

    // Esta função apenas atualiza o estado local para Leads Fechados.
    // A persistência no Sheets ocorre em 'confirmarSeguradoraLead'.
    const atualizarSeguradoraLead = useCallback((id, seguradora) => {
        setLeadsFechados((prev) =>
            prev.map((lead) =>
                lead.ID === id
                    ? { ...lead, Seguradora: seguradora, ...limparCamposLead(lead) } // Use 'Seguradora'
                    : lead
            )
        );
    }, []);

    // Função para confirmar seguradora e detalhes do lead fechado
    const confirmarSeguradoraLead = useCallback(async (id, premio, seguradora, comissao, parcelamento) => {
        const lead = leadsFechados.find((l) => l.ID == id);

        if (!lead) {
            console.error("Lead fechado não encontrado para confirmação de seguradora.");
            return;
        }

        // PREPARA OS DADOS PARA ENVIO - AS CHAVES DEVEM CORRESPONDER ÀS COLUNAS NO SEU GOOGLE SHEET DE LEADS FECHADOS
        const updatedLead = {
            ...lead, // Mantém todas as propriedades existentes
            Seguradora: seguradora, // -> Coluna 'Seguradora' no Sheets
            PremioLiquido: premio, // -> Coluna 'PremioLiquido' no Sheets
            Comissao: comissao, // -> Coluna 'Comissao' no Sheets
            Parcelamento: parcelamento, // -> Coluna 'Parcelamento' no Sheets
            insurerConfirmed: true // Se esta for uma coluna no Sheets
        };

        // Atualiza o estado local imediatamente
        setLeadsFechados((prev) =>
            prev.map((l) => (l.ID === id ? updatedLead : l))
        );

        console.log("Dados enviados para alterar_seguradora:", updatedLead);

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=alterar_seguradora`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ lead: updatedLead }), // Envia o objeto lead completo
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Seguradora do lead ${id} confirmada para ${seguradora} no Sheets.`);
            fetchLeadsFechadosFromSheet(); // Re-busca para garantir a consistência
        } catch (error) {
            console.error('Erro ao enviar lead para Apps Script:', error);
            alert('Erro ao salvar os dados da seguradora. Tente novamente.');
        }
    }, [leadsFechados, fetchLeadsFechadosFromSheet]);

    // Função para atualizar detalhes de um lead fechado (campo genérico)
    const atualizarDetalhesLeadFechado = useCallback(async (id, campo, valor) => {
        const leadToUpdate = leadsFechados.find((l) => l.ID == id);
        if (!leadToUpdate) {
            console.error("Lead fechado não encontrado para atualização de detalhes.");
            return;
        }
        
        // Crie uma cópia do lead e atualize o campo específico
        // O NOME DO 'CAMPO' DEVE SER EXATAMENTE O NOME DA COLUNA NO SEU GOOGLE SHEET
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
                body: JSON.stringify({ lead: updatedLead }), // Envia o objeto lead completo
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Detalhe "${campo}" do lead ${id} atualizado para "${valor}" no Sheets.`);
            fetchLeadsFechadosFromSheet(); // Re-busca para garantir a consistência
        } catch (error) {
            console.error('Erro ao atualizar detalhes do lead fechado no Sheets:', error);
            alert('Erro ao atualizar detalhes do lead no servidor.');
        }
    }, [leadsFechados, fetchLeadsFechadosFromSheet]);

    // Função para transferir um lead para outro responsável
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

        // Atualiza o estado local imediatamente
        setLeads((prev) =>
            prev.map((lead) =>
                lead.id === leadId ? { ...lead, Responsavel: responsavelNome } : lead // Use 'Responsavel' (capitalização da coluna)
            )
        );

        try {
            const leadParaTransferir = leads.find(l => l.id === leadId);
            if (!leadParaTransferir) {
                console.error("Lead não encontrado para transferência:", leadId);
                return;
            }
    
            // Dados a serem enviados, garantindo que 'Responsavel' seja a chave correta no Sheet
            const dataToSend = {
                ...leadParaTransferir,
                Responsavel: responsavelNome // -> Coluna 'Responsavel' no Sheets
            };
            console.log("Dados enviados para transferir_lead:", dataToSend);

            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=transferir_lead`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ lead: dataToSend }), // Envia o objeto lead completo
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Lead ${leadId} transferido para ${responsavelNome || 'Ninguém'} no Sheets.`);
            fetchLeadsFromSheet(); // Re-busca para garantir a consistência
        } catch (error) {
            console.error('Erro ao transferir lead no Sheets:', error);
            alert('Erro ao transferir lead no servidor.');
        }

    }, [usuarios, leads, fetchLeadsFromSheet]); // Adicionado leads como dependência

    // Função para atualizar status ou tipo de usuário
    const atualizarStatusUsuario = useCallback(async (id, novoStatus = null, novoTipo = null) => {
        const usuario = usuarios.find((u) => u.id === id);
        if (!usuario) {
            console.error("Usuário não encontrado para atualização.");
            return;
        }

        // PREPARA OS DADOS PARA ENVIO - AS CHAVES DEVEM CORRESPONDER ÀS COLUNAS NO SEU GOOGLE SHEET DE USUÁRIOS
        const updatedUsuario = { ...usuario };
        if (novoStatus !== null) updatedUsuario.status = novoStatus; // -> Coluna 'status' ou 'Status' no Sheets
        if (novoTipo !== null) updatedUsuario.tipo = novoTipo; // -> Coluna 'tipo' ou 'Tipo' no Sheets

        console.log("Dados enviados para salvar_usuario:", updatedUsuario);

        try {
            await fetch(`${GOOGLE_SHEETS_SCRIPT_URL_ACTIONS}?action=salvar_usuario`, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ usuario: updatedUsuario }), // Envia o objeto usuario completo
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
            fetchUsuariosFromSheet(); // Re-busca para garantir a consistência
        } catch (error) {
            console.error('Erro ao atualizar usuário no Apps Script:', error);
            alert('Erro ao atualizar o usuário. Tente novamente.');
        }
    }, [usuarios, fetchUsuariosFromSheet]);

    // Função para abrir detalhes de um lead e navegar para a rota correta
    const onAbrirLead = useCallback((lead) => {
        setLeadSelecionado(lead);
        let path = '/leads';
        if (lead.status === 'Fechado') path = '/leads-fechados';
        else if (lead.status === 'Perdido') path = '/leads-perdidos';
        navigate(path);
    }, [navigate]);

    // Lógica de autenticação
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
                                        : leads.filter((lead) => lead.Responsavel === usuarioLogado.nome) // Use 'Responsavel'
                                }
                                usuarioLogado={usuarioLogado}
                            />
                        }
                    />
                    <Route
                        path="/leads"
                        element={
                            <Leads
                                leads={isAdmin ? leads : leads.filter((lead) => lead.Responsavel === usuarioLogado.nome)} // Use 'Responsavel'
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
                                leads={isAdmin ? leads : leads.filter((lead) => lead.Responsavel === usuarioLogado.nome)} // Use 'Responsavel'
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
