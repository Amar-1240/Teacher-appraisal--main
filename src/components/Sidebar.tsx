import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BookOpen, Clock, FileText, Users, LogOut, Briefcase, UserCheck, UserPlus, UserX } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false); // State to toggle sidebar

  const teacherLinks = [
    { to: '/dashboard', icon: BookOpen, text: 'Dashboard' },
    { to: '/Teachingandlearning', icon: Briefcase, text: 'Teaching&learning' },
    { to: '/ResearchAndConsultancy', icon: Clock, text: 'Research&Consultancy' },
    { to: '/ProfessionalDevelopment', icon: UserCheck, text: 'ProfessionalDevelopment' },
    { to: '/StudentDevelopment', icon: UserPlus, text: 'StudentDevelopment' },
    { to: '/InstitutionalDevelopment', icon: UserX, text: 'InstitutionalDevelopment' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: BookOpen, text: 'Dashboard' },
    { to: '/teachers', icon: Users, text: 'Manage Teachers' },
    { to: '/TeachingLearning', icon: Briefcase, text: 'Teaching&learning' },
    { to: '/ResearchConsultancy', icon: Clock, text: 'Research&Consultancy' },
    { to: '/AdminProfessionalDevelopment', icon: UserCheck, text: 'ProfessionalDevelopment' },
    { to: '/AdminStudentDevelopment', icon: UserPlus, text: 'StudentDevelopment' },
    { to: '/AdminInstitutionalDevelopment', icon: UserX, text: 'InstitutionalDevelopment' }
  ];

  const links = user?.role === 'admin' ? adminLinks : teacherLinks;

  return (
    <div>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-50 p-3 bg-transparent rounded-full shadow-lg transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-64' : 'translate-x-4'
        }`}
        aria-label="Toggle Sidebar"
      >
        <div
          className={`w-6 h-1 rounded-full transform transition-all duration-300 ${
            isOpen ? 'bg-white translate-y-2 rotate-45' : 'bg-black'
          }`}
        />
        <div
          className={`w-6 h-1 rounded-full mt-1 transform transition-all duration-300 ${
            isOpen ? 'opacity-0' : 'bg-black'
          }`}
        />
        <div
          className={`w-6 h-1 rounded-full mt-1 transform transition-all duration-300 ${
            isOpen ? 'bg-white -translate-y-2 -rotate-45' : 'bg-black'
          }`}
        />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-gray-800 to-gray-700 text-white shadow-lg z-40 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:z-auto`}
      >
        {/* Header Section */}
        <div className="p-6 border-b border-gray-600">
          <h2 className="text-2xl font-bold text-white">Appraisal portal</h2>
          <p className="text-sm text-gray-300 mt-1">{user?.name}</p>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                }`
              }
              onClick={() => setIsOpen(false)} // Close sidebar on link click for mobile
            >
              <link.icon className="w-5 h-5 mr-3" />
              {link.text}
            </NavLink>
          ))}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center px-6 py-3 mt-4 text-gray-300 hover:bg-white-500 hover:text-white rounded-lg transition-all duration-300"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </nav>
      </div>

      {/* Overlay (for closing the sidebar on mobile) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
        ></div>
      )}
    </div>
  );
}
