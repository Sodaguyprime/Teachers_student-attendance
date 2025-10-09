export const generateToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const exportToCSV = (students) => {
  if (students.length === 0) {
    alert('No data to export');
    return;
  }

  const data = [['Student Number', 'Name', 'Surname', 'Timestamp']];
  students.forEach(s => {
    data.push([s.studentNumber, s.name, s.surname, s.timestamp || 'Manually Added']);
  });

  let csv = '';
  data.forEach(row => {
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attendance.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};