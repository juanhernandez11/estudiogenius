import React, { useState } from 'react';
import { Trash2, Shield, AlertTriangle, Moon, Sun, Download, Upload, X, LogOut } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Note } from '../types';

interface SettingsProps {
  onClearAll: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notes: Note[];
  onImportNotes: (notes: Note[]) => void;
  subjects: string[];
  onDeleteSubject: (subject: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClearAll, darkMode, onToggleDarkMode, notes, onImportNotes, subjects, onDeleteSubject, onLogout, onDeleteAccount }) => {
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estudiogenius-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onImportNotes(imported);
        }
      } catch (err) {
        alert('Error al importar el archivo');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <>
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        <div className="px-5 pt-8 pb-4 bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 pt-safe">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ajustes</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-32">
            
            {/* Appearance */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Apariencia</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {darkMode ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Modo Oscuro</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Reduce el brillo de la pantalla</p>
                        </div>
                    </div>
                    <button
                        onClick={onToggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            darkMode ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
            </div>

            {/* Backup */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Respaldo de Datos</h3>
                <div className="space-y-3">
                    <Button variant="secondary" className="w-full" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Notas
                    </Button>
                    <div>
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleImport} 
                            className="hidden" 
                            id="import-file"
                        />
                        <label htmlFor="import-file">
                            <Button 
                                variant="secondary" 
                                className="w-full" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('import-file')?.click();
                                }}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Importar Notas
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            {/* Subjects Management */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Materias</h3>
                <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                        <div key={subject} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                            <span>{subject}</span>
                            <button
                                onClick={() => onDeleteSubject(subject)}
                                className="ml-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Eliminar materia"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Toca la X para eliminar una materia</p>
            </div>
            
            {/* App Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">EstudioGenius</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Versión 1.0.0</p>
                    </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Esta aplicación utiliza Google Gemini API para ayudarte a estudiar. Tus notas se guardan de forma segura en tu dispositivo.
                </p>
            </div>

            {/* Account */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Cuenta</h3>
                <Button variant="secondary" className="w-full" onClick={onLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                </Button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 shadow-sm border-2 border-red-200 dark:border-red-800">
                <h3 className="text-sm font-bold text-red-900 dark:text-red-100 uppercase tracking-wide mb-4 flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Zona de Peligro
                </h3>
                
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-slate-900 dark:text-slate-100 mb-2">
                            Elimina todos tus apuntes y materias personalizadas.
                        </p>
                        <Button variant="danger" className="w-full" onClick={() => setShowClearModal(true)}>
                            Eliminar todos los datos
                        </Button>
                    </div>

                    <div className="pt-3 border-t border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-900 dark:text-red-100 mb-2 font-medium">
                            Elimina tu cuenta y todos los datos permanentemente.
                        </p>
                        <Button 
                            variant="danger" 
                            className="w-full bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900" 
                            onClick={() => setShowDeleteAccountModal(true)}
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Eliminar cuenta y datos
                        </Button>
                    </div>
                </div>
            </div>

          <div className="text-center mt-8">
            <p className="text-xs text-slate-400">Hecho con ❤️ para estudiantes</p>
            <p className="text-xs text-slate-400">© 2026 EstudioGenius. Todos los derechos reservados.</p>
            <p className="text-xs text-slate-400">Desarrollado por JuanBv.</p>
          </div>
        </div>
      </div>

      <Modal
            isOpen={showClearModal}
            onClose={() => setShowClearModal(false)}
            title="¿Eliminar todos los datos?"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setShowClearModal(false)}>Cancelar</Button>
                    <Button 
                        variant="danger" 
                        onClick={() => {
                            onClearAll();
                            setShowClearModal(false);
                        }}
                    >
                        Sí, eliminar datos
                    </Button>
                </>
            }
        >
            <div className="flex items-start space-x-3 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Se eliminarán todas tus notas y materias personalizadas. Tu cuenta se mantendrá activa.</p>
            </div>
        </Modal>

        <Modal
            isOpen={showDeleteAccountModal}
            onClose={() => setShowDeleteAccountModal(false)}
            title="⚠️ ¿Eliminar cuenta permanentemente?"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setShowDeleteAccountModal(false)}>Cancelar</Button>
                    <Button 
                        variant="danger"
                        className="bg-red-700 hover:bg-red-800"
                        onClick={() => {
                            onDeleteAccount();
                            setShowDeleteAccountModal(false);
                        }}
                    >
                        Sí, eliminar mi cuenta
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                <div className="flex items-start space-x-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-bold mb-1">Esta acción es IRREVERSIBLE</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Se eliminarán todos tus datos</li>
                            <li>Se borrará tu cuenta de EstudioGenius</li>
                            <li>No podrás recuperar tu información</li>
                            <li>Deberás crear una cuenta nueva para volver</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Modal>
    </>
  );
};