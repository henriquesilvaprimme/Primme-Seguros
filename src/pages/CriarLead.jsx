import React, { useState } from 'react';

const CriarLead = () => {
  const [form, setForm] = useState({
    name: '',
    vehicleModel: '',
    vehicleYearModel: '',
    city: '',
    phone: '',
    insuranceType: '',
  });

  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    const novoLead = {
      id: crypto.randomUUID(),
      name: form.name,
      vehiclemodel: form.vehicleModel,
      vehicleyearmodel: form.vehicleYearModel,
      city: form.city,
      phone: form.phone,
      insurancetype: form.insuranceType,
      data: new Date().toISOString(),
      responsavel: '',
      status: '',
      editado: '',
    };

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=salvar_lead',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lead: novoLead }),
        }
      );

      const texto = await response.text();

      if (texto.includes('ok') || texto.includes('adicionado')) {
        setMensagem('✅ Lead criado com sucesso!');
        setForm({
          name: '',
          vehicleModel: '',
          vehicleYearModel: '',
          city: '',
          phone: '',
          insuranceType: '',
        });
      } else {
        setMensagem('❌ Erro ao salvar o lead: ' + texto);
      }
    } catch (error) {
      console.error(error);
      setMensagem('❌ Erro de conexão ao salvar o lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Criar Novo Lead</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Nome"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="vehicleModel"
          placeholder="Modelo do Veículo"
          value={form.vehicleModel}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="vehicleYearModel"
          placeholder="Ano/Modelo"
          value={form.vehicleYearModel}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="city"
          placeholder="Cidade"
          value={form.city}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Telefone"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="insuranceType"
          placeholder="Tipo de Seguro"
          value={form.insuranceType}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Salvando...' : 'Criar Lead'}
        </button>
      </form>

      {mensagem && (
        <p className="mt-4 text-center text-sm text-gray-800">{mensagem}</p>
      )}
    </div>
  );
};

export default CriarLead;
