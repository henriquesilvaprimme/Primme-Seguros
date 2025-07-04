import React, { useEffect, useState, useCallback } from 'react'; // Adicionado useCallback

const Ranking = ({ usuarios }) => {
  const [carregando, setCarregando] = useState(true);
  const [dadosLeads, setLeads] = useState([]);

  // Estado para filtro por mês/ano (formato yyyy-mm)
  const [dataInput, setDataInput] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  const [filtroData, setFiltroData] = useState(dataInput);

  // Nova URL do Google Apps Script para buscar leads
  const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';


  // Função para converter data no formato dd/mm/aaaa para yyyy-mm-dd
  // Melhoria: Lidar com o caso de data já vir no formato yyyy-mm-dd do script
  const converterDataParaISO = (dataStr) => {
    if (!dataStr) return '';
    // Se a data já for um objeto Date ou estiver no formato ISO (e.g., de new Date().toISOString())
    if (dataStr instanceof Date) {
        return dataStr.toISOString().slice(0, 10);
    }
    // Se a data vier como string "yyyy-mm-dd" ou "yyyy/mm/dd"
    if (dataStr.includes('-') && dataStr.split('-').length === 3) {
      return dataStr.slice(0, 10); // Retorna no formato yyyy-mm-dd
    }
    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        // dd/mm/aaaa -> yyyy-mm-dd
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    return dataStr.slice(0, 10); // Tenta pegar os 10 primeiros caracteres como yyyy-mm-dd
  };


  // Usar useCallback para memorizar a função e evitar recriação desnecessária
  const buscarClientesFechados = useCallback(async () => {
    setCarregando(true);
    try {
      // Adiciona a ação para o doGet no Apps Script
      const params = new URLSearchParams();
      params.append('action', 'getLeads'); // Certifique-se que seu Apps Script tem essa ação

      const respostaLeads = await fetch(`${GOOGLE_SHEETS_API_URL}?${params.toString()}`);
      
      if (!respostaLeads.ok) {
        throw new Error(`Erro HTTP! status: ${respostaLeads.status}`);
      }
      
      const dados = await respostaLeads.json();
      
      // Mapeia para garantir que 'Data' e outros campos numéricos estejam corretos
      const leadsFormatados = dados.map(lead => ({
        ...lead,
        // Garante que 'Data' seja tratada como string para o filtro de mês/ano
        Data: String(lead.Data || ''),
        PremioLiquido: Number(lead.PremioLiquido) || 0,
        Comissao: Number(lead.Comissao) || 0,
        Parcelamento: lead.Parcelamento ? String(lead.Parcelamento).replace('x', '') : '', // Armazenar apenas o número
      }));

      setLeads(leadsFormatados);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLeads([]);
      alert('Erro ao carregar os dados de leads. Por favor, tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [GOOGLE_SHEETS_API_URL]); // Depende apenas da URL da API

  useEffect(() => {
    buscarClientesFechados();
  }, [buscarClientesFechados]); // Chama a função quando o componente é montado

  if (!Array.isArray(usuarios) || !Array.isArray(dadosLeads)) {
    return <div style={{ padding: 20 }}>Erro: dados não carregados corretamente.</div>;
  }

  const ativos = usuarios.filter(
    (u) =>
      u.status === 'Ativo' &&
      u.email !== 'admin@admin.com' &&
      u.tipo !== 'Admin'
  );

  const formatarMoeda = (valor) =>
    valor?.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }) || 'R$ 0,00';

  const formatarComissao = (valor) => {
    if (typeof valor !== 'number' || isNaN(valor)) return '0%';
    let limitado = valor > 99.99 ? 99.99 : valor;
    let str = limitado.toFixed(2).replace(/\.?0+$/, '');
    str = str.replace('.', ',');
    return `${str}%`;
  };

  const formatarParcelamento = (valor) => {
    // Agora 'valor' já deve ser um número ou string vazia da formatação em buscarClientesFechados
    let num = typeof valor === 'string' ? parseInt(valor, 10) : Number(valor);
    if (isNaN(num) || num < 1) return 'N/A'; // Alterado para 'N/A' para melhor visualização
    if (num > 12) num = 12; // Limitar a 12x
    return `${num}x`;
  };

  const usuariosComContagem = ativos.map((usuario) => {
    // Filtrar leads fechados do usuário com status "Fechado", seguradora preenchida e data dentro do filtro (yyyy-mm)
    const leadsUsuario = dadosLeads.filter((l) => {
      const responsavelOk = l.Responsavel === usuario.nome;
      const statusOk = l.Status === 'Fechado';
      const seguradoraOk = l.Seguradora && l.Seguradora.trim() !== '';
      
      const dataLeadISO = converterDataParaISO(l.Data); // Converte a data do lead para ISO yyyy-mm-dd
      const filtroMesAno = filtroData.slice(0, 7); // Pega apenas yyyy-mm do filtro

      const dataOk = dataLeadISO.startsWith(filtroMesAno); // Compara yyyy-mm

      return responsavelOk && statusOk && seguradoraOk && dataOk;
    });

    const getCount = (seguradora) =>
      leadsUsuario.filter((l) => l.Seguradora === seguradora).length;

    const porto = getCount('Porto Seguro');
    const azul = getCount('Azul Seguros');
    const itau = getCount('Itau Seguros');
    const demais = getCount('Demais Seguradoras');

    const vendas = porto + azul + itau + demais;

    const premioLiquido = leadsUsuario.reduce(
      (acc, curr) => acc + (Number(curr.PremioLiquido) || 0),
      0
    );

    const somaPonderadaComissao = leadsUsuario.reduce((acc, lead) => {
      const premio = Number(lead.PremioLiquido) || 0;
      const comissao = Number(lead.Comissao) || 0;
      return acc + premio * (comissao / 100);
    }, 0);

    const comissaoMedia =
      premioLiquido > 0 ? (somaPonderadaComissao / premioLiquido) * 100 : 0;

    const leadsParcelamentoValidos = leadsUsuario.filter((l) => Number(l.Parcelamento) > 0);
    let parcelamentoMedio = 0;
    if (leadsParcelamentoValidos.length > 0) {
      const somaParcelamento = leadsParcelamentoValidos.reduce((acc, curr) => {
        return acc + Number(curr.Parcelamento); // Já é número pela formatação inicial
      }, 0);
      parcelamentoMedio = Math.round(somaParcelamento / leadsParcelamentoValidos.length);
    }

    return {
      ...usuario,
      vendas,
      porto,
      azul,
      itau,
      demais,
      premioLiquido,
      comissao: comissaoMedia,
      parcelamento: parcelamentoMedio,
    };
  });

  const rankingOrdenado = usuariosComContagem.sort((a, b) => {
    // Prioridade de ordenação: Vendas totais, depois por seguradora específica
    if (b.vendas !== a.vendas) return b.vendas - a.vendas;
    if (b.porto !== a.porto) return b.porto - a.porto;
    if (b.itau !== a.itau) return b.itau - a.itau;
    if (b.azul !== a.azul) return b.azul - a.azul;
    return b.demais - a.demais;
  });

  const getMedalha = (posicao) => {
    const medalhas = ['🥇', '🥈', '🥉'];
    return medalhas[posicao] || `${posicao + 1}º`;
  };

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
    // Ao aplicar o filtro, re-buscar os dados do Apps Script para garantir que o filtro
    // seja aplicado diretamente na fonte de dados se o Apps Script suportar.
    // Ou, se o filtro for apenas no front-end, a lógica de `leadsUsuario` já cuida disso.
    // Para este caso, como o filtro é no front-end com base em `dadosLeads`, não precisamos re-buscar aqui,
    // mas se o Apps Script fosse filtrar, este seria o local.
    // Para este código, o filtro acontece após `dadosLeads` ser carregado, no `usuariosComContagem`.
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Ranking de Usuários</h1>

        <button
          title="Clique para atualizar os dados"
          onClick={() => {
            buscarClientesFechados(); // Re-busca todos os leads e re-aplica o filtro de data localmente
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            marginLeft: '10px',
          }}
        >
          🔄
        </button>
      </div>

      {/* Filtro data: canto direito */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '230px',
          justifyContent: 'flex-end',
          marginTop: '8px',
          marginBottom: '24px',
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
            marginRight: '8px',
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
            minWidth: '140px',
          }}
          title="Filtrar leads pela data (mês/ano)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') aplicarFiltroData();
          }}
        />
      </div>

      {carregando ? (
        <p>Carregando dados...</p>
      ) : rankingOrdenado.length === 0 ? (
        <p>Nenhum usuário ativo com leads fechados para o período selecionado.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))',
            gap: '24px',
          }}
        >
          {rankingOrdenado.map((usuario, index) => {
            const contadores = [
              { label: 'Vendas', count: usuario.vendas, color: '#000' },
              { label: 'Porto Seguro', count: usuario.porto, color: '#1E90FF' },
              { label: 'Itau Seguros', count: usuario.itau, color: '#FF6600' },
              { label: 'Azul Seguros', count: usuario.azul, color: '#003366' },
              { label: 'Demais Seguradoras', count: usuario.demais, color: '#2E8B57' },
            ];

            return (
              <div
                key={usuario.id}
                style={{
                  position: 'relative',
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                  }}
                >
                  {getMedalha(index)}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '20px',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      color: '#888',
                      flexShrink: 0,
                    }}
                  >
                    {usuario.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {usuario.nome || 'Sem Nome'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${contadores.length}, 1fr)`,
                    textAlign: 'center',
                    borderTop: '1px solid #eee',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  {contadores.map((item, idx) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '12px 8px',
                        borderLeft: idx === 0 ? 'none' : '1px solid #eee',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: item.color,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '1.3rem',
                          marginTop: '6px',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '12px',
                    color: '#555',
                    fontWeight: '600',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <span>Prêmio Líquido: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatarMoeda(usuario.premioLiquido)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span>Comissão: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatarComissao(usuario.comissao)}
                    </span>
                  </div>
                  <div>
                    <span>Parcelamento: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatarParcelamento(usuario.parcelamento)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Ranking;
