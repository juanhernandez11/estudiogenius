import React from 'react';
import { Home, PlusCircle, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView }) => {
  const navItemClass = (isActive: boolean) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`;

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe">
      <div className="grid h-16 grid-cols-3 mx-auto max-w-md">
        <button 
          onClick={() => onChangeView('LIST')}
          className={navItemClass(currentView === 'LIST' || currentView === 'DETAIL')}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Inicio</span>
        </button>
        
        <button 
          onClick={() => onChangeView('CREATE')}
          className="flex items-center justify-center -mt-8"
        >
          <div className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-full shadow-lg text-white shadow-indigo-200 active:scale-95 transition-transform hover:bg-indigo-700">
            <PlusCircle className="w-8 h-8" />
          </div>
        </button>
        
        <button 
          onClick={() => onChangeView('SETTINGS')}
          className={navItemClass(currentView === 'SETTINGS')}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};