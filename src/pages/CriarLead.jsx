import React, { useState } from 'react';

const CriarLead = () => {
  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYearModel, setVehicleYearModel] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleCriarLead = () => {
    if (!name || !vehicleModel || !vehicleYearModel || !city || !phone || !insuranceType) {
      setMensagem('❌ Preencha todos os campos.');
      return;
    }

    const novoLead = {
      id: Date.now(),
      name,
      vehicleModel,
      vehicleYearModel,
      city,
      phone,
      insuranceType,
      data: new Date().toLocaleDateString('pt-BR'),
    };

    salvarLeadGAS(novoLead);
  };

  const salvarLeadGAS = async (lead) => {
    try {
      await fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec', {
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

      setMensagem('✅ Lead criado com sucesso!');
      limparCampos();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      setMensagem('❌ Erro ao criar o lead. Verifique sua conexão.');
    }
  };

  const limparCampos = () => {
    setName('');
    setVehicleModel('');
    setVehicleYearModel('');
    setCity('');
    setPhone('');
    setInsuranceType('');
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4">Criar Novo Lead</h2>

      <input
        type="text"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Modelo do Veículo"
        value={vehicleModel}
        onChange={(e) => setVehicleModel(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Ano/Modelo"
        value={vehicleYearModel}
        onChange={(e) => setVehicleYearModel(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Cidade"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      <input
        type="tel"
        placeholder="Telefone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      <input
        type="text"
        placeholder="Tipo de Seguro"
        value={insuranceType}
        onChange={(e) => setInsuranceType(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      <div className="flex justify-end">
        <button
          onClick={handleCriarLead}
          className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition"
        >
          Criar Lead
        </button>
      </div>

      {mensagem && (
        <div className="mt-4 text-center text-green-700 font-semibold">
          {mensagem}
        </div>
      )}
    </div>
  );
};

export default CriarLead;
