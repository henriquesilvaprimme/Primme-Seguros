import React, { useState } from 'react';

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

const gerarId = () => `${Date.now()}${Math.floor(Math.random() * 1000000)}`;

export default function CriarLead({ fetchLeadsFromSheet }) {
  const [form, setForm] = useState({
    name: '',
    vehicleModel: '',
    vehicleYearModel: '',
    city: '',
    phone: '',
    insuranceType: '',
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    // Monta o objeto lead com campo origem fixo para salvar na aba "Leads"
    const novoLead = {
      id: gerarId(),
      name: form.name,
      vehiclemodel: form.vehicleModel,
      vehicleyearmodel: form.vehicleYearModel,
      city: form.city,
      phone: form.phone,
      insurancetype: form.insuranceType,
      data: new Date().toLocaleDateString('pt-BR'),
      origem: 'Leads',  // <<< ESSENCIAL para salvar na aba correta
      status: '',
      responsavel: '',
      editado: '',
    };

    try {
      await fetch(`${SCRIPT_URL}?v=salvar_lead`, {
        method: 'POST',
        mode: 'no-cors', // remove o problema CORS, mas não permite ler resposta
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead: novoLead }),
      });

      setMensagem('✅ Lead criado com sucesso!');
      setForm({
        name: '',
        vehicleModel: '',
        vehicleYearModel: '',
        city: '',
        phone: '',
        insuranceType: '',
      });

      fetchLeadsFromSheet?.();
    } catch (error) {
      setMensagem('❌ Erro ao salvar o lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Criar Lead</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          name="name"
          placeholder="Nome"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        <input
          required
          name="vehicleModel"
          placeholder="Modelo do veículo"
          value={form.vehicleModel}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        <input
          required
          name="vehicleYearModel"
          placeholder="Ano/Modelo"
          value={form.vehicleYearModel}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        <input
          required
          name="city"
          placeholder="Cidade"
          value={form.city}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        <input
          required
          name="phone"
          placeholder="Telefone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        <input
          required
          name="insuranceType"
          placeholder="Tipo de seguro (Auto, Moto, etc.)"
          value={form.insuranceType}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 rounded ${
            loading ? 'opacity-50' : 'hover:bg-blue-700'
          }`}
        >
          {loading ? 'Salvando...' : 'Criar Lead'}
        </button>
      </form>
      {mensagem && (
        <p className="mt-4 text-center text-sm text-indigo-700">{mensagem}</p>
      )}
    </div>
  );
}
