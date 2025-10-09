import React from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

const ActionButtons = ({ onAdd, onRemove, onRefresh }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
      >
        <Plus className="w-4 h-4" />
        Add Student
      </button>
      <button
        onClick={onRemove}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
      >
        <Trash2 className="w-4 h-4" />
        Remove
      </button>
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
    </div>
  );
};

export default ActionButtons;