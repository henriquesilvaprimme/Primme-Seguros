// CriarLead.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  const [nomeLead, setNomeLead] = useState('');
  const [emailLead, setEmailLead] = useState('');
  const [telefoneLead, setTelefoneLead] = useState('');
  const [origemLead, setOrigemLead] = useState(''); // Ex: 'Site', 'Telefone', 'Indicação'

  const navigate = useNavigate();

  const handleCriar = async () => {
    if (!nomeLead || !emailLead || !telefoneLead || !origemLead) {
      alert('Por favor, preencha todos os campos do lead.');
      return;
    }

    const novoLead = {
      id: Date.now(), // Um ID único para o lead
      nome: nomeLead,
      email: emailLead,
      telefone: telefoneLead,
      origem: origemLead,
      dataCriacao: new Date().toLocaleString(), // Data e hora de criação
      status: 'Novo', // Status inicial do lead
    };

    try {
      await enviarLeadParaSheets(novoLead); // Chama a função para enviar para o Sheets
      adicionarLead(novoLead); // Adiciona o lead ao estado local da aplicação (se houver)
      alert('Lead criado e enviado com sucesso!');
      navigate('/leads'); // Redireciona para a página de leads (ajuste conforme sua rota)
    } catch (error) {
      console.error('Erro ao criar ou enviar lead:', error);
      alert('Ocorreu um erro ao criar o lead. Por favor, tente novamente.');
    }
  };

  const enviarLeadParaSheets = async (lead) => {
    // ATENÇÃO: Substitua ESTA URL pela URL DO SEU GOOGLE APPS SCRIPT DEPLOYADO
    // Este é o mesmo conceito da URL do criar_usuario, mas para leads.
    const urlDoAppsScript = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?action=criar_lead'; 

    try {
      const response = await fetch(urlDoAppsScript, {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar problemas de CORS com o Apps Script
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // No modo 'no-cors', você não consegue ler a resposta diretamente.
      // O sucesso é inferido pela ausência de erros na requisição.
      // console.log('Requisição enviada para o Apps Script.');

    } catch (error) {
      console.error('Erro ao enviar lead para o Google Sheets via Apps Script:', error);
      throw error; // Propaga o erro para ser tratado por handleCriar
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-green-700 mb-4">Criar Novo Lead</h2>

      <div>
        <label className="block text-gray-700">Nome do Lead</label>
        <input
          type="text"
          value={nomeLead}
          onChange={(e) => setNomeLead(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Email do Lead</label>
        <input
          type="email"
          value={emailLead}
          onChange={(e) => setEmailLead(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Telefone do Lead</label>
        <input
          type="text"
          value={telefoneLead}
          onChange={(e) => setTelefoneLead(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Origem do Lead</label>
        <select
          value={origemLead}
          onChange={(e) => setOrigemLead(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">Selecione a origem</option>
          <option value="Site">Site</option>
          <option value="Telefone">Telefone</option>
          <option value="Indicacao">Indicação</option>
          <option value="Redes Sociais">Redes Sociais</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Criar Lead
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
