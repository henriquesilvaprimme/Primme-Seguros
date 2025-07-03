import React, { useState } from 'react';

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

const gerarId = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

export default function CriarLead({ fetchLeadsFromSheet }) {
  const [form, setForm] = useState({
    name: '',
    vehiclemodel: '',
    vehicleyearmodel: '',
    city: '',
    phone: '',
    insurancetype: '',
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    const lead = {
      id: gerarId(),
      name: form.name,
      vehiclemodel: form.vehiclemodel,
      vehicleyearmodel: form.vehicleyearmodel,
      city: form.city,
      phone: form.phone,
      insurancetype: form.insurancetype,
      data: new Date().toLocaleDateString('pt-BR'),
      responsavel: '',
      status: '',
      editado: '',
      origem: 'Leads',
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'salvarLead', lead }),
        mode: 'no-cors', // <=== aqui está o que pediu
      });

      // Como com no-cors não tem resposta, assumimos sucesso
      setMensagem('Lead criado (envio feito, sem confirmação).');
      setForm({
        name: '',
        vehiclemodel: '',
        vehicleyearmodel: '',
        city: '',
        phone: '',
        insurancetype: '',
      });

      fetchLeadsFromSheet?.();
    } catch (err) {
      setMensagem('Erro ao salvar lead: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-indigo-700">Criar Lead</h2>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
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
          name="vehiclemodel"
          placeholder="Modelo do veículo"
          value={form.vehiclemodel}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
        <input
          required
          name="vehicleyearmodel"
          placeholder="Ano/Modelo"
          value={form.vehicleyearmodel}
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
          name="insurancetype"
          placeholder="Tipo de seguro (Auto, Moto…)"
          value={form.insurancetype}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg font-medium text-white transition ${
            loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Salvando…' : 'Criar Lead'}
        </button>
      </form>

      {mensagem && (
        <p className="mt-4 text-center text-sm text-indigo-600">{mensagem}</p>
      )}
    </div>
  );
}
