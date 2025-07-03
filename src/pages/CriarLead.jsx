import React, { useState } from 'react';

const CriarLead = ({ adicionarLead }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    vehicleModel: '',
    vehicleYearModel: '',
    insuranceType: '',
    status: '',
    responsavel: '',
  });

  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarFormulario = () => {
    if (!form.name.trim()) {
      alert('Por favor, preencha o nome.');
      return false;
    }
    if (!form.phone.trim()) {
      alert('Por favor, preencha o telefone.');
      return false;
    }
    // Pode adicionar mais validações se quiser
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setEnviando(true);

    try {
      await adicionarLead({
        ...form,
        status: form.status || 'Em contato',
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
      });

      alert('Lead criado com sucesso!');
      setForm({
        name: '',
        phone: '',
        city: '',
        vehicleModel: '',
        vehicleYearModel: '',
        insuranceType: '',
        status: '',
        responsavel: '',
      });
    } catch (error) {
      alert('Erro ao criar lead, tente novamente.');
      console.error(error);
    }

    setEnviando(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Criar Lead</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Nome completo"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" htmlFor="phone">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="(xx) xxxxx-xxxx"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" htmlFor="city">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Cidade"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" htmlFor="vehicleModel">
            Modelo do Veículo
          </label>
          <input
            id="vehicleModel"
            name="vehicleModel"
            value={form.vehicleModel}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Fiat Toro"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" htmlFor="vehicleYearModel">
            Ano do Modelo
          </label>
          <input
            id="vehicleYearModel"
            name="vehicleYearModel"
            value={form.vehicleYearModel}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: 2023"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" htmlFor="insuranceType">
            Tipo de Seguro
          </label>
          <input
            id="insuranceType"
            name="insuranceType"
            value={form.insuranceType}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Auto, Moto"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Selecione o status</option>
            <option value="Em contato">Em contato</option>
            <option value="Sem contato">Sem contato</option>
            <option value="Fechado">Fechado</option>
            <option value="Perdido">Perdido</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1" htmlFor="responsavel">
            Responsável
          </label>
          <input
            id="responsavel"
            name="responsavel"
            value={form.responsavel}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Nome do responsável (opcional)"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Criar Lead'}
        </button>
      </form>
    </div>
  );
};

export default CriarLead;
