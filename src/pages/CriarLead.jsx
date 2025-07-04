import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Remova se não for redirecionar após criar o lead
import './CriarLead.css'; // Opcional: para estilos, crie este arquivo se quiser

const CriarLead = () => {
  // AQUI ESTÁ A NOVA URL DO SEU APP WEB GOOGLE APPS SCRIPT
  const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec';

  const [formData, setFormData] = useState({
    name: '',
    vehicleModel: '',
    vehicleYearModel: '',
    city: '',
    phone: '',
    insuranceType: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // const navigate = useNavigate(); // Remova se não for usar

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!formData.name || !formData.phone || !formData.vehicleModel) {
      setMessage('Por favor, preencha pelo menos o Nome, Telefone e Modelo do Veículo.');
      setLoading(false);
      return;
    }

    // Gerar um ID único (simples, baseado em timestamp)
    const newLeadId = Date.now().toString();
    const createdAt = new Date().toISOString(); // Data de criação em formato ISO

    // Dados a serem enviados para o Google Apps Script
    const dataToSend = {
      id: newLeadId,
      name: formData.name,
      vehicleModel: formData.vehicleModel,
      vehicleYearModel: formData.vehicleYearModel,
      city: formData.city,
      phone: formData.phone,
      insuranceType: formData.insuranceType,
      status: 'Novo', // Status inicial padrão para novos leads
      confirmado: 'Não', // Padrão
      insurer: '',
      insurerConfirmed: 'Não',
      usuarioId: '', // Pode ser preenchido posteriormente, ou use um ID padrão se houver
      premioLiquido: 0,
      comissao: 0,
      parcelamento: '',
      createdAt: createdAt,
    };

    try {
      // A requisição POST para o GAS será feita sem um parâmetro 'v' no URL para indicar que é uma criação de lead
      // (conforme a lógica que ajustamos no `doPost` do GAS nas respostas anteriores).
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        // Usamos 'no-cors' como no seu CriarUsuario.jsx.
        // Lembre-se: 'no-cors' impede que o frontend veja a resposta real do GAS.
        // Se precisar ler a mensagem de sucesso ou erro do GAS, você precisará usar 'cors'
        // e garantir que o GAS envie os cabeçalhos CORS corretos.
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      // Com 'no-cors', 'response.ok' sempre será true, e 'response.json()' vai falhar.
      // O sucesso é inferido pela ausência de erro na requisição.
      // Se você mudar para 'cors', descomente a linha abaixo para ler a resposta real.
      // const result = await response.json();
      // console.log("Resultado do GAS:", result);

      setMessage('Lead salvo com sucesso! (Verifique a planilha)');
      setFormData({ // Limpa o formulário após o envio
        name: '',
        vehicleModel: '',
        vehicleYearModel: '',
        city: '',
        phone: '',
        insuranceType: '',
      });
      // if (navigate) navigate('/leads'); // Exemplo de redirecionamento, se usar react-router-dom
    } catch (error) {
      console.error('Erro ao salvar o lead:', error);
      setMessage(`Erro ao salvar o lead: ${error.message}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4">Criar Novo Lead</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="block text-gray-700">Nome:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="form-group">
          <label htmlFor="vehicleModel" className="block text-gray-700">Modelo do Veículo:</label>
          <input
            type="text"
            id="vehicleModel"
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="form-group">
          <label htmlFor="vehicleYearModel" className="block text-gray-700">Ano Modelo do Veículo:</label>
          <input
            type="text"
            id="vehicleYearModel"
            name="vehicleYearModel"
            value={formData.vehicleYearModel}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="form-group">
          <label htmlFor="city" className="block text-gray-700">Cidade:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone" className="block text-gray-700">Telefone:</label>
          <input
            type="tel" // Use type="tel" para telefones
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="form-group">
          <label htmlFor="insuranceType" className="block text-gray-700">Tipo de Seguro:</label>
          <input
            type="text"
            id="insuranceType"
            name="insuranceType"
            value={formData.insuranceType}
            onChange={handleChange}
            required
            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition mt-4"
        >
          {loading ? 'Salvando...' : 'Salvar Lead'}
        </button>
      </form>
      {message && <p className="message text-center mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  );
};

export default CriarLead;
