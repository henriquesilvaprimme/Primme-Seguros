import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  // campos
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYearModel, setVehicleYearModel] = useState('');
  const [city, setCity] = useState('');

  const navigate = useNavigate();

  /** envia ao Apps Script e atualiza state local */
  const handleCriar = () => {
    if (!name || !phone || !vehicleModel || !vehicleYearModel || !city) {
      alert('Preencha todos os campos.');
      return;
    }

    // objeto COM os mesmos nomes usados no seu fetchLeadsFromSheet()
    const novoLead = {
      id: crypto.randomUUID(),      // id único
      name,                         // Nome
      phone,                        // Telefone
      vehiclemodel: vehicleModel,   // modelo (minúsculo, sem CamelCase)
      vehicleyearmodel: vehicleYearModel, // ano/modelo
      city,                         // Cidade
      insurancetype: '',            // vazio por padrão
      status: 'Novo',
      confirmado: false,
      responsavel: null,
      editado: new Date().toISOString()
    };

    // grava em memória imediata
    if (typeof adicionarLead === 'function') adicionarLead(novoLead);

    // envia ao Google Sheets
    criarLeadFunc(novoLead);

    // volta para listagem
    navigate('/leads');
  };

  /** chamada ao Apps Script */
  const criarLeadFunc = async (lead) => {
    try {
      console.log('Enviando lead ao Apps Script:', lead); // debug
      await fetch(
        // Mesma URL‑base; só muda o parâmetro ?v=criar_lead  (confira se seu Apps Script usa exatamente esse nome)
        'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=criar_lead',
        {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(lead),
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4">Criar Novo Lead</h2>

      {/* Nome */}
      <div>
        <label className="block text-gray-700">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Telefone */}
      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Modelo */}
      <div>
        <label className="block text-gray-700">Modelo do Veículo</label>
        <input
          type="text"
          value={vehicleModel}
          onChange={(e) => setVehicleModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Ano / Modelo */}
      <div>
        <label className="block text-gray-700">Ano/Modelo</label>
        <input
          type="text"
          value={vehicleYearModel}
          onChange={(e) => setVehicleYearModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Cidade */}
      <div>
        <label className="block text-gray-700">Cidade</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition"
        >
          Criar Lead
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
