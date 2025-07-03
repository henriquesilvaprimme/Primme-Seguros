import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  // Estados para os campos do lead
  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYearModel, setVehicleYearModel] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [insuranceType, setInsuranceType] = useState('');

  const navigate = useNavigate();

  // Função para criar lead
  const handleCriar = () => {
    if (
      !name ||
      !vehicleModel ||
      !vehicleYearModel ||
      !city ||
      !phone ||
      !insuranceType
    ) {
      alert('Preencha todos os campos.');
      return;
    }

    // Cria o objeto lead conforme o esperado pela planilha
    const novoLead = {
      id: Date.now(),
      name,
      vehicleModel,
      vehicleYearModel,
      city,
      phone,
      insuranceType,
      data: new Date().toISOString().split('T')[0],
    };

    // Envia para o Google Sheets
    criarLeadFunc(novoLead);

    // Atualiza o estado local com o novo lead
    adicionarLead(novoLead);

    // Navega para a página de listagem de leads
    navigate('/leads');
  };

  // Função que chama o endpoint do Apps Script para criar lead
  const criarLeadFunc = async (lead) => {
    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=criar_lead',
        {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(lead),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      // Como usa no-cors, não tem resposta legível
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4">Criar Novo Lead</h2>

      <div>
        <label className="block text-gray-700">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Modelo do Veículo</label>
        <input
          type="text"
          value={vehicleModel}
          onChange={(e) => setVehicleModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Ano/Modelo</label>
        <input
          type="text"
          value={vehicleYearModel}
          onChange={(e) => setVehicleYearModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Cidade</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Tipo de Seguro</label>
        <select
          value={insuranceType}
          onChange={(e) => setInsuranceType(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Selecione</option>
          <option value="Auto">Auto</option>
          <option value="Moto">Moto</option>
          <option value="Caminhão">Caminhão</option>
          <option value="Frota">Frota</option>
        </select>
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
