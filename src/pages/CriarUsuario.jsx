import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarUsuario = ({ adicionarUsuario }) => {
  const [usuario, setUsuario] = useState(''); // Será usado como login
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState(''); // Nome completo
  const [senha, setSenha] = useState('');

  const navigate = useNavigate();

  // Nova URL do Google Apps Script
  const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

  const handleCriar = () => {
    if (!usuario || !email || !nome || !senha) {
      alert('Preencha todos os campos.');
      return;
    }

    const novoUsuario = {
      id: Date.now(), // ID temporário, o Apps Script pode gerar um ID persistente
      usuario, // Usado como login
      email,
      nome, // Nome completo
      senha,
      tipo: 'Usuario', // Tipo padrão
      status: 'Ativo', // Status padrão
    };

    criarUsuarioFunc(novoUsuario); // Chama a função para enviar ao Apps Script

    // Chama a função para adicionar ao estado local no componente pai (App.jsx)
    adicionarUsuario(novoUsuario);
    
    // Navega para a página de usuários após a criação
    navigate('/usuarios');
  };

  const criarUsuarioFunc = async (usuarioData) => {
    try {
      // Usando a nova URL do Google Apps Script
      const response = await fetch(`${GOOGLE_SHEETS_SCRIPT_URL}?action=criar_usuario`, {
        method: 'POST',
        mode: 'no-cors', // Necessário para Google Apps Script se não configurar CORS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuarioData),
      });

      // Se o modo for 'no-cors', a resposta não será acessível (response.ok, response.json() não funcionam)
      // Você confiará no sucesso da requisição HTTP (status 200) e na atualização da planilha
      alert('Usuário criado com sucesso!'); // Mensagem otimista

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4">Criar Novo Usuário</h2>

      <div>
        <label className="block text-gray-700">Usuário (Login)</label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Nome Completo</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Senha</label>
        <input
          type="password"
          value={senha}
