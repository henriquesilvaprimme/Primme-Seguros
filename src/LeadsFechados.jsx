import React, { useState } from 'react';

const LeadsFechados = ({
  leads,
  usuarios,
  onConfirmInsurer,
  fetchLeadsFechadosFromSheet,
  isAdmin,
}) => {
  // Filtramos os leads fechados diretamente da prop 'leads'
  // IMPORTANTE: Usamos 'lead.status' (minúscula) como padronizado no App.jsx
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
    // Usamos 'Data' que é a chave formatada no App.jsx (ex: "2024-07-04T...")
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
    // Usamos 'Data' que é a chave formatada no App.jsx (ex: "2024-07-04T...")
    const dataMatch = filtroData ? lead.Data?.startsWith(filtroData) : true;
    return nomeMatch && dataMatch;
  });

  // --- Funções de Formatação e Parse ---

  // Formata um número para moeda BRL
  const formatarMoeda = (valor) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Converte string de moeda (ex: R$ 1.234,56) para float (1234.56)
  const parseMoedaToFloat = (moedaString) => {
    if (typeof moedaString !== 'string' || moedaString.trim() === '') return 0;
    // Remove "R$", pontos de milhar, e substitui vírgula decimal por ponto
    const cleanedString = moedaString.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanedString) || 0;
  };

  // Formata um número para porcentagem (ex: 12.5 para "12,50")
  const formatarPorcentagem = (valor) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Converte string de porcentagem (ex: "12,50" ou "12.5") para float (12.5)
  const parsePorcentagemToFloat = (porcentagemString) => {
    if (typeof porcentagemString !== 'string' || porcentagemString.trim() === '') return 0;
    // Substitui vírgula por ponto para parse
    const cleanedString = porcentagemString.replace(',', '.');
    return parseFloat(cleanedString) || 0;
  };

  // Funções de tratamento de input que chamarão onConfirmInsurer
  // Elas devem passar os valores ATUAIS do lead para os campos não alterados
  const handlePremioLiquidoChange = (leadId, event) => {
    // Ao sair do campo, converte o valor formatado para float e envia
    const numericValue = parseMoedaToFloat(event.target.value);
    onConfirmInsurer(
      leadId,
      numericValue, // Envia o valor numérico tratado
      leads.find((l) => String(l.ID) === String(leadId))?.insurer || '', // Usando lead.insurer
      leads.find((l) => String(l.ID) === String(leadId))?.comissao || 0, // Usando lead.comissao
      leads.find((l) => String(l.ID) === String(leadId))?.parcelamento || '' // Usando lead.parcelamento
    );
  };

  const handleComissaoChange = (leadId, event) => {
    // Ao sair do campo, converte o valor formatado para float e envia
    const numericValue = parsePorcentagemToFloat(event.target.value);
    onConfirmInsurer(
      leadId,
      leads.find((l) => String(l.ID) === String(leadId))?.premioliquido || 0, // Usando lead.premioliquido
      leads.find((l) => String(l.ID) === String(leadId))?.insurer || '', // Usando lead.insurer
      numericValue, // Envia o valor numérico tratado
      leads.find((l) => String(l.ID) === String(leadId))?.parcelamento || '' // Usando lead.parcelamento
    );
  };

  const handleParcelamentoChange = (leadId, event) => {
    onConfirmInsurer(
      leadId,
      leads.find((l) => String(l.ID) === String(leadId))?.premioliquido || 0,
      leads.find((l) => String(l.ID) === String(leadId))?.insurer || '',
      leads.find((l) => String(l.ID) === String(leadId))?.comissao || 0,
      event.target.value // Novo valor de parcelamento
    );
  };

  const handleInsurerChange = (leadId, event) => {
    onConfirmInsurer(
      leadId,
      leads.find((l) => String(l.ID) === String(leadId))?.premioliquido || 0,
      event.target.value, // Novo valor da seguradora
      leads.find((l) => String(l.ID) === String(leadId))?.comissao || 0,
      leads.find((l) => String(l.ID) === String(leadId))?.parcelamento || ''
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
          // Usa as chaves padronizadas aqui: 'insurer', 'premioliquido', 'comissao', 'parcelamento'
          const isButtonDisabled =
            !lead.insurer ||
            parseFloat(lead.premioliquido) === 0 || // Garante que seja numérico e não zero
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
                    // **Ajuste Aqui:** Usa formatarMoeda para exibir o valor que já está no lead
                    value={formatarMoeda(lead.premioliquido)}
                    // onBlur é melhor para campos numéricos formatados, para que o usuário possa digitar livremente e formatar ao sair
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
                    // **Ajuste Aqui:** Usa formatarPorcentagem para exibir o valor que já está no lead
                    value={formatarPorcentagem(lead.comissao)}
                    onBlur={(e) => handleComissaoChange(lead.ID, e)}
                    disabled={!!lead.insurer}
                    maxLength={6} // Aumentado para acomodar até "100,00"
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
                        lead.insurer, // Valor atual do select
                        parseFloat(lead.comissao) || 0, // Garante que é número
                        lead.parcelamento // Valor atual do select
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
