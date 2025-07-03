import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

const gerarId = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

const CriarLead = ({ fetchLeadsFromSheet }) => {
  const [form, setForm] = useState({
    name: '',
    vehicleModel: '',
    vehicleYearModel: '',
    city: '',
    phone: '',
    insuranceType: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCriar = () => {
    if (
      !form.name ||
      !form.vehicleModel ||
      !form.vehicleYearModel ||
      !form.city ||
      !form.phone ||
      !form.insuranceType
    ) {
      alert('Preencha todos os campos.');
      return;
    }

    const novoLead = {
      id: gerarId(),
      name: form.name,
      vehiclemodel: form.vehicleModel,
      vehicleyearmodel: form.vehicleYearModel,
      city: form.city,
      phone: form.phone,
      insurancetype: form.insuranceType,
      data: new Date().toLocaleDateString('pt-BR'),
      responsavel: '',
      status: '',
      editado: '',
      origem: 'Leads',
    };

    criarLeadFunc(novoLead);

    if (fetchLeadsFromSheet) fetchLeadsFromSheet();
    navigate('/leads');
  };

  const criarLeadFunc = async (lead) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'salvarLead',
          lead,
        }),
      });
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
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-gray-700">Modelo do Veículo</label>
        <input
          type="text"
          name="vehicleModel"
          value={form.vehicleModel}
          onChange={handleChange}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-gray-700">Ano/Modelo</label>
        <input
          type="text"
          name="vehicleYearModel"
          value={form.vehicleYearModel}
          onChange={handleChange}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-gray-700">Cidade</label>
        <input
          type="text"
          name="city"
          value={form.city}
          onChange={handleChange}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-gray-700">Tipo de Seguro</label>
        <input
          type="text"
          name="insuranceType"
          value={form.insuranceType}
          onChange={handleChange}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
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
