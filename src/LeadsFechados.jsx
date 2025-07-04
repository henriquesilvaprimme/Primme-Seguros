import React, { useState, useEffect } from 'react';

const LeadsFechados = ({
  leads,
  usuarios,
  onUpdateInsurer, // Prop de função para atualizar seguradora (se usada)
  onConfirmInsurer, // Prop de função para confirmar todos os detalhes (central)
  onUpdateDetalhes, // Prop de função para atualizar detalhes individualmente (se usada)
  fetchLeadsFechadosFromSheet,
  isAdmin,
}) => {
  // Filtramos os leads fechados usando a chave 'Status' como vem do seu Sheets
  const fechados = leads.filter((lead) => lead.Status === 'Fechado');

  console.log("usuarioLogado", isAdmin);

  // Obtém o mês e ano atual no formato 'YYYY-MM'
  const getMesAnoAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  // Estado local 'valores' para gerenciar os inputs editáveis
  const [valores, setValores] = useState(() => {
    const inicial = {};
    fechados.forEach((lead) => {
      inicial[lead.ID] = {
        // PremioLiquido armazenado em centavos para manipulação interna precisa
        PremioLiquido: lead.PremioLiquido !== undefined && lead.PremioLiquido !== null
          ? Math.round(parseFloat(String(lead.PremioLiquido).replace(',', '.')) * 100)
          : 0,
        // Comissão como string para exibição, mas parseado para float ao enviar
        Comissao: lead.Comissao !== undefined && lead.Comissao !== null
          ? String(lead.Comissao).replace('.', ',') // Garante que é string com vírgula para exibição
          : '',
        Parcelamento: lead.Parcelamento || '',
        insurer: lead.Seguradora || '', // 'insurer' aqui é o nome da chave para o select de seguradora
      };
    });
    return inicial;
  });

  // useEffect para sincronizar 'valores' quando a prop 'leads' muda (ex: após um refresh)
  useEffect(() => {
    setValores((prevValores) => {
      const novosValores = { ...prevValores };

      // Itera sobre os leads fechados mais recentes e atualiza o estado local
      leads
        .filter((lead) => lead.Status === 'Fechado')
        .forEach((lead) => {
          // Atualiza se o lead não existe no estado local ou se os valores do lead mudaram
          // (evita sobrescrever edições do usuário que ainda não foram salvas)
          if (!novosValores[lead.ID] ||
              novosValores[lead.ID].PremioLiquido !== (
                lead.PremioLiquido !== undefined && lead.PremioLiquido !== null
                  ? Math.round(parseFloat(String(lead.PremioLiquido).replace(',', '.')) * 100)
                  : 0
              ) ||
              novosValores[lead.ID].Comissao !== (
                lead.Comissao !== undefined && lead.Comissao !== null
                  ? String(lead.Comissao).replace('.', ',')
                  : ''
              ) ||
              novosValores[lead.ID].Parcelamento !== (lead.Parcelamento || '') ||
              novosValores[lead.ID].insurer !== (lead.Seguradora || '')
          ) {
            novosValores[lead.ID] = {
              PremioLiquido: lead.PremioLiquido !== undefined && lead.PremioLiquido !== null
                ? Math.round(parseFloat(String(lead.PremioLiquido).replace(',', '.')) * 100)
                : 0,
              Comissao: lead.Comissao !== undefined && lead.Comissao !== null
                ? String(lead.Comissao).replace('.', ',')
                : '',
              Parcelamento: lead.Parcelamento || '',
              insurer: lead.Seguradora || '',
            };
          }
        });

      // Remove leads que não são mais fechados ou foram removidos
      Object.keys(novosValores).forEach(id => {
        if (!leads.some(lead => String(lead.ID) === id && lead.Status === 'Fechado')) {
          delete novosValores[id];
        }
      });

      return novosValores;
    });
  }, [leads]); // Dependência: Apenas re-executa quando a prop 'leads' muda

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
    console.log(dataInput);
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
    const dataA = new Date(a.Data); // Usando 'Data' como vem do seu Sheet
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

  // Formata valor de centavos para exibição em BRL (ex: 123456 -> "1.234,56")
  const formatarMoeda = (valorCentavos) => {
    if (isNaN(valorCentavos) || valorCentavos === null) return '';
    return (valorCentavos / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Funções para manipulação de inputs
  const handlePremioLiquidoChange = (id, valor) => {
    // Permite apenas números e vírgula, e converte para centavos
    const somenteNumeros = valor.replace(/\D/g, ''); // Remove tudo exceto dígitos
    let valorCentavos = parseInt(somenteNumeros, 10);
    if (isNaN(valorCentavos)) valorCentavos = 0;

    setValores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        PremioLiquido: valorCentavos, // Armazena em centavos
      },
    }));
  };

  const handlePremioLiquidoBlur = (id) => {
    const valorCentavos = valores[id]?.PremioLiquido || 0;
    const valorReais = valorCentavos / 100; // Converte para Reais para enviar
    onUpdateDetalhes(id, 'PremioLiquido', valorReais); // Chamada para atualizar no App.jsx/Sheets
  };

  const handleComissaoChange = (id, valor) => {
    // Permite formato "XX,X" ou "XX"
    const regex = /^\d{0,3}(?:,\d{0,2})?$/; // Ex: 100,00 ou 10,0 ou 5

    // Limita o tamanho máximo da entrada (ex: "100,00" tem 6 caracteres)
    const valorLimpo = valor.replace('.', ','); // Garante vírgula para entrada brasileira
    const valorFormatado = valorLimpo.length > 6 ? valorLimpo.substring(0, 6) : valorLimpo;


    if (valorFormatado === '' || regex.test(valorFormatado)) {
      setValores((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          Comissao: valorFormatado, // Armazena como string formatada para exibição
        },
      }));

      // Converte para float para enviar para onUpdateDetalhes
      const valorFloat = parseFloat(valorFormatado.replace(',', '.'));
      onUpdateDetalhes(id, 'Comissao', isNaN(valorFloat) ? '' : valorFloat);
    }
  };

  const handleParcelamentoChange = (id, valor) => {
    setValores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        Parcelamento: valor,
      },
    }));
    onUpdateDetalhes(id, 'Parcelamento', valor); // Chamada para atualizar no App.jsx/Sheets
  };

  const handleInsurerChange = (id, valor) => {
    setValores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        insurer: valor, // Atualiza o estado local para o select
      },
    }));
    onUpdateInsurer(id, valor); // Chamada para atualizar apenas a seguradora
    // Você pode chamar onUpdateDetalhes aqui também se preferir um ponto de entrada unificado:
    // onUpdateDetalhes(id, 'Seguradora', valor);
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
          // Usa lead.Seguradora para determinar a cor do fundo e da borda
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

          // Habilita/Desabilita o botão de confirmação
          // Usa os valores do estado local 'valores' para a validação
          const isButtonDisabled =
            !valores[lead.ID]?.insurer ||
            !valores[lead.ID]?.PremioLiquido ||
            valores[lead.ID]?.PremioLiquido === 0 ||
            !valores[lead.ID]?.Comissao ||
            valores[lead.ID]?.Comissao === '' ||
            !valores[lead.ID]?.Parcelamento ||
            valores[lead.ID]?.Parcelamento === '';

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
                {/* Exibe o Tipo de Seguro (que não é editável aqui) */}
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
                {/* SELECT Seguradora */}
                <select
                  // O valor do select vem do estado local `valores[lead.ID]?.insurer`
                  value={valores[lead.ID]?.insurer || ''}
                  onChange={(e) => handleInsurerChange(lead.ID, e.target.value)}
                  // O select é desabilitado se `lead.Seguradora` já tiver um valor
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

                {/* INPUT Prêmio Líquido */}
                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>R$</span>
                  <input
                    type="text"
                    placeholder="Prêmio Líquido"
                    // O valor do input vem do estado local `valores[lead.ID]?.PremioLiquido`
                    // formatado para moeda
                    value={formatarMoeda(valores[lead.ID]?.PremioLiquido)}
                    onChange={(e) => handlePremioLiquidoChange(lead.ID, e.target.value)}
                    onBlur={() => handlePremioLiquidoBlur(lead.ID)} // Chama API ao perder foco
                    // O input é desabilitado se `lead.Seguradora` já tiver um valor
                    disabled={!!lead.Seguradora}
                    style={inputWithPrefixStyle}
                  />
                </div>

                {/* INPUT Comissão */}
                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>%</span>
                  <input
                    type="text"
                    placeholder="Comissão (%)"
                    // O valor do input vem do estado local `valores[lead.ID]?.Comissao`
                    value={valores[lead.ID]?.Comissao || ''}
                    onChange={(e) => handleComissaoChange(lead.ID, e.target.value)}
                    // O input é desabilitado se `lead.Seguradora` já tiver um valor
                    disabled={!!lead.Seguradora}
                    maxLength={6} // Permite até 100,00
                    style={inputWithPrefixStyle}
                  />
                </div>

                {/* SELECT Parcelamento */}
                <select
                  // O valor do select vem do estado local `valores[lead.ID]?.Parcelamento`
                  value={valores[lead.ID]?.Parcelamento || ''}
                  onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                  // O select é desabilitado se `lead.Seguradora` já tiver um valor
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

                {/* Botão de Confirmação ou Status Confirmado */}
                {/* Verifica se lead.Seguradora tem valor para mostrar o status */}
                {!lead.Seguradora ? (
                  <button
                    onClick={() =>
                      onConfirmInsurer(
                        lead.ID,
                        // Converte PremioLiquido de centavos para Reais ao enviar
                        (valores[lead.ID]?.PremioLiquido || 0) / 100,
                        valores[lead.ID]?.insurer, // Valor da seguradora do estado local
                        // Converte Comissão de string com vírgula para float ao enviar
                        parseFloat(String(valores[lead.ID]?.Comissao || '0').replace(',', '.')),
                        valores[lead.ID]?.Parcelamento // Valor do parcelamento do estado local
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
