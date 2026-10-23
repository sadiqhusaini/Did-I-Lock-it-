import React, { useState } from 'react';
import { Plus, X, ShieldAlert } from 'lucide-react';
import type { ItemCategory } from '../types.js';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, category: ItemCategory, description: string, isCritical: boolean) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('door');
  const [description, setDescription] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), category, description.trim(), isCritical);
    setTitle('');
    setDescription('');
    setIsCritical(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
            Add Safety Checklist Item
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Backyard Sliding Gate, Coffee Grinder"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100"
            >
              <option value="door">Door / Deadbolt</option>
              <option value="appliance">Appliance / Heating</option>
              <option value="security">Window / Security</option>
              <option value="pet">Pet Care / Food</option>
              <option value="general">General Departure Check</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Action Instructions / Reminder
            </label>
            <input
              type="text"
              placeholder="e.g. Ensure latch drops into receiver slot"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100"
            />
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              className="w-4 h-4 rounded text-stone-900 dark:text-stone-100 focus:ring-stone-900 dark:focus:ring-stone-100"
            />
            <span className="text-xs text-stone-700 dark:text-stone-300 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Mark as High Priority (prominent nag if left unchecked)
            </span>
          </label>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Household Checklist</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
