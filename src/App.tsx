import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentDevelopment from './pages/teacher/StudentDevelopment';
import ClassTracker from './pages/teacher/TeachingAndLearning';
import DocumentManager from './pages/teacher/ResearchAndConsultancy';
import PublicationManager from './pages/teacher/ProfessionalDevelopment';
import AdminDashboard from './pages/admin/Dashboard';
import TeacherManager from './pages/admin/TeacherManager';
import Timetable from './pages/teacher/InstitutionalDevelopment';
import AdminTeachingAndLearning from './pages/admin/TeachingandLearning';
import AdminResearchAndConsultancy from './pages/admin/ResearchandConsultancy';
import AdminProfessionalDevelopment from './pages/admin/ProfessionalDevelopment';
import AdminStudentDevelopment from './pages/admin/StudentDevelopment';
import AdminInstitutionalDevelopment from './pages/admin/InstitutionalDevelopment';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'teacher' | 'admin' }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Shared Dashboard Route */}
          <Route
            path="dashboard"
            element={
              user?.role === 'admin' ? (
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              ) : (
                <ProtectedRoute allowedRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              )
            }
          />

          {/* Teacher Routes */}
          <Route
            path="StudentDevelopment"
            element={
              <ProtectedRoute allowedRole="teacher">
                <StudentDevelopment />
              </ProtectedRoute>
            }
          />
          <Route
            path="Teachingandlearning"
            element={
              <ProtectedRoute allowedRole="teacher">
                <ClassTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="ResearchAndConsultancy"
            element={
              <ProtectedRoute allowedRole="teacher">
                <DocumentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="ProfessionalDevelopment"
            element={
              <ProtectedRoute allowedRole="teacher">
                <PublicationManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="InstitutionalDevelopment"
            element={
              <ProtectedRoute allowedRole="teacher">
                <Timetable />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="teachers"
            element={
              <ProtectedRoute allowedRole="admin">
                <TeacherManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="TeachingLearning"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminTeachingAndLearning />
              </ProtectedRoute>
            }
          />
          <Route
            path="ResearchConsultancy"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminResearchAndConsultancy />
              </ProtectedRoute>
            }
          />
          <Route
            path="AdminProfessionalDevelopment"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminProfessionalDevelopment />
              </ProtectedRoute>
            }
          />
           <Route
            path="AdminStudentDevelopment"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminStudentDevelopment />
              </ProtectedRoute>
            }
          />
           <Route
            path="AdminInstitutionalDevelopment"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminInstitutionalDevelopment />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
