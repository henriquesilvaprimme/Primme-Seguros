import React, { useState } from 'react';

const CriarLead = ({ adicionarLead }) => {
  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYearModel, setVehicleYearModel] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [status, setStatus] = useState(''); // status inicial vazio
  const [loading, setLoading] = useState(false);

  const SPREADSHEET_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

  const gerarId = () => {
    // Pode usar crypto.randomUUID() se suportado, ou fallback
    if (crypto?.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone) {
      alert('Por favor, preencha pelo menos nome e telefone.');
      return;
    }

    setLoading(true);

    const novoLead = {
      ID: gerarId(),
      name,
      vehicleModel,
      vehicleYearModel,
      city,
      phone,
      insuranceType,
      data: new Date().toISOString(),
      responsavel,
      status,
      editado: new Date().toISOString(),
    };

    try {
      await fetch(SPREADSHEET_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // mantém o no-cors conforme seu padrão
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead: novoLead,
          action: 'adicionar_lead', // caso seu script precise identificar a ação
        }),
      });

      // Atualiza localmente no App.jsx para resposta imediata
      adicionarLead({
        id: novoLead.ID,
        name: novoLead.name,
        vehicleModel: novoLead.vehicleModel,
        vehicleYearModel: novoLead.vehicleYearModel,
        city: novoLead.city,
        phone: novoLead.phone,
        insuranceType: novoLead.insuranceType,
        data: novoLead.data,
        responsavel: novoLead.responsavel,
        status: novoLead.status,
        editado: novoLead.editado,
      });

      alert('Lead criado com sucesso!');
      // limpa formulário
      setName('');
      setVehicleModel('');
      setVehicleYearModel('');
      setCity('');
      setPhone('');
      setInsuranceType('');
      setResponsavel('');
      setStatus('');
    } catch (error) {
      alert('Erro ao criar lead. Tente novamente.');
      console.error('Erro ao criar lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Criar Novo Lead</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          placeholder="Modelo do Veículo"
          value={vehicleModel}
          onChange={(e) => setVehicleModel(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Ano do Modelo"
          value={vehicleYearModel}
          onChange={(e) => setVehicleYearModel(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="tel"
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          placeholder="Tipo de Seguro"
          value={insuranceType}
          onChange={(e) => setInsuranceType(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Responsável"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Selecione o status</option>
          <option value="Em contato">Em contato</option>
          <option value="Sem contato">Sem contato</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Salvando...' : 'Salvar Lead'}
        </button>
      </form>
    </div>
  );
};

export default CriarLead;
