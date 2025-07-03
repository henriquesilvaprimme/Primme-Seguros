import React, { useState } from 'react';

const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

export default function CriarLead() {
  const [form, setForm] = useState({
    name: '',
    vehicleModel: '',
    vehicleYearModel: '',
    city: '',
    phone: '',
    insuranceType: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Monta o objeto para enviar ao Google Sheets
    const leadData = {
      action: 'add_lead',  // por exemplo, no seu Apps Script pode ser usado para diferenciar a ação
      lead: {
        id: crypto.randomUUID(),
        name: form.name,
        vehiclemodel: form.vehicleModel,
        vehicleyearmodel: form.vehicleYearModel,
        city: form.city,
        phone: form.phone,
        insurancetype: form.insuranceType,
        status: 'Novo',
        criadoEm: new Date().toISOString(),
      },
    };

    try {
      await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // geralmente usado para Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      setMessage('Lead criado com sucesso!');
      setForm({
        name: '',
        vehicleModel: '',
        vehicleYearModel: '',
        city: '',
        phone: '',
        insuranceType: '',
      });
    } catch (error) {
      setMessage('Erro ao criar lead.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Criar Novo Lead</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Nome"
          value={form.name}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="vehicleModel"
          placeholder="Modelo do Veículo"
          value={form.vehicleModel}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="vehicleYearModel"
          placeholder="Ano do Veículo"
          value={form.vehicleYearModel}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="city"
          placeholder="Cidade"
          value={form.city}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Telefone"
          value={form.phone}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="insuranceType"
          placeholder="Tipo de Seguro"
          value={form.insuranceType}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Salvar Lead'}
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
