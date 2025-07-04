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
import CriarLead from './pages/CriarLead';

// --- Novas Constantes ---
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=getLeads';
const GOOGLE_SHEETS_USERS = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';
const GOOGLE_SHEETS_LEADS_FECHADOS = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=pegar_clientes_fechados';
const GOOGLE_SHEETS_LEAD_CREATION_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?action=criar_lead';

// Adicionada a URL do novo App Web
const GOOGLE_SHEETS_APP_WEB_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
// --- Fim Novas Constantes ---

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
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL); // Usa sua URL original
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
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS); // Usa sua URL original
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
        const response = await fetch(GOOGLE_SHEETS_USERS + '?v=pegar_usuario'); // Usa sua URL original + parâmetro
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
    setUsuarios((prev) => [...prev, { ...usuario, id: prev.length + 1 }]);
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
      confirmado: true,
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
      await fetch(`${GOOGLE_SHEETS_LEAD_CREATION_URL.split('?')[0]}?action=salvar_lead`, { // Pega a URL base, ignora o ?action=criar_lead e adiciona salvar_lead
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
              id: leadParaAdicionar.id || null,
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
      await fetch(`${GOOGLE_SHEETS_LEAD_CREATION_URL.split('?')[0]}?action=alterar_seguradora`, { // Pega a URL base
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: lead }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Seguradora e detalhes do lead fechado atualizados no Sheets.');
      fetchLeadsFechadosFromSheet();
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

      leadParaTransferir.responsavel = responsavelNome;

      // Usa a URL base do Apps Script com o parâmetro 'action=transferir_lead'
      await fetch(`${GOOGLE_
