import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '../services/api';
import SearchBar from './SearchBar';
import ActionButtons from './ActionButtons';
import StudentTable from './StudentTable';
import ExportButtons from './ExportButtons';
import AddStudentModal from './AddStudentModal';

const AttendanceSection = ({ students, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredStudents = students.filter(student =>
    student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.surname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = (formData) => {
    api.addStudent({
      ...formData,
      timestamp: new Date().toLocaleTimeString()
    })
      .then(data => {
        if (data.success) {
          onRefresh();
          setShowAddModal(false);
        } else {
          alert(data.message || 'Error adding student');
        }
      })
      .catch(err => {
        console.error('Error adding student:', err);
        alert('Error adding student');
      });
  };

  const handleRemoveStudent = () => {
    if (!selectedStudent) {
      alert('Please select a student to remove');
      return;
    }

    api.removeStudent(selectedStudent.studentNumber)
      .then(data => {
        if (data.success) {
          onRefresh();
          setSelectedStudent(null);
        } else {
          alert(data.message || 'Error removing student');
        }
      })
      .catch(err => {
        console.error('Error removing student:', err);
        alert('Error removing student');
      });
  };

  const handleReset = () => {
    if (!confirm('Reset all registrations?')) return;

    api.resetRegistrations()
      .then(() => {
        onRefresh();
        setSelectedStudent(null);
      })
      .catch(err => console.error('Error resetting:', err));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Users className="w-6 h-6" />
        Student Attendance
      </h2>

      <p className="text-gray-600 mb-4">
        Registered Students: <span className="font-bold text-blue-600">{filteredStudents.length}</span>
      </p>

      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      
      <ActionButtons 
        onAdd={() => setShowAddModal(true)}
        onRemove={handleRemoveStudent}
        onRefresh={onRefresh}
      />

      <StudentTable 
        students={filteredStudents}
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudent}
      />

      <ExportButtons students={students} onReset={handleReset} />

      <AddStudentModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddStudent}
      />
    </div>
  );
};

export default AttendanceSection;