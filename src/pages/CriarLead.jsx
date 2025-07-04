import React, { useState } from 'react';

// Use a mesma URL base que definimos no App.jsx para criação de leads.
// Certifique-se de que esta URL aponte para o seu Apps Script e que ele saiba como
// lidar com a 'action=criar_lead' no método doPost.
const GOOGLE_SHEETS_LEAD_CREATION_URL = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?action=criar_lead'; // Mantenha sua URL real aqui

const CriarLead = ({ adicionarLead }) => {
  const [formData, setFormData] = useState({
    name: '',
    vehicleModel: '',
    vehicleYearModel: '',
    city: '',
    phone: '',
    insuranceType: 'Novo', // Definido como 'Novo' por padrão
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Gera um ID simples baseado no timestamp atual (para simular um ID único)
    const newId = new Date().getTime();
    // Pega a data e hora atual no formato ISO (pode ser ajustado conforme a necessidade do Sheets)
    const currentDate = new Date().toISOString();

    // Cria o objeto do novo lead com as colunas especificadas
    const newLead = {
      ID: newId,
      name: formData.name,
      vehicleModel: formData.vehicleModel,
      vehicleYearModel: formData.vehicleYearModel,
      city: formData.city,
      phone: formData.phone,
      insuranceType: formData.insuranceType, // Agora virá do select
      data: currentDate, // Coluna 'data'
      status: 'Novo',
      confirmado: false,
      insurer: '',
      insurerConfirmed: false,
      usuarioId: null,
      premioLiquido: '',
      comissao: '',
      parcelamento: '',
      responsavel: '',
      editado: currentDate // Data de criação como data de edição inicial
    };

    try {
      // Faz a chamada para o Apps Script
      const response = await fetch(GOOGLE_SHEETS_LEAD_CREATION_URL, {
        method: 'POST',
        mode: 'no-cors', // Necessário para evitar erros CORS com Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLead), // Envia o objeto do lead
      });

      setMessage('✅ Lead criado com sucesso!');
      setFormData({
        name: '',
        vehicleModel: '',
        vehicleYearModel: '',
        city: '',
        phone: '',
        insuranceType: 'Novo', // Reseta para 'Novo' após o envio
      });
      // Adiciona o novo lead à lista no estado global do App.jsx
      adicionarLead(newLead);

    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      setMessage('Erro ao criar lead. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Criar Novo Lead</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Nome do Cliente:
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="vehicleModel" className="block text-gray-700 text-sm font-bold mb-2">
              Modelo do Veículo:
            </label>
            <input
              type="text"
              id="vehicleModel"
              name="vehicleModel"
              value={formData.vehicleModel}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="vehicleYearModel" className="block text-gray-700 text-sm font-bold mb-2">
              Ano/Modelo do Veículo:
            </label>
            <input
              type="text"
              id="vehicleYearModel"
              name="vehicleYearModel"
              value={formData.vehicleYearModel}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">
              Cidade:
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
              Telefone:
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="(XX) XXXXX-XXXX"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="insuranceType" className="block text-gray-700 text-sm font-bold mb-2">
              Tipo de Seguro:
            </label>
            <select
              id="insuranceType"
              name="insuranceType"
              value={formData.insuranceType}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value=" "> </option>
              <option value="Novo">Novo</option>
              <option value="Renovação">Renovação</option>
              <option value="Indicação">Indicação</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Lead'}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm font-semibold text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
};

export default CriarLead;
