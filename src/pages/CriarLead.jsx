import React, { useState } from 'react';

const CriarLead = ({ adicionarLead }) => {
  // Estados para armazenar os dados do novo lead
  const [nomeLead, setNomeLead] = useState('');
  const [emailLead, setEmailLead] = useState('');
  const [telefone, setTelefone] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [origem, setOrigem] = useState(''); // Ex: "Site", "Telefone", "Indicação"
  const [status, setStatus] = useState('Novo'); // Ex: "Novo", "Em Contato", "Qualificado"
  const [message, setMessage] = useState(''); // Estado para mensagens de feedback

  // Função para exibir mensagens ao usuário
  const showMessage = (msg) => {
    setMessage(msg);
    // Limpa a mensagem após 3 segundos
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  // Lida com a criação do lead
  const handleCriar = async () => {
    // Valida se todos os campos obrigatórios estão preenchidos
    if (!nomeLead || !emailLead || !telefone || !empresa || !origem) {
      showMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Cria o objeto do novo lead
    const novoLead = {
      id: Date.now(), // ID único baseado no timestamp
      nome: nomeLead,
      email: emailLead,
      telefone: telefone,
      empresa: empresa,
      origem: origem,
      status: status,
      dataCriacao: new Date().toISOString(), // Data de criação do lead
    };

    // Chama a função para enviar o lead para o Google Apps Script
    await criarLeadFunc(novoLead);

    // Adiciona o lead à lista local (se houver uma função para isso)
    if (adicionarLead) {
      adicionarLead(novoLead);
    }

    // Limpa os campos do formulário
    setNomeLead('');
    setEmailLead('');
    setTelefone('');
    setEmpresa('');
    setOrigem('');
    setStatus('Novo'); // Reseta o status para "Novo"
    showMessage('Lead criado com sucesso!');
  };

  // Função assíncrona para enviar os dados do lead para o Google Apps Script
  const criarLeadFunc = async (lead) => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbwDRDM53Ofa4o5n7OdR_Qg3283039x0Sptvjg741Hk7v0DXf8oji4aBpGji-qWHMgcorw/exec?v=criar_lead', {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar problemas de CORS com o Google Apps Script
        body: JSON.stringify(lead), // Converte o objeto lead para JSON
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Em modo 'no-cors', a resposta não pode ser lida.
      // console.log("Resposta do GAS (no-cors):", response);
    } catch (error) {
      console.error('Erro ao enviar lead para o Google Apps Script:', error);
      showMessage('Erro ao criar lead. Tente novamente.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4">Criar Novo Lead</h2>

      {/* Mensagem de feedback */}
      {message && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg" role="alert">
          <p className="font-bold">Informação</p>
          <p>{message}</p>
        </div>
      )}

      <div>
        <label htmlFor="nomeLead" className="block text-gray-700">Nome do Lead</label>
        <input
          id="nomeLead"
          type="text"
          value={nomeLead}
          onChange={(e) => setNomeLead(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Nome completo do lead"
        />
      </div>

      <div>
        <label htmlFor="emailLead" className="block text-gray-700">Email</label>
        <input
          id="emailLead"
          type="email"
          value={emailLead}
          onChange={(e) => setEmailLead(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="email@exemplo.com"
        />
      </div>

      <div>
        <label htmlFor="telefone" className="block text-gray-700">Telefone</label>
        <input
          id="telefone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="(XX) XXXXX-XXXX"
        />
      </div>

      <div>
        <label htmlFor="empresa" className="block text-gray-700">Empresa</label>
        <input
          id="empresa"
          type="text"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Nome da empresa"
        />
      </div>

      <div>
        <label htmlFor="origem" className="block text-gray-700">Origem</label>
        <select
          id="origem"
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Selecione a Origem</option>
          <option value="Site">Site</option>
          <option value="Telefone">Telefone</option>
          <option value="Indicação">Indicação</option>
          <option value="Campanha Marketing">Campanha de Marketing</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-gray-700">Status</label>
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
          <option value="Convertido">Convertido</option>
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
