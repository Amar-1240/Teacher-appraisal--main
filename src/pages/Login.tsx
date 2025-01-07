import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { db } from "../config/firebaseConfig"; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import vishnu_logo from '../../public/vishnu_logo.png';

// Component
export default function Login() {
  const [activeTab, setActiveTab] = useState<'teacher' | 'admin'>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuthStore();

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  // Clear authentication state on page load
  useEffect(() => {
    logout();
  }, [logout]);

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (activeTab === 'admin') {
      // Admin login handling
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        try {
          await login(email, password, 'admin');
          navigate('/dashboard');
        } catch (err) {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('Invalid admin credentials');
      }
      return;
    }

    if (activeTab === 'teacher') {
      try {
        // Check if teacher exists in Firestore
        const teachersRef = collection(db, 'teachers');
        const q = query(teachersRef, where('email', '==', email), where('password', '==', password));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) { // Get document ID from Firestore

          await login(email, password, 'teacher');
          navigate('/dashboard');
        } else {
          setError('Invalid teacher credentials');
        }
      } catch (err) {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4"
    style={{
      background: 'linear-gradient(to bottom,rgb(240, 248, 247),rgb(90, 179, 221))',
    }}>
      
      {/* Login Type Selector */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => {
            setActiveTab('teacher');
            setError('');
            setEmail('');
            setPassword('');
          }}
          className={`px-6 py-2 rounded-md text-lg font-medium transition-colors ${
            activeTab === 'teacher'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Teacher Login
        </button>
        <button
          onClick={() => {
            setActiveTab('admin');
            setError('');
            setEmail('');
            setPassword('');
          }}
          className={`px-6 py-2 rounded-md text-lg font-medium transition-colors ${
            activeTab === 'admin'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Admin Login
        </button>
      </div>

      {/* Login Form */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <div className="flex justify-center mb-6">
        <img 
          src={vishnu_logo}
          alt="Login Icon" 
          className="w-20 h-20" 
        />
      </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {activeTab === 'teacher' ? 'Teacher Login' : 'Admin Login'}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Enter your credentials to access your account
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
