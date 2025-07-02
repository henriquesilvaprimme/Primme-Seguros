// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '/components/ui/dialog';
import { Input } from '/components/ui/input';
import { Label } from '/components/ui/label';
import { Button } from '/components/ui/button';

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

const Dashboard = ({ leads, usuarioLogado }) => {
  /* =========================
     ESTADO: METRICAS & FILTRO
     ========================= */
  const [leadsClosed, setLeadsClosed] = useState([]);
  const [loading, setLoading] = useState(true);

  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const primeiroDiaMesISO = () =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);

  const [dataInicio, setDataInicio] = useState(primeiroDiaMesISO());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [filtroAplicado, setFiltroAplicado] = useState({
    inicio: primeiroDiaMesISO(),
    fim: hojeISO(),
  });

  /* ================  GET LEADS FECHADOS  ================ */
  const buscarLeads = async () => {
    try {
      const resp = await fetch(
        `${SCRIPT_URL}?v=pegar_clientes_fechados`
      );
      const dados = await resp.json();
      setLeadsClosed(dados);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarLeads();
  }, []);

  const aplicarFiltroData = () =>
    setFiltroAplicado({ inicio: dataInicio, fim: dataFim });

  /* ================  FILTRO NOS LEADS RECEBIDOS VIA PROP  ================ */
  const leadsFiltrados = leads.filter((lead) => {
    if (!filtroAplicado.inicio && !filtroAplicado.fim) return true;
    const d = new Date(lead.createdAt).toISOString().slice(0, 10);
    if (filtroAplicado.inicio && d < filtroAplicado.inicio) return false;
    if (filtroAplicado.fim && d > filtroAplicado.fim) return false;
    return true;
  });

  const totalLeads = leadsFiltrados.length;
  const leadsFechadosCount = leadsFiltrados.filter(
    (l) => l.status === 'Fechado'
  ).length;
  const leadsPerdidos = leadsFiltrados.filter(
    (l) => l.status === 'Perdido'
  ).length;
  const leadsEmContato = leadsFiltrados.filter(
    (l) => l.status === 'Em Contato'
  ).length;
  const leadsSemContato = leadsFiltrados.filter(
    (l) => l.status === 'Sem Contato'
  ).length;

  /* ================  LEADS FECHADOS DA ABA SHEETS  ================ */
  let leadsFiltradosClosed =
    usuarioLogado.tipo === 'Admin'
      ? leadsClosed
      : leadsClosed.filter(
          (l) => l.Responsavel === usuarioLogado.nome
        );

  leadsFiltradosClosed = leadsFiltradosClosed.filter((lead) => {
    if (!filtroAplicado.inicio && !filtroAplicado.fim) return true;
    const d = new Date(lead.Data).toISOString().slice(0, 10);
    if (filtroAplicado.inicio && d < filtroAplicado.inicio) return false;
    if (filtroAplicado.fim && d > filtroAplicado.fim) return false;
    return true;
  });

  const portoSeguro = leadsFiltradosClosed.filter(
    (l) => l.Seguradora === 'Porto Seguro'
  ).length;
  const azulSeguros = leadsFiltradosClosed.filter(
    (l) => l.Seguradora === 'Azul Seguros'
  ).length;
  const itauSeguros = leadsFiltradosClosed.filter(
    (l) => l.Seguradora === 'Itau Seguros'
  ).length;
  const demais = leadsFiltradosClosed.filter(
    (l) => l.Seguradora === 'Demais Seguradoras'
  ).length;

  const totalPremioLiquido = leadsFiltradosClosed.reduce(
    (acc, l) => acc + (Number(l.PremioLiquido) || 0),
    0
  );
  const somaPonderadaComissao = leadsFiltradosClosed.reduce((acc, l) => {
    const premio = Number(l.PremioLiquido) || 0;
    const comissao = Number(l.Comissao) || 0;
    return acc + premio * (comissao / 100);
  }, 0);
  const comissaoMediaGlobal =
    totalPremioLiquido > 0
      ? (somaPonderadaComissao / totalPremioLiquido) * 100
      : 0;

  /* ================  ESTILO BOX SIMPLES  ================ */
  const boxStyle = {
    padding: '10px',
    borderRadius: '5px',
    flex: 1,
    color: '#fff',
    textAlign: 'center',
  };

  /* =====================================================================
     ======================  BLOCO: NOVO LEAD  ============================
     ===================================================================== */
  const [modalOpen, setModalOpen] = useState(false);
  const initForm = {
    nome: '',
    modeloVeiculo: '',
    anoModelo: '',
    cidade: '',
    telefone: '',
    tipoSeguro: '',
  };
  const [form, setForm] = useState(initForm);
  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const criarLead = async () => {
    // Pequena validação básica
    if (!form.nome || !form.telefone) {
      alert('Nome e Telefone são obrigatórios.');
      return;
    }

    // Gera um ID simples (timestamp) – combine com seu back se precisar diferente
    const payload = {
      action: 'salvarLead',
      lead: {
        id: Date.now().toString(),
        nome: form.nome,
        modeloveiculo: form.modeloVeiculo,
        anomodelo: form.anoModelo,
        cidade: form.cidade,
        telefone: form.telefone,
        tipodeseguro: form.tipoSeguro,
        status: 'Sem Contato',
        createdAt: new Date().toISOString(),
        origem: undefined, // ficará na aba “Leads” por padrão
      },
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Se o seu Apps Script NÃO tem CORS aberto, mantenha no‑cors:
        // mode: 'no-cors',
      });
      // 1) Fecha modal  2) Reseta formulário  3) Atualiza lista
      setModalOpen(false);
      setForm(initForm);
      buscarLeads(); // re‑puxa leads fechados (opcional)
      alert('Lead criado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar lead:', err);
      alert('Não foi possível salvar o lead.');
    }
  };

  /* ============================  RENDER  ============================ */
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>

      {/* FILTRO DE DATAS */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="border rounded px-3 py-2"
          title="Data de início"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="border rounded px-3 py-2"
          title="Data de fim"
        />
        <button
          onClick={aplicarFiltroData}
          className="bg-blue-600 text-white rounded px-4 py-2"
        >
          Filtrar
        </button>
      </div>

      {/* MÉTRICAS – PRIMEIRA LINHA */}
      <div className="flex gap-5 mb-5">
        <div style={{ ...boxStyle, backgroundColor: '#eee', color: '#333' }}>
          <h3>Total de Leads</h3>
          <p className="text-2xl font-bold">{totalLeads}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Leads Fechados</h3>
          <p className="text-2xl font-bold">{leadsFechadosCount}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#F44336' }}>
          <h3>Leads Perdidos</h3>
          <p className="text-2xl font-bold">{leadsPerdidos}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#FF9800' }}>
          <h3>Em Contato</h3>
          <p className="text-2xl font-bold">{leadsEmContato}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#9E9E9E' }}>
          <h3>Sem Contato</h3>
          <p className="text-2xl font-bold">{leadsSemContato}</p>
        </div>
      </div>

      {/* MÉTRICAS – SEGUNDA LINHA */}
      <div className="flex gap-5 mb-5">
        <div style={{ ...boxStyle, backgroundColor: '#003366' }}>
          <h3>Porto Seguro</h3>
          <p className="text-2xl font-bold">{portoSeguro}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#87CEFA' }}>
          <h3>Azul Seguros</h3>
          <p className="text-2xl font-bold">{azulSeguros}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#FF8C00' }}>
          <h3>Itau Seguros</h3>
          <p className="text-2xl font-bold">{itauSeguros}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Demais Seguradoras</h3>
          <p className="text-2xl font-bold">{demais}</p>
        </div>
      </div>

      {/* ADMIN – PRÊMIO / COMISSÃO */}
      {usuarioLogado.tipo === 'Admin' && (
        <div className="flex gap-5 mt-5">
          <div style={{ ...boxStyle, backgroundColor: '#3f51b5' }}>
            <h3>Total Prêmio Líquido</h3>
            <p className="text-2xl font-bold">
              {totalPremioLiquido.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          <div style={{ ...boxStyle, backgroundColor: '#009688' }}>
            <h3>Média Comissão</h3>
            <p className="text-2xl font-bold">
              {comissaoMediaGlobal.toFixed(2).replace('.', ',')}%
            </p>
          </div>
        </div>
      )}

      {/* ===============  BOTÃO FLUTUANTE / MODAL  =============== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        {/* Botão azul “+” fixo no canto inferior direito */}
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 p-0 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            title="Criar novo lead"
          >
            <Plus className="h-6 w-6 text-white" />
          </Button>
        </DialogTrigger>

        {/* POP‑UP DE CRIAÇÃO */}
        <DialogContent className="sm:max-w-[430px]">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {[
              { id: 'nome', label: 'Nome', value: form.nome },
              {
                id: 'modeloVeiculo',
                label: 'Modelo do veículo',
                value: form.modeloVeiculo,
              },
              {
                id: 'anoModelo',
                label: 'Ano/Modelo',
                value: form.anoModelo,
              },
              { id: 'cidade', label: 'Cidade', value: form.cidade },
              {
                id: 'telefone',
                label: 'Telefone',
                value: form.telefone,
              },
              {
                id: 'tipoSeguro',
                label: 'Tipo de Seguro',
                value: form.tipoSeguro,
              },
            ].map(({ id, label, value }) => (
              <div
                key={id}
                className="grid grid-cols-4 items-center gap-4"
              >
                <Label htmlFor={id} className="text-right">
                  {label}
                </Label>
                <Input
                  id={id}
                  name={id}
                  value={value}
                  onChange={onChange}
                  className="col-span-3"
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={criarLead}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
