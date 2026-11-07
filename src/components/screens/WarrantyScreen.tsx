import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { WarrantyTerm } from '../../lib/types';
import { ShieldCheck, Plus, Edit3, Trash2, X, Save, Clock, FileText } from 'lucide-react';

export const WarrantyScreen: React.FC = () => {
  const { warrantyTerms, addWarrantyTerm, updateWarrantyTerm } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<WarrantyTerm | null>(null);

  const [title, setTitle] = useState('');
  const [daysDuration, setDaysDuration] = useState<number>(90);
  const [content, setContent] = useState('');

  const handleOpenNew = () => {
    setEditingTerm(null);
    setTitle('');
    setDaysDuration(90);
    setContent(
      'A garantia cobre exclusivamente os componentes substituídos e os serviços executados pela nossa assistência técnica, pelo prazo de 90 dias a contar da data de entrega do equipamento. A garantia não cobre danos causados por quedas, umidade, descargas elétricas ou violação dos lacres internos.'
    );
    setIsModalOpen(true);
  };

  const handleOpenEdit = (term: WarrantyTerm) => {
    setEditingTerm(term);
    setTitle(term.title);
    setDaysDuration(term.days_duration);
    setContent(term.content);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }

    if (editingTerm) {
      updateWarrantyTerm(editingTerm.id, {
        title,
        days_duration: Number(daysDuration) || 90,
        content
      });
    } else {
      addWarrantyTerm({
        title,
        days_duration: Number(daysDuration) || 90,
        content
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Termos e Políticas de Garantia
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure as cláusulas contratuais de garantia jurídica impressas no rodapé das Ordens de Serviço.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Termo de Garantia
        </button>
      </div>

      {/* Grid de Termos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warrantyTerms.map(term => (
          <div
            key={term.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{term.title}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Prazo Legal: <strong className="text-blue-600 dark:text-blue-400 font-mono">{term.days_duration} dias</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(term)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Editar Termo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-h-40 overflow-y-auto whitespace-pre-wrap">
                {term.content}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Vinculável em qualquer OS</span>
              <span className="font-mono text-[10px] text-slate-500">ID: {term.id.slice(0, 8)}...</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar / Editar Termo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                {editingTerm ? 'Editar Termo de Garantia' : 'Cadastrar Novo Termo'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Título do Termo *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Garantia Padrão (90 Dias), Garantia Placa-Mãe (180 Dias)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Duração da Garantia (em dias) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={daysDuration}
                  onChange={e => setDaysDuration(parseInt(e.target.value) || 90)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Texto Completo das Cláusulas (Impresso na OS) *
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escreva as condições, coberturas, restrições e regras para acionamento..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar Termo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
