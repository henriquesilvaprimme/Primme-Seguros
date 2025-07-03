import React, { useState } from 'react';

/** URL pública do seu Apps Script */
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

/** Gera um ID simples: timestamp + número aleatório */
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
      vehiclemodel: form.vehicleModel,
      vehicleyearmodel: form.vehicleYearModel,
      city: form.city,
      phone: form.phone,
      insurancetype: form.insuranceType,
      data: new Date().toLocaleDateString('pt-BR'),
      responsável: '', // se quiser, preencha com usuário logado
      status: '',
      editado: '',
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'salvarLead', lead }),
        // Se ainda houver erro de pre-flight, teste mode: 'no-cors'
      });

      if (!res.ok && res.type !== 'opaque') throw new Error('Erro ao salvar lead.');

      setMensagem('Lead criado com sucesso!');
      setForm({
        name: '',
        vehicleModel: '',
        vehicleYearModel: '',
        city: '',
        phone: '',
        insuranceType: '',
      });
      // Recarrega lista, se a função foi passada como prop
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
          placeholder="Tipo de seguro (Auto, Moto…)"
          value={form.insuranceType}
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
};

export default CriarLead;
