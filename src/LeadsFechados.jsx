import React, { useState } from 'react'; // Removemos useEffect, pois não será mais necessário para 'valores'

const LeadsFechados = ({
  leads,
  usuarios,
  // onUpdateInsurer, // Não precisamos mais desta prop separada
  onConfirmInsurer, // Esta função será o ponto central de atualização
  // onUpdateDetalhes, // Não precisamos mais desta prop separada
  fetchLeadsFechadosFromSheet, // Ainda útil para o botão de refresh manual
  isAdmin,
}) => {
  // Filtramos os leads fechados diretamente da prop 'leads'
  // Esta variável será recalculada sempre que a prop 'leads' mudar
  const fechados = leads.filter((lead) => lead.Status === 'Fechado');

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
      await fetchLeadsFechadosFromSheet();
    } catch (error) {
      console.error('Erro ao atualizar leads fechados:', error);
    }
    setAtualizando(false);
  };

  const fechadosOrdenados = [...fechados].sort((a, b) => {
    const dataA = new Date(a.Data);
    const dataB = new Date(b.Data);
    return dataB - dataA; // mais recente primeiro
  });

  const leadsFiltrados = fechadosOrdenados.filter((lead) => {
    const nomeMatch = normalizarTexto(lead.name || '').includes(
      normalizarTexto(filtroNome || '')
    );
    const dataMatch = filtroData ? lead.Data?.startsWith(filtroData) : true;
    return nomeMatch && dataMatch;
  });

  const formatarMoeda = (valorCentavos) => {
    if (isNaN(valorCentavos) || valorCentavos === null) return '';
    return (valorCentavos / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Funções de tratamento de input que chamarão onConfirmInsurer
  const handlePremioLiquidoChange = (leadId, currentValue) => {
    const somenteNumeros = currentValue.replace(/\D/g, '');
    let valorCentavos = parseInt(somenteNumeros, 10);
    if (isNaN(valorCentavos)) valorCentavos = 0;

    // Apenas chame onConfirmInsurer. O App.jsx vai buscar os dados atualizados
    // e o componente re-renderizará com o novo valor da prop 'leads'.
    // Importante: onConfirmInsurer deve ser assíncrona e fazer o refresh.
    onConfirmInsurer(
      leadId,
      valorCentavos / 100, // Envia em Reais para o GAS
      leads.find(l => l.ID === leadId)?.Seguradora || '',
      leads.find(l => l.ID === leadId)?.Comissao || '',
      leads.find(l => l.ID === leadId)?.Parcelamento || ''
    );
  };

  const handleComissaoChange = (leadId, currentValue) => {
    const regex = /^(\d{0,2})(,?\d{0,1})?$/;
    const valorFormatado = currentValue.replace('.', ','); // Garante uso da vírgula

    if (valorFormatado === '' || regex.test(valorFormatado)) {
      const valorLimitado = valorFormatado.slice(0, 4);
      const valorFloat = parseFloat(valorLimitado.replace(',', '.')); // Converte para float para enviar

      onConfirmInsurer(
        leadId,
        leads.find(l => l.ID === leadId)?.PremioLiquido || 0, // Mantém o prêmio líquido existente
        leads.find(l => l.ID === leadId)?.Seguradora || '',
        isNaN(valorFloat) ? '' : valorFloat,
        leads.find(l => l.ID === leadId)?.Parcelamento || ''
      );
    }
  };

  const handleParcelamentoChange = (leadId, currentValue) => {
    onConfirmInsurer(
      leadId,
      leads.find(l => l.ID === leadId)?.PremioLiquido || 0,
      leads.find(l => l.ID === leadId)?.Seguradora || '',
      leads.find(l => l.ID === leadId)?.Comissao || '',
      currentValue // Novo valor de parcelamento
    );
  };

  const handleInsurerChange = (leadId, currentValue) => {
    onConfirmInsurer(
      leadId,
      leads.find(l => l.ID === leadId)?.PremioLiquido || 0,
      currentValue, // Novo valor da seguradora
      leads.find(l => l.ID === leadId)?.Comissao || '',
      leads.find(l => l.ID === leadId)?.Parcelamento || ''
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
            backgroundColor: lead.Seguradora ? '#e6f4ea' : '#fff',
            border: lead.Seguradora ? '2px solid #4CAF50' : '1px solid #ddd',
          };

          const responsavel = usuarios.find(
            (u) => u.nome === lead.Responsavel && isAdmin
          );

          // Verifica se todos os campos estão preenchidos para habilitar o botão
          const isButtonDisabled =
            !lead.Seguradora ||
            !lead.PremioLiquido ||
            lead.PremioLiquido === 0 ||
            !lead.Comissao ||
            lead.Comissao === '' ||
            !lead.Parcelamento ||
            lead.Parcelamento === '';

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
                  <strong>Tipo de Seguro:</strong> {lead.insurer}
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
                  value={lead.Seguradora || ''} // Usando o valor direto do lead
                  onChange={(e) => handleInsurerChange(lead.ID, e.target.value)}
                  disabled={!!lead.Seguradora}
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
                    // Valor do input vem diretamente da prop lead.PremioLiquido
                    value={formatarMoeda(Math.round(parseFloat(lead.PremioLiquido || 0) * 100))}
                    onBlur={(e) => handlePremioLiquidoChange(lead.ID, e.target.value)}
                    disabled={!!lead.Seguradora}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>%</span>
                  <input
                    type="text"
                    placeholder="Comissão (%)"
                    // Valor do input vem diretamente da prop lead.Comissao
                    value={lead.Comissao || ''}
                    onBlur={(e) => handleComissaoChange(lead.ID, e.target.value)}
                    disabled={!!lead.Seguradora}
                    maxLength={4}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <select
                  value={lead.Parcelamento || ''} // Usando o valor direto do lead
                  onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                  disabled={!!lead.Seguradora}
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

                {!lead.Seguradora ? (
                  // O botão de "Confirmar Seguradora" deve ser clicado apenas se todos os campos estiverem preenchidos e válidos.
                  // Sua lógica de onConfirmInsurer deve ser a que salva todos os 4 campos de uma vez.
                  <button
                    onClick={() =>
                      onConfirmInsurer(
                        lead.ID,
                        parseFloat(lead.PremioLiquido),
                        lead.Seguradora,
                        parseFloat(lead.Comissao),
                        lead.Parcelamento
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
