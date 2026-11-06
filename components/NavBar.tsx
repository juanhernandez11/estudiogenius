import React from 'react';
import { Home, PlusCircle, Settings, Target } from 'lucide-react';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  hideOnMobile?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, onChangeView, hideOnMobile = false }) => {
  const navItemClass = (isActive: boolean) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 rounded-xl transition-colors lg:h-12 lg:flex-row lg:justify-start lg:gap-3 lg:space-y-0 lg:px-4 ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'}`;

  return (
    <nav className={`${hideOnMobile ? 'hidden lg:block' : 'block'} fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white pb-safe dark:border-slate-700 dark:bg-slate-800 lg:absolute lg:bottom-0 lg:left-0 lg:top-0 lg:w-64 lg:border-r lg:border-t-0 lg:p-5 lg:pb-5`}>
      <div className="hidden px-4 pb-8 pt-5 lg:block">
        <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">EstudioGenius</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tu espacio de estudio</p>
      </div>
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 lg:flex lg:h-auto lg:flex-col lg:gap-2">
        <button 
          onClick={() => onChangeView('LIST')}
          className={navItemClass(currentView === 'LIST' || currentView === 'DETAIL')}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide lg:text-sm lg:normal-case lg:tracking-normal">Inicio</span>
        </button>

        <button
          onClick={() => onChangeView('STUDY')}
          className={navItemClass(currentView === 'STUDY')}
        >
          <Target className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide lg:text-sm lg:normal-case lg:tracking-normal">Ruta</span>
        </button>
        
        <button 
          onClick={() => onChangeView('CREATE')}
          className="flex items-center justify-center -mt-8 rounded-xl text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/30 lg:mt-0 lg:h-12 lg:justify-start lg:gap-3 lg:px-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition-transform hover:bg-indigo-700 active:scale-95 lg:h-auto lg:w-auto lg:bg-transparent lg:text-indigo-600 lg:shadow-none lg:hover:bg-transparent dark:lg:text-indigo-300">
            <PlusCircle className="h-8 w-8 lg:h-6 lg:w-6" />
          </div>
          <span className="hidden text-sm font-medium lg:inline">Nuevo apunte</span>
        </button>
        
        <button 
          onClick={() => onChangeView('SETTINGS')}
          className={navItemClass(currentView === 'SETTINGS')}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide lg:text-sm lg:normal-case lg:tracking-normal">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};