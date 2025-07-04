import React, { useState } from 'react';
import Lead from './components/Lead';

// A URL GOOGLE_SHEETS_SCRIPT_URL não é usada diretamente neste componente para POSTs,
// mas é mantida aqui se for usada para GETs ou outras finalidades.
// As chamadas POST de atualização de leads são feitas via props (transferirLead) que vêm do App.jsx
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec';

const Leads = ({ leads, usuarios, onUpdateStatus, transferirLead, usuarioLogado, fetchLeadsFromSheet }) => {
  const [selecionados, setSelecionados] = useState({}); // { [leadId]: userId }
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados para filtro por data (mes e ano) - INICIAM LIMPOS
  const [dataInput, setDataInput] = useState('');
  const [filtroData, setFiltroData] = useState('');

  // Estados para filtro por nome
  const [nomeInput, setNomeInput] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  // A função buscarLeadsAtualizados aqui não é mais estritamente necessária para a atualização instantânea do responsável,
  // pois a prop 'leads' já é atualizada pelo App.jsx.
  // No entanto, pode ser útil para o botão de refresh manual.
  const buscarLeadsAtualizados = async () => {
    try {
      // Esta URL pode precisar ser ajustada para a URL de GET de leads do seu App.jsx
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL + '?v=getLeads'); // Adicionado ?v=getLeads
      if (response.ok) {
        const dadosLeads = await response.json();
        // Aqui você precisaria de uma função passada via prop para atualizar o estado 'leads' no App.jsx
        // Por enquanto, o fetchLeadsFromSheet já faz isso.
        console.log("Leads atualizados manualmente:", dadosLeads);
      } else {
        console.error('Erro ao buscar leads:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    }
  };

  const leadsPorPagina = 10;

  // Função para normalizar strings (remover acento, pontuação, espaços, etc)
  const normalizarTexto = (texto = '') => {
    return texto
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
    setFiltroNome('');
    setNomeInput('');
    setPaginaAtual(1);
  };

  const aplicarFiltroNome = () => {
    const filtroLimpo = nomeInput.trim();
    setFiltroNome(filtroLimpo);
    setFiltroData('');
    setDataInput('');
    setPaginaAtual(1);
  };

  const isSameMonthAndYear = (leadDateStr, filtroMesAno) => {
    if (!filtroMesAno) return true;
    if (!leadDateStr) return false;
    const leadData = new Date(leadDateStr);
    const leadAno = leadData.getFullYear();
    const leadMes = String(leadData.getMonth() + 1).padStart(2, '0');
    return filtroMesAno === `${leadAno}-${leadMes}`;
  };

  const nomeContemFiltro = (leadNome, filtroNome) => {
    if (!filtroNome) return true;
    if (!leadNome) return false;

    const nomeNormalizado = normalizarTexto(leadNome);
    const filtroNormalizado = normalizarTexto(filtroNome);

    return nomeNormalizado.includes(filtroNormalizado);
  };

  // Filtragem dos leads pendentes + filtro data ou nome
  const gerais = leads.filter((lead) => {
    if (lead.status === 'Fechado' || lead.status === 'Perdido') return false;

    if (filtroData) {
      return isSameMonthAndYear(lead.createdAt, filtroData);
    }

    if (filtroNome) {
      return nomeContemFiltro(lead.name, filtroNome);
    }

    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(gerais.length / leadsPorPagina));
  const paginaCorrigida = Math.min(paginaAtual, totalPaginas);

  const usuariosAtivos = usuarios.filter((u) => u.status === 'Ativo');
  const isAdmin = usuarioLogado?.tipo === 'Admin';

  const handleSelect = (leadId, userId) => {
    setSelecionados((prev) => ({
      ...prev,
      [leadId]: userId, // userId já é string se vier do select, mas o App.jsx vai lidar com isso
    }));
  };

  const handleEnviar = (leadId) => {
    const userId = selecionados[leadId];
    if (!userId) {
      alert('Selecione um usuário antes de enviar.');
      return;
    }

    // Chama a função transferirLead passada via prop do App.jsx
    // Esta função já atualiza o estado 'leads' no App.jsx e envia para o GAS.
    transferirLead(leadId, userId);

    // Limpa a seleção após o envio (opcional, mas boa prática)
    setSelecionados((prev) => {
      const newSelecionados = { ...prev };
      delete newSelecionados[leadId];
      return newSelecionados;
    });
  };

  // A função enviarLeadAtualizado foi removida pois a lógica de envio para o GAS
  // já é tratada pela função transferirLead em App.jsx.
  // const enviarLeadAtualizado = async (lead) => { ... };

  const handleAlterar = (leadId) => {
    setSelecionados((prev) => ({
      ...prev,
      [leadId]: '',
    }));
    transferirLead(leadId, null); // Envia null para desatribuir o responsável
  };

  const inicio = (paginaCorrigida - 1) * leadsPorPagina;
  const fim = inicio + leadsPorPagina;
  const leadsPagina = gerais.slice(inicio, fim);

  const handlePaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  };

  const handlePaginaProxima = () => {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Linha de filtros */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>Leads</h1>

          <button title='Clique para atualizar os dados'
            onClick={() => {
              fetchLeadsFromSheet(); // Chama a função do App.jsx para rebuscar leads
            }}
          >
            🔄
          </button>
        </div>

        {/* Filtro nome - centralizado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexGrow: 1,
            justifyContent: 'center',
            minWidth: '300px',
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
            }}
            title="Filtrar leads pelo nome (contém)"
          />
        </div>

        {/* Filtro data - direita */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '220px',
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
            }}
            title="Filtrar leads pelo mês e ano de criação"
          />
        </div>
      </div>

      {gerais.length === 0 ? (
        <p>Não há leads pendentes.</p>
      ) : (
        <>
          {leadsPagina.map((lead) => {
            // Encontra o usuário pelo nome do responsável no lead
            const responsavelUsuario = usuarios.find((u) => u.nome === lead.responsavel);

            return (
              <div
                key={lead.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  position: 'relative',
                }}
              >
                <Lead
                  lead={lead}
                  onUpdateStatus={onUpdateStatus}
                  disabledConfirm={!lead.responsavel}
                />

                {lead.responsavel && responsavelUsuario ? ( // Usa responsavelUsuario para verificar e exibir
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ color: '#28a745' }}>
                      Transferido para <strong>{responsavelUsuario.nome}</strong>
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => handleAlterar(lead.id)}
                        style={{
                          marginTop: '5px',
                          padding: '5px 12px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Alterar
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <select
                      value={selecionados[lead.id] || ''}
                      onChange={(e) => handleSelect(lead.id, e.target.value)}
                      style={{
                        padding: '5px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                    >
                      <option value="">Selecione usuário ativo</option>
                      {usuariosAtivos.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleEnviar(lead.id)}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Enviar
                    </button>
                  </div>
                )}

                {/* Data no canto inferior direito */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '15px',
                    fontSize: '12px',
                    color: '#888',
                    fontStyle: 'italic',
                  }}
                  title={`Criado em: ${formatarData(lead.createdAt)}`}
                >
                  {formatarData(lead.createdAt)}
                </div>
              </div>
            );
          })}

          {/* Paginação */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '20px',
            }}
          >
            <button
              onClick={handlePaginaAnterior}
              disabled={paginaCorrigida <= 1}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                cursor: paginaCorrigida <= 1 ? 'not-allowed' : 'pointer',
                backgroundColor: paginaCorrigida <= 1 ? '#f0f0f0' : '#fff',
              }}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center' }}>
              Página {paginaCorrigida} de {totalPaginas}
            </span>
            <button
              onClick={handlePaginaProxima}
              disabled={paginaCorrigida >= totalPaginas}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                cursor: paginaCorrigida >= totalPaginas ? 'not-allowed' : 'pointer',
                backgroundColor: paginaCorrigida >= totalPaginas ? '#f0f0f0' : '#fff',
              }}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;
