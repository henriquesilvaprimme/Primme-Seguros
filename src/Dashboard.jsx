import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Nova URL do Google Apps Script
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

const Dashboard = ({ leads }) => {
  // Alterei o nome do estado para leadsDoSheet para evitar conflito com a prop leads
  const [leadsDoSheet, setLeadsDoSheet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Use useCallback para memorizar a função buscarLeads e evitar recriação desnecessária
  const buscarLeads = useCallback(async () => {
    setLoading(true);
    try {
      // Adiciona parâmetros de data à URL se estiverem definidos
      const params = new URLSearchParams();
      params.append('action', 'getLeads'); // Adiciona a ação para o doGet no Apps Script

      if (dataInicio) {
        params.append('dataInicio', dataInicio);
      }
      if (dataFim) {
        params.append('dataFim', dataFim);
      }

      const response = await axios.get(`${GOOGLE_SHEETS_SCRIPT_URL}?${params.toString()}`);
      
      // Garante que o ID e valores numéricos sejam formatados corretamente
      const formattedData = response.data.map(lead => ({
        ...lead,
        id: Number(lead.id),
        PremioLiquido: Number(lead.PremioLiquido) || 0,
        Comissao: Number(lead.Comissao) || 0,
        // Garante que createdAt é um formato de data válido para comparação
        createdAt: lead.createdAt ? new Date(lead.createdAt) : null
      }));
      setLeadsDoSheet(formattedData);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      alert('Erro ao carregar dados do dashboard. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]); // Recria a função se dataInicio ou dataFim mudarem

  // Chama buscarLeads quando o componente é montado ou quando dataInicio/dataFim mudam
  useEffect(() => {
    buscarLeads();
  }, [buscarLeads]);

  // Contadores de Status (usando a prop 'leads' que vem de App.jsx, se aplicável ao seu fluxo)
  // Se você quiser que estes contadores também sejam afetados pelo filtro de data
  // eles deveriam usar 'leadsDoSheet' ou ter uma lógica de filtro similar.
  // Por enquanto, mantive como estava, usando a prop 'leads'.
  const totalLeads = leads.length; // Este ainda usa a prop 'leads'
  const leadsFechadosGeral = leads.filter((lead) => lead.status === 'Fechado').length;
  const leadsPerdidosGeral = leads.filter((lead) => lead.status === 'Perdido').length;
  const leadsEmContatoGeral = leads.filter((lead) => lead.status === 'Em Contato').length;
  const leadsSemContatoGeral = leads.filter((lead) => lead.status === 'Sem Contato').length;

  // Filtragem dos leadsDoSheet com base nas datas selecionadas
  const leadsFiltradosPorData = leadsDoSheet.filter(lead => {
    if (!lead.createdAt) return false; // Ignora leads sem data de criação válida

    const createdDate = lead.createdAt;
    let passesFilter = true;

    if (dataInicio) {
      const start = new Date(dataInicio);
      start.setHours(0, 0, 0, 0); // Zera o horário para comparar apenas a data
      if (createdDate < start) {
        passesFilter = false;
      }
    }
    if (dataFim && passesFilter) {
      const end = new Date(dataFim);
      end.setHours(23, 59, 59, 999); // Define o horário para o final do dia
      if (createdDate > end) {
        passesFilter = false;
      }
    }
    return passesFilter;
  });

  // Contadores por seguradora e cálculos financeiros baseados nos leads filtrados por data
  const portoSeguro = leadsFiltradosPorData.filter((lead) => lead.Seguradora === 'Porto Seguro').length;
  const azulSeguros = leadsFiltradosPorData.filter((lead) => lead.Seguradora === 'Azul Seguros').length;
  const itauSeguros = leadsFiltradosPorData.filter((lead) => lead.Seguradora === 'Itau Seguros').length;
  const demais = leadsFiltradosPorData.filter((lead) => lead.Seguradora === 'Demais Seguradoras').length;

  // Calcular total de prêmio líquido
  const totalPremioLiquido = leadsFiltradosPorData.reduce(
    (acc, curr) => acc + (Number(curr.PremioLiquido) || 0),
    0
  );

  // Calcular média ponderada de comissão
  const somaPonderadaComissao = leadsFiltradosPorData.reduce((acc, lead) => {
    const premio = Number(lead.PremioLiquido) || 0;
    const comissao = Number(lead.Comissao) || 0;
    return acc + premio * (comissao / 100);
  }, 0);

  const comissaoMediaGlobal =
    totalPremioLiquido > 0 ? (somaPonderadaComissao / totalPremioLiquido) * 100 : 0;

  // Estilo comum para as caixas
  const boxStyle = {
    padding: '10px',
    borderRadius: '5px',
    flex: 1,
    color: '#fff',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100px', // Altura mínima para as caixas
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label htmlFor="dataInicio">Data Início:</label>
          <input
            type="date"
            id="dataInicio"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            style={{ marginLeft: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label htmlFor="dataFim">Data Fim:</label>
          <input
            type="date"
            id="dataFim"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            style={{ marginLeft: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        {loading && <p>Carregando dados...</p>}
      </div>

      {/* Primeira linha de contadores (Status - considere usar leadsDoSheet com filtro aqui também) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ ...boxStyle, backgroundColor: '#eee', color: '#333' }}>
          <h3>Total de Leads</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalLeads}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Leads Fechados</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsFechadosGeral}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#F44336' }}>
          <h3>Leads Perdidos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsPerdidosGeral}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#FF9800' }}>
          <h3>Em Contato</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsEmContatoGeral}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#9E9E9E' }}>
          <h3>Sem Contato</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsSemContatoGeral}</p>
        </div>
      </div>

      {/* Segunda linha de contadores (por seguradora - agora filtrados por data) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ ...boxStyle, backgroundColor: '#003366' }}>
          <h3>Porto Seguro</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{portoSeguro}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#87CEFA' }}>
          <h3>Azul Seguros</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{azulSeguros}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#FF8C00' }}>
          <h3>Itau Seguros</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{itauSeguros}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Demais Seguradoras</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{demais}</p>
        </div>
      </div>

      {/* Linha extra para Prêmio Líquido e Comissão (agora filtrados por data) */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        <div style={{ ...boxStyle, backgroundColor: '#3f51b5' }}>
          <h3>Total Prêmio Líquido (Filtrado)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {totalPremioLiquido.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#009688' }}>
          <h3>Média Comissão (Filtrado)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {comissaoMediaGlobal.toFixed(2).replace('.', ',')}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
