import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { exportToCSV } from '../utils/helpers';

const ExportButtons = ({ students, onReset }) => {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={() => exportToCSV(students)}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
      <button
        onClick={onReset}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
      >
        <Trash2 className="w-4 h-4" />
        Reset All
      </button>
    </div>
  );
};

export default ExportButtons;