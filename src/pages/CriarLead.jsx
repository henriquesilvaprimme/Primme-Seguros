import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = () => {
  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYearModel, setVehicleYearModel] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [insuranceType, setInsuranceType] = useState('');

  const navigate = useNavigate();

  const handleCriarLead = () => {
    if (!name || !vehicleModel || !vehicleYearModel || !city || !phone || !insuranceType) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const novoLead = {
      ID: Date.now(), // id único numérico
      name,
      vehicleModel,
      vehicleYearModel,
      city,
      phone,
      insuranceType,
      data: new Date().toISOString(),
    };

    fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=criar_lead', {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoLead),
    })
      .then(() => {
        alert('Lead criado com sucesso!');
        navigate('/leads'); // ajusta para a rota que lista leads no seu app
      })
      .catch((err) => {
        alert('Erro ao criar lead: ' + err.message);
      });
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-3xl font-bold mb-6">Criar Novo Lead</h2>

      <input
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input"
      />
      <input
        placeholder="Modelo do Veículo"
        value={vehicleModel}
        onChange={(e) => setVehicleModel(e.target.value)}
        className="input"
      />
      <input
        placeholder="Ano do Modelo"
        value={vehicleYearModel}
        onChange={(e) => setVehicleYearModel(e.target.value)}
        className="input"
      />
      <input
        placeholder="Cidade"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="input"
      />
      <input
        placeholder="Telefone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="input"
      />
      <input
        placeholder="Tipo de Seguro"
        value={insuranceType}
        onChange={(e) => setInsuranceType(e.target.value)}
        className="input"
      />

      <button onClick={handleCriarLead} className="btn">
        Criar Lead
      </button>
    </div>
  );
};

export default CriarLead;
