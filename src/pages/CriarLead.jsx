import React, { useState } from 'react';

/** URL pública do seu Apps Script */
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

/** Gera um ID único: timestamp + número aleatório */
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

    // Monta o objeto lead com as colunas da planilha (normalizadas)
    const lead = {
      id: gerarId(),
      name: form.name,
      vehiclemodel: form.vehiclemodel,
      vehicleyearmodel: form.vehicleyearmodel,
      city: form.city,
      phone: form.phone,
      insurancetype: form.insurancetype,
      data: new Date().toLocaleDateString('pt-BR'),
      responsavel: '', // pode preencher se desejar
      status: '',
      editado: '',
      origem: 'Leads', // importante para o Apps Script saber a aba
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'salvarLead', lead }),
        // NÃO incluir headers nem modo no-cors
      });

      if (!res.ok && res.type !== 'opaque') throw new Error('Erro ao salvar lead.');

      setMensagem('Lead criado com sucesso!');
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
      setMensagem(err.message);
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
