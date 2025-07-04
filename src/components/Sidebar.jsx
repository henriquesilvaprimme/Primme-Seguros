import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Search, Trophy, UserPlus, UserCircle, PlusCircle } from 'lucide-react';

// Renomeie a prop para 'usuarioLogado' para corresponder ao que você passa do App.jsx
// E adicione um valor padrão (objeto vazio) para evitar erros de undefined antes do carregamento
const Sidebar = ({ usuarioLogado }) => {

  // Adicione uma verificação para garantir que usuarioLogado existe antes de tentar acessar suas propriedades
  // Se usuarioLogado for null/undefined, isAdmin será false, o que é seguro.
  const isAdmin = usuarioLogado?.tipo === 'Admin';

  // Se usuarioLogado ainda for null/undefined, não renderize nada (ou um placeholder)
  // Isso evita o erro 'Cannot read properties of undefined' no momento da renderização inicial
  if (!usuarioLogado) {
    return null; // Ou um spinner, ou uma mensagem de carregamento
  }

  return (
    <div className="w-64 bg-white shadow-xl border-r border-gray-200 h-full p-6">
      <h2 className="text-xl font-semibold mb-8">
        {/* Use optional chaining aqui também para máxima segurança,
            embora o 'if (!usuarioLogado)' acima já ajude.
            E capitalize o nome do usuário. */}
        Olá, {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() + usuarioLogado.nome.slice(1) : 'Visitante'}
      </h2>

      <nav className="flex flex-col gap-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
              isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
            }`
          }
        >
          <Home size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/leads"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
              isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
            }`
          }
        >
          <Users size={20} />
          Leads
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/criar-lead"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
                isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
              }`
            }
          >
            <PlusCircle size={20} />
            Criar Lead
          </NavLink>
        )}

        <NavLink
          to="/leads-fechados"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
              isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
            }`
          }
        >
          <Users size={20} />
          Leads Fechados
        </NavLink>

        <NavLink
          to="/leads-perdidos"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
              isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
            }`
          }
        >
          <Users size={20} />
          Leads Perdidos
        </NavLink>

        <NavLink
          to="/buscar-lead"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
              isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
            }`
          }
        >
          <Search size={20} />
          Buscar Lead
        </NavLink>

        <NavLink
          to="/ranking"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
              isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
            }`
          }
        >
          <Trophy size={20} />
          Ranking
        </NavLink>

        {isAdmin && (
          <>
            <NavLink
              to="/criar-usuario"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
                  isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`
              }
            >
              <UserPlus size={20} />
              Criar Usuário
            </NavLink>

            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition ${
                  isActive ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`
              }
            >
              <UserCircle size={20} />
              Usuários
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
