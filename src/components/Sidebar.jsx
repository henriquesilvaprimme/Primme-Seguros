import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Search, Trophy, UserPlus, UserCircle, PlusCircle, LogOut } from 'lucide-react'; // Importei LogOut

const Sidebar = ({ usuarioLogado, handleLogout }) => { // Recebe usuarioLogado e handleLogout

  if (!usuarioLogado) {
    return null; // Não renderiza o sidebar se não houver usuário logado
  }

  const isAdmin = usuarioLogado.tipo === 'Admin';
  const nomeExibicao = usuarioLogado.nome
    ? usuarioLogado.nome.charAt(0).toUpperCase() + usuarioLogado.nome.slice(1)
    : 'Usuário';

  return (
    <div className="w-64 bg-white shadow-xl border-r border-gray-200 h-full p-6 flex flex-col"> {/* Adicionei flex-col aqui */}
      <div className="text-xl font-semibold mb-8 text-center"> {/* Adicionei text-center */}
        Olá, {nomeExibicao}
      </div>

      <nav className="flex flex-col gap-4 flex-grow"> {/* flex-grow para ocupar espaço disponível */}
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

      {/* Botão de Logout */}
      <div className="mt-auto"> {/* mt-auto para empurrar para o final */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-100 text-red-600 transition w-full"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
