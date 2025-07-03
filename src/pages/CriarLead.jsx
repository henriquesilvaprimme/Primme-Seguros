// src/pages/CriarLead.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = () => {
  /* estados para cada campo da planilha -------------- */
  const [name, setName]                   = useState('');
  const [vehiclemodel, setVehicleModel]   = useState('');
  const [vehicleyearmodel, setYearModel]  = useState('');
  const [city, setCity]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [insurancetype, setInsuranceType] = useState('');

  const navigate = useNavigate();

  /* clique no botão ---------------------------------- */
  const handleCriar = () => {
    if (!name || !vehiclemodel || !vehicleyearmodel || !city || !phone || !insurancetype) {
      alert('Preencha todos os campos.');
      return;
    }

    /* objeto COM as mesmas chaves que a 1ª linha da aba Leads */
    const novoLead = {
      id: Date.now().toString(),   // primeira coluna “id”
      name,                        // coluna “name”
      vehiclemodel,                // “vehiclemodel”
      vehicleyearmodel,            // “vehicleyearmodel”
      city,                        // “city”
      phone,                       // “phone”
      insurancetype,               // “insurancetype”
      status: 'Novo',              // “status”
      confirmado: false,           // “confirmado”
      editado: new Date().toISOString(), // “editado”
      origem: 'Leads'              // “origem”  (opcional)
    };

    /* faz o POST exatamente como CriarUsuario.jsx -------- */
    criarLeadFunc(novoLead);

    /* redireciona para listagem --------------------------- */
    navigate('/leads');
  };

  const criarLeadFunc = async (lead) => {
    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=criar_lead',
        {
          method: 'POST',
          mode: 'no-cors',                 // igual ao CriarUsuario.jsx
          body: JSON.stringify(lead),
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  /* ---------------------- JSX ----------------------- */
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
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Modelo */}
      <div>
        <label className="block text-gray-700">Modelo do Veículo</label>
        <input
          type="text"
          value={vehiclemodel}
          onChange={(e) => setVehicleModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Ano/Modelo */}
      <div>
        <label className="block text-gray-700">Ano/Modelo</label>
        <input
          type="text"
          value={vehicleyearmodel}
          onChange={(e) => setYearModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Cidade */}
      <div>
        <label className="block text-gray-700">Cidade</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Telefone */}
      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Tipo de seguro */}
      <div>
        <label className="block text-gray-700">Tipo de Seguro</label>
        <input
          type="text"
          value={insurancetype}
          onChange={(e) => setInsuranceType(e.target.value)}
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
