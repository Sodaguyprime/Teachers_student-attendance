import React from 'react';

const StudentTable = ({ students, selectedStudent, onSelectStudent }) => {
  return (
    <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Student #</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Surname</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Time</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr
              key={index}
              onClick={() => onSelectStudent(student)}
              className={`cursor-pointer hover:bg-blue-50 transition ${
                selectedStudent?.studentNumber === student.studentNumber ? 'bg-blue-100' : ''
              }`}
            >
              <td className="px-4 py-2 text-sm border-t">{student.studentNumber}</td>
              <td className="px-4 py-2 text-sm border-t">{student.name}</td>
              <td className="px-4 py-2 text-sm border-t">{student.surname}</td>
              <td className="px-4 py-2 text-sm border-t">{student.timestamp || 'Manually Added'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {students.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No students registered yet
        </div>
      )}
    </div>
  );
};

export default StudentTable;
