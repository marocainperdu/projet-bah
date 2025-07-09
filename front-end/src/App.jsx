import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';

// Nouvelles pages pour le système de demandes
import DirectorDashboard from './pages/Director/Dashboard';
import DirectorDemands from './pages/Director/Demands';
import UserManagement from './pages/Director/UserManagement';
import DemandsReview from './pages/Director/DemandsReview';
import DepartmentHeadDemands from './pages/DepartmentHead/Demands';
import TeacherDemands from './pages/Teacher/Demands';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        
        {/* Routes pour le directeur */}
        <Route path="/dashboard" element={<DirectorDashboard />} />
        <Route path="/director/dashboard" element={<DirectorDashboard />} />
        <Route path="/director/demands" element={<DirectorDemands />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/demands-review/:listId" element={<DemandsReview />} />
        
        {/* Routes pour les chefs de département */}
        <Route path="/department-head/demands" element={<DepartmentHeadDemands />} />
        
        {/* Routes pour les enseignants */}
        <Route path="/teacher/demands" element={<TeacherDemands />} />
      </Routes>
    </Router>
  );
};

export default App;
