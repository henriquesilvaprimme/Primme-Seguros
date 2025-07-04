import React, { useState } from 'react';

const CriarLead = ({ adicionarLead, usuarioLogado }) => { // Adicionado usuarioLogado
  // Estados para armazenar os dados do novo lead
  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYearModel, setVehicleYearModel] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [status, setStatus] = useState('Novo'); // Status inicial
  const [message, setMessage] = useState(''); // Estado para mensagens de feedback

  // URL para o Google Apps Script (certifique-se de que esta URL está correta e é para a função de criação)
  const GOOGLE_SHEETS_CREATE_LEAD_URL = 'https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=criar_lead'; // Verifique se o 'v=criar_lead' é o correto para seu GAS

  // Função para exibir mensagens ao usuário
  const showMessage = (msg, type = 'info') => {
    setMessage({ msg, type });
    // Limpa a mensagem após 3 segundos
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  // Lida com a criação do lead
  const handleCriar = async () => {
    // Valida se os campos obrigatórios estão preenchidos
    if (!name || !phone || !vehicleModel || !city) { // Campos mínimos obrigatórios
      showMessage('Por favor, preencha todos os campos obrigatórios: Nome, Telefone, Modelo do Veículo e Cidade.', 'error');
      return;
    }

    // Cria o objeto do novo lead com a estrutura esperada pelo App.jsx e Google Sheets
    const now = new Date();
    const newLead = {
      id: crypto.randomUUID(), // Usar crypto.randomUUID() para IDs mais robustos
      name: name,
      vehicleModel: vehicleModel,
      vehicleYearModel: vehicleYearModel,
      city: city,
      phone: phone,
      insuranceType: insuranceType,
      status: status,
      confirmado: false, // Novo lead não está confirmado por padrão
      insurer: '',
      insurerConfirmed: false,
      usuarioId: usuarioLogado ? usuarioLogado.id : null, // Associa o ID do usuário logado
      premioLiquido: '',
      comissao: '',
      parcelamento: '',
      createdAt: now.toISOString(), // Data de criação
      responsavel: usuarioLogado ? usuarioLogado.nome : 'Não Atribuído', // Atribui o responsável pelo lead
      editado: now.toISOString() // Data da última edição (agora na criação)
    };

    // Envia o lead para o Google Apps Script
    const success = await criarLeadFunc(newLead);

    if (success) {
      // Adiciona o lead à lista local no App.jsx
      if (adicionarLead) {
        adicionarLead(newLead);
      }

      // Limpa os campos do formulário
      setName('');
      setVehicleModel('');
      setVehicleYearModel('');
      setCity('');
      setPhone('');
      setInsuranceType('');
      setStatus('Novo'); // Reseta o status para "Novo"
      showMessage('Lead criado com sucesso!', 'success');
    } else {
      showMessage('Erro ao criar lead. Tente novamente.', 'error');
    }
  };

  // Função assíncrona para enviar os dados do lead para o Google Apps Script
  const criarLeadFunc = async (lead) => {
    try {
      const response = await fetch(GOOGLE_SHEETS_CREATE_LEAD_URL, {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar problemas de CORS com o Google Apps Script
        body: JSON.stringify(lead), // Converte o objeto lead para JSON
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Em modo 'no-cors', a resposta não pode ser lida diretamente.
      // Apenas a ausência de erro na rede indica que a requisição foi enviada.
      console.log("Requisição de criação de lead enviada. Status:", response.type);
      return true; // Sucesso na requisição (não garante sucesso no GAS, mas a requisição foi feita)
    } catch (error) {
      console.error('Erro ao enviar lead para o Google Apps Script:', error);
      return false; // Erro na requisição
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4">Criar Novo Lead</h2>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg border-l-4 ${message.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-blue-100 border-blue-500 text-blue-700'}`} role="alert">
          <p className="font-bold">{message.type === 'error' ? 'Erro' : 'Informação'}</p>
          <p>{message.msg}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-gray-700">Nome do Cliente</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Nome completo do cliente"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-gray-700">Telefone</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="(XX) XXXXX-XXXX"
        />
      </div>

      <div>
        <label htmlFor="vehicleModel" className="block text-gray-700">Modelo do Veículo</label>
        <input
          id="vehicleModel"
          type="text"
          value={vehicleModel}
          onChange={(e) => setVehicleModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Ex: Onix, Corolla, Civic"
        />
      </div>

      <div>
        <label htmlFor="vehicleYearModel" className="block text-gray-700">Ano/Modelo do Veículo</label>
        <input
          id="vehicleYearModel"
          type="text"
          value={vehicleYearModel}
          onChange={(e) => setVehicleYearModel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Ex: 2023/2024"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-gray-700">Cidade</label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Nome da cidade"
        />
      </div>

      <div>
        <label htmlFor="insuranceType" className="block text-gray-700">Tipo de Seguro</label>
        <select
          id="insuranceType"
          value={insuranceType}
          onChange={(e) => setInsuranceType(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Selecione o Tipo de Seguro</option>
          <option value="Auto">Auto</option>
          <option value="Residencial">Residencial</option>
          <option value="Vida">Vida</option>
          <option value="Empresarial">Empresarial</option>
          <option value="Viagem">Viagem</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-gray-700">Status Inicial</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="Novo">Novo</option>
          <option value="Em Contato">Em Contato</option>
          <option value="Qualificado">Qualificado</option>
          <option value="Não Qualificado">Não Qualificado</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition"
        >
          Criar Lead
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
