
import React, { useEffect, useState } from 'react';

const Ranking = ({ usuarios, leads}) => {

  const [carregando, setCarregando] = useState(true);
  const [usuariosData, setUsuarios] = useState([]);  // ← nomeei como usuariosData pra não confundir com prop
  const [dadosLeads, setLeads] = useState([]);

  // Estados para filtro por data
  const [dataInput, setDataInput] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });
  
  const [filtroData, setFiltroData] = useState(() => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
});

  const buscarClientesFechados = async () => {
    try {

      const respostaLeads = await fetch(
        'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=pegar_clientes_fechados'
      );
      const dadosLeads = await respostaLeads.json();

      setLeads(dadosLeads);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarClientesFechados();
  }, []);

  // Debug
  // Verificações de segurança
  if (!Array.isArray(usuarios) || !Array.isArray(dadosLeads)) {
    return <div style={{ padding: 20 }}>Erro: dados não carregados corretamente.</div>;
  }

  const ativos = usuarios.filter(
    (u) =>
      u.status === 'Ativo' &&
      u.email !== 'admin@admin.com' &&
      u.tipo !== 'Admin' // <- EXCLUSÃO DE USUÁRIOS ADMINISTRADORES
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
    let num = typeof valor === 'string' ? parseInt(valor.replace('x', ''), 10) : valor;
    if (isNaN(num) || num < 1) return '';
    if (num > 12) num = 12;
    return `${num}x`;
  };

  const usuariosComContagem = ativos.map((usuario) => {
    const leadsUsuario = dadosLeads.filter(
      (l) => {
          const responsavelOk = l.Responsavel === usuario.nome;
          const statusOk = l.Status === 'Fechado';
          const seguradoraOk = l.Seguradora != "";
          const dataOk = !filtroData || (new Date(l.Data).toLocaleDateString('sv-SE').startsWith(filtroData));
          //console.log("dataOk", dataOk)
          //console.log("filtroData", filtroData)
          return responsavelOk && statusOk && seguradoraOk && dataOk;
      }
    );

    //console.log(leadsUsuario)

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

    const leadsParcelamento = leadsUsuario.filter((l) => l.Parcelamento);
    let parcelamentoMedio = 0;
    if (leadsParcelamento.length > 0) {
      const somaParcelamento = leadsParcelamento.reduce((acc, curr) => {
        const val =
          typeof curr.Parcelamento === 'string'
            ? parseInt(curr.Parcelamento.replace('x', ''), 10)
            : Number(curr.Parcelamento) || 0;
        return acc + val;
      }, 0);
      parcelamentoMedio = Math.round(somaParcelamento / leadsParcelamento.length);
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
    //setFiltroNome('');
    //setNomeInput('');
    //setPaginaAtual(1);
  };
  

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0 }}>Ranking de Usuários</h1>

            <button title='Clique para atualizar os dados'
              onClick={() => {
                buscarClientesFechados();
                //fetchLeadsFechadosFromSheet();
                //fetchUsuariosFromSheet();
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
            title="Filtrar leads pela data exata de criação"
            onKeyDown={(e) => {
              if (e.key === 'Enter') aplicarFiltroData();
            }}
          />
        </div>

      {rankingOrdenado.length === 0 ? (
        <p>Nenhum usuário ativo no momento.</p>
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
                    {usuario.nome?.charAt(0)?.toUpperCase() || "?"}
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
