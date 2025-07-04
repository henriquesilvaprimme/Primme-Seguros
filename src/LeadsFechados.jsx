import React, { useState } from 'react';

const LeadsFechados = ({
  leads,
  usuarios,
  onConfirmInsurer,
  fetchLeadsFechadosFromSheet,
  isAdmin,
}) => {
  // Filtramos os leads fechados diretamente da prop 'leads'
  // IMPORTANTE: Agora usamos 'lead.status' (minúscula) como padronizado no App.jsx
  const fechados = leads.filter((lead) => lead.status === 'Fechado');

  // Obtém o mês e ano atual no formato 'YYYY-MM'
  const getMesAnoAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  // Os estados para os filtros de input continuam os mesmos
  const [nomeInput, setNomeInput] = useState('');
  const [dataInput, setDataInput] = useState(getMesAnoAtual());
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroData, setFiltroData] = useState(getMesAnoAtual());

  // Estado para controle de atualização (para o botão de refresh manual)
  const [atualizando, setAtualizando] = useState(false);

  const normalizarTexto = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .toLowerCase();

  const aplicarFiltroNome = () => {
    setFiltroNome(nomeInput.trim());
  };

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
  };

  // Função para atualizar leads fechados com mensagem de carregamento
  const handleAtualizar = async () => {
    setAtualizando(true);
    try {
      await fetchLeadsFechadosFromSheet(); // Esta função busca todos os leads (inclusive fechados)
    } catch (error) {
      console.error('Erro ao atualizar leads fechados:', error);
    }
    setAtualizando(false);
  };

  // Ordena os leads fechados
  const fechadosOrdenados = [...fechados].sort((a, b) => {
    // Usamos 'Data' que é a chave formatada no App.jsx
    const dateA = new Date(a.Data);
    const dateB = new Date(b.Data);
    return dateB - dateA; // mais recente primeiro
  });

  // Aplica os filtros de nome e data
  const leadsFiltrados = fechadosOrdenados.filter((lead) => {
    // Usamos 'name' que é a chave padronizada no App.jsx
    const nomeMatch = normalizarTexto(lead.name || '').includes(
      normalizarTexto(filtroNome || '')
    );
    // Usamos 'Data' que é a chave formatada no App.jsx
    const dataMatch = filtroData ? lead.Data?.startsWith(filtroData) : true;
    return nomeMatch && dataMatch;
  });

  const formatarMoeda = (valor) => {
    // Certifique-se de que o valor é um número antes de formatar
    const num = parseFloat(valor);
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Funções de tratamento de input que chamarão onConfirmInsurer
  // Elas devem passar os valores ATUAIS do lead para os campos não alterados
  const handlePremioLiquidoChange = (leadId, event) => {
    const rawValue = event.target.value;
    // Remove tudo que não for número e vírgula, e substitui vírgula por ponto
    const cleanedValue = rawValue.replace(/[^0-9,]/g, '').replace(',', '.');
    const numericValue = parseFloat(cleanedValue) || 0; // Converte para número ou 0

    onConfirmInsurer(
      leadId,
      numericValue, // Envia o valor numérico tratado
      leads.find(l => String(l.ID) === String(leadId))?.Seguradora || '',
      leads.find(l => String(l.ID) === String(leadId))?.Comissao || '',
      leads.find(l => String(l.ID) === String(leadId))?.Parcelamento || ''
    );
  };

  const handleComissaoChange = (leadId, event) => {
    const rawValue = event.target.value;
    const cleanedValue = rawValue.replace(/[^0-9,.]/g, ''); // Permite números, vírgula e ponto
    let formattedValue = cleanedValue.replace(',', '.'); // Converte vírgula para ponto para parseFloat
    const numericValue = parseFloat(formattedValue) || 0;

    // Limita a duas casas decimais se houver ponto
    if (formattedValue.includes('.')) {
        const parts = formattedValue.split('.');
        if (parts[1].length > 2) {
            formattedValue = parts[0] + '.' + parts[1].substring(0, 2);
        }
    }
    // Adiciona o % se não tiver
    if (formattedValue !== '' && !formattedValue.endsWith('%')) {
        formattedValue += '';
    }


    onConfirmInsurer(
      leadId,
      leads.find(l => String(l.ID) === String(leadId))?.PremioLiquido || 0,
      leads.find(l => String(l.ID) === String(leadId))?.Seguradora || '',
      numericValue, // Envia o valor numérico tratado
      leads.find(l => String(l.ID) === String(leadId))?.Parcelamento || ''
    );
  };

  const handleParcelamentoChange = (leadId, event) => {
    onConfirmInsurer(
      leadId,
      leads.find(l => String(l.ID) === String(leadId))?.PremioLiquido || 0,
      leads.find(l => String(l.ID) === String(leadId))?.Seguradora || '',
      leads.find(l => String(l.ID) === String(leadId))?.Comissao || 0,
      event.target.value // Novo valor de parcelamento
    );
  };

  const handleInsurerChange = (leadId, event) => {
    onConfirmInsurer(
      leadId,
      leads.find(l => String(l.ID) === String(leadId))?.PremioLiquido || 0,
      event.target.value, // Novo valor da seguradora
      leads.find(l => String(l.ID) === String(leadId))?.Comissao || 0,
      leads.find(l => String(l.ID) === String(leadId))?.Parcelamento || ''
    );
  };

  // Styles (mantidos os mesmos)
  const inputWrapperStyle = {
    position: 'relative',
    width: '100%',
    marginBottom: '8px',
  };

  const prefixStyle = {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#555',
    fontWeight: 'bold',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  const inputWithPrefixStyle = {
    paddingLeft: '30px',
    paddingRight: '8px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    height: '36px',
    boxSizing: 'border-box',
    textAlign: 'right',
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Leads Fechados</h1>

        <button title="Clique para atualizar os dados" onClick={handleAtualizar}>
          🔄
        </button>

        {atualizando && (
          <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
            Atualizando Página...
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Filtro nome: centralizado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: '1',
            justifyContent: 'center',
            minWidth: '280px',
          }}
        >
          <button
            onClick={aplicarFiltroNome}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              height: '36px',
            }}
          >
            Filtrar
          </button>
          <input
            type="text"
            placeholder="Filtrar por nome"
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              width: '220px',
              maxWidth: '100%',
              height: '36px',
              fontSize: '14px',
            }}
            title="Filtrar leads pelo nome (contém)"
          />
        </div>

        {/* Filtro data: canto direito */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '230px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={aplicarFiltroData}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              height: '36px',
            }}
          >
            Filtrar
          </button>
          <input
            type="month"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              cursor: 'pointer',
              height: '36px',
              fontSize: '14px',
            }}
            title="Filtrar leads pelo mês e ano de criação"
          />
        </div>
      </div>

      {leadsFiltrados.length === 0 ? (
        <p>Não há leads fechados que correspondam ao filtro aplicado.</p>
      ) : (
        leadsFiltrados.map((lead) => {
          const containerStyle = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '5px',
            // Usa 'insurer' para verificar se foi confirmado
            backgroundColor: lead.insurer ? '#e6f4ea' : '#fff',
            border: lead.insurer ? '2px solid #4CAF50' : '1px solid #ddd',
          };

          const responsavel = usuarios.find(
            (u) => u.nome === lead.Responsavel && isAdmin
          );

          // Verifica se todos os campos estão preenchidos para habilitar o botão
          // Usa as chaves padronizadas aqui também: 'insurer', 'premioliquido', 'comissao', 'parcelamento'
          const isButtonDisabled =
            !lead.insurer ||
            !lead.premioliquido ||
            parseFloat(lead.premioliquido) === 0 || // Garante que seja numérico e não zero
            !lead.comissao ||
            parseFloat(lead.comissao) === 0 || // Garante que seja numérico e não zero
            !lead.parcelamento ||
            lead.parcelamento === '';

          return (
            <div key={lead.ID} style={containerStyle}>
              <div style={{ flex: 1 }}>
                <h3>{lead.name}</h3>
                <p>
                  <strong>Modelo:</strong> {lead.vehicleModel}
                </p>
                <p>
                  <strong>Ano/Modelo:</strong> {lead.vehicleYearModel}
                </p>
                <p>
                  <strong>Cidade:</strong> {lead.city}
                </p>
                <p>
                  <strong>Telefone:</strong> {lead.phone}
                </p>
                <p>
                  {/* Exibe o nome da seguradora do campo padronizado */}
                  <strong>Tipo de Seguro:</strong> {lead.insuranceType}
                </p>

                {responsavel && (
                  <p style={{ marginTop: '10px', color: '#007bff' }}>
                    Transferido para <strong>{responsavel.nome}</strong>
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '250px',
                }}
              >
                <select
                  // Usa 'insurer' para o valor do select
                  value={lead.insurer || ''}
                  onChange={(e) => handleInsurerChange(lead.ID, e.target.value)}
                  // Desabilita se já houver uma seguradora preenchida
                  disabled={!!lead.insurer}
                  style={{
                    padding: '8px',
                    border: '2px solid #ccc',
                    borderRadius: '4px',
                    width: '100%',
                    marginBottom: '8px',
                  }}
                >
                  <option value="">Selecione a seguradora</option>
                  <option value="Porto Seguro">Porto Seguro</option>
                  <option value="Azul Seguros">Azul Seguros</option>
                  <option value="Itau Seguros">Itau Seguros</option>
                  <option value="Demais Seguradoras">Demais Seguradoras</option>
                </select>

                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>R$</span>
                  <input
                    type="text"
                    placeholder="Prêmio Líquido"
                    // Usa 'premioliquido' e formata para exibição
                    value={formatarMoeda(lead.premioliquido)}
                    // Passa o evento inteiro para extrair o valor corretamente
                    onBlur={(e) => handlePremioLiquidoChange(lead.ID, e)}
                    disabled={!!lead.insurer}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>%</span>
                  <input
                    type="text"
                    placeholder="Comissão (%)"
                    // Usa 'comissao' para o valor do input
                    value={lead.comissao || ''}
                    // Passa o evento inteiro para extrair o valor corretamente
                    onBlur={(e) => handleComissaoChange(lead.ID, e)}
                    disabled={!!lead.insurer}
                    maxLength={4}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <select
                  // Usa 'parcelamento' para o valor do select
                  value={lead.parcelamento || ''}
                  onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                  disabled={!!lead.insurer}
                  style={{
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    width: '100%',
                    marginBottom: '8px',
                  }}
                >
                  <option value="">Parcelamento</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={`${i + 1}x`}>
                      {i + 1}x
                    </option>
                  ))}
                </select>

                {!lead.insurer ? ( // Verifica se 'insurer' está preenchido
                  <button
                    onClick={() =>
                      onConfirmInsurer(
                        lead.ID,
                        parseFloat(lead.premioliquido) || 0, // Garante que é número
                        lead.insurer, // Valor atual do input
                        parseFloat(lead.comissao) || 0, // Garante que é número
                        lead.parcelamento
                      )
                    }
                    disabled={isButtonDisabled}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isButtonDisabled ? '#999' : '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isButtonDisabled ? 'default' : 'pointer',
                      width: '100%',
                    }}
                  >
                    Confirmar Seguradora
                  </button>
                ) : (
                  <span
                    style={{ marginTop: '8px', color: 'green', fontWeight: 'bold' }}
                  >
                    Status confirmado
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LeadsFechados;
