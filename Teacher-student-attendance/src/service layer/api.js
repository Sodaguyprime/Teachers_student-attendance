export const api = {
  getServerInfo: () => fetch('/get-ip').then(res => res.json()),
  
  getStudents: () => fetch('/students').then(res => res.json()),
  
  setToken: (token) => fetch('/set-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  }),
  
  addStudent: (student) => fetch('/add-student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  }).then(res => res.json()),
  
  removeStudent: (studentNumber) => fetch('/remove-student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentNumber })
  }).then(res => res.json()),
  
  resetRegistrations: () => fetch('/reset-registrations').then(res => res.json())
};
