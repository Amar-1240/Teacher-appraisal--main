import React, { useState, useEffect } from 'react';
import { User, Mail, Plus, Edit2, Trash, Eye, UserPlus } from 'lucide-react';
import { db } from "../../config/firebaseConfig"; // Ensure Firebase is configured
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { TeacherDetails } from "../../types";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from "../../store/authStore"; // Import useAuthStore

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  joinDate: string;
}

const logActivity = async (
actionType: string, entity: string, description: string, p0: string) => {
  try {
    const logEntry = {
      actionType, // "Add", "Edit", "Delete"
      entity,     // "Teacher"
      description,
      timestamp: new Date(),
      userId: 'admin', // Use 'admin' instead of userId
    };

    await addDoc(collection(db, "activityLogs"), logEntry);
    console.log("Activity logged successfully!");
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

export default function TeacherManager() {
  const { user } = useAuthStore(); // Get the user from the auth store
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', department: '' });
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [viewMoreId, setViewMoreId] = useState<string | null>(null);
  const [teacherDetails, setTeacherDetails] = useState<TeacherDetails | null>(null);
  const [searchName, setSearchName] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const navigate = useNavigate();

  const departments = ['CSE', 'IT', 'MECH', 'AIML', 'CSBS', 'AIDS', 'CIVIL', 'EEE', 'ECE'];

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async (name = '', department = '') => {
    try {
      const q = query(
        collection(db, 'teachers'),
        ...(name ? [where('name', '==', name)] : []),
        ...(department ? [where('department', '==', department)] : [])
      );
      const querySnapshot = await getDocs(q);
      const teachersList: Teacher[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Teacher));
      setTeachers(teachersList);
    } catch (err) {
      console.error("Error fetching teachers: ", err);
      setError('Error fetching teacher data.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTeacher({ ...newTeacher, [name]: value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewTeacher({ ...newTeacher, department: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchName(query);
    fetchTeachers(query, selectedDepartment);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const department = e.target.value;
    setSelectedDepartment(department);
    fetchTeachers(searchName, department);
  };

  const handleAddTeacher = async () => {
    const { name, email, department } = newTeacher;
    if (!name || !email || !department) {
      setError('Please fill in all fields');
      return;
    }
    const joinDate = new Date().toLocaleDateString();
    const initialPassword = 'webcap';

    try {
      if (editTeacherId) {
        await updateDoc(doc(db, 'teachers', editTeacherId), { name, email, department });

        setTeachers((prevTeachers) =>
          prevTeachers.map((teacher) =>
            teacher.id === editTeacherId ? { ...teacher, name, email, department } : teacher
          )
        );
        await logActivity(
          "Edit",
          "Teacher",
          `Edited teacher "${name}" of department "${department}`,
          'admin' // Fourth argument added
        );
        setEditTeacherId(null);
      } else {
        const docRef = await addDoc(collection(db, 'teachers'), { name, email, department, joinDate, password: initialPassword });
        setTeachers((prevTeachers) => [...prevTeachers, { id: docRef.id, name, email, department, joinDate }]);
        await logActivity(
          "Add",
          "Teacher",
          `Added new teacher "${name}" of department "${department}`,
          'admin' // Fourth argument added
        );
        
        
        
      }

      setNewTeacher({ name: '', email: '', department: '' });
      setShowForm(false);
    } catch (err) {
      setError('Error saving teacher. Please try again.');
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setNewTeacher({
      name: teacher.name,
      email: teacher.email,
      department: teacher.department,
    });
    setEditTeacherId(teacher.id);
    setShowForm(true);
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const teacherToDelete = teachers.find((teacher) => teacher.id === id);
      await deleteDoc(doc(db, 'teachers', id));
      setTeachers((prevTeachers) => prevTeachers.filter((teacher) => teacher.id !== id));
      await logActivity(
        "Delete",
        "Teacher",
        `Deleted teacher "${teacherToDelete?.name}" of department "${teacherToDelete?.department}"`,
        'admin' // Fourth argument added
      );
      
      
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Error deleting teacher. Please try again.');
    }
  };

  const handleViewMore = async (email: string) => {
    try {
      console.log('Fetching teacher details for email:', email);

      const teacherQuery = query(collection(db, 'teachers'), where('email', '==', email));
      const querySnapshot = await getDocs(teacherQuery);

      if (!querySnapshot.empty) {
        const teacherDoc = querySnapshot.docs[0];
        const teacherId = teacherDoc.id;

        // Fetch counts
        const TeachingAndLearningSnapshot = await getDocs(query(collection(db, 'TeachingLearning'), where('teacherId', '==', teacherId)));
        const ResearchConsultancySnapshot = await getDocs(query(collection(db, 'ResearchConsultancy'), where('teacherId', '==', teacherId)));
        const ProfessionalDevelopmentSnapshot = await getDocs(query(collection(db, 'ProfessionalDevelopment'), where('teacherId', '==', teacherId)));
        const StudentDevelopmentSnapshot = await getDocs(query(collection(db, 'StudentDevelopment'), where('teacherId', '==', teacherId)));
        const InstitutionalDevelopmentSnapshot = await getDocs(query(collection(db, 'InstitutionalDevelopment'), where('teacherId', '==', teacherId)));
        // Set state with counts
        setTeacherDetails({
          TeachingLearningcount: TeachingAndLearningSnapshot.size,
          Researconsultancycount: ResearchConsultancySnapshot.size,
          ProfessionalDevelopmentcount: ProfessionalDevelopmentSnapshot.size,
          StudentDevelopmentcount: StudentDevelopmentSnapshot.size,
          institutionalDevelopmentCount: InstitutionalDevelopmentSnapshot.size,
        });
        setViewMoreId(teacherId);
      } else {
        setError('Teacher not found.');
      }
    } catch (err) {
      console.error('Error fetching teacher details:', err);
      setError('Error fetching teacher details. Please try again.');
    }
  };

  const handleCardClick = (path: string, teacherId: string) => {
    navigate(path, { state: { teacherId } });
  };

  return (
    <div className="space-y-6 overflow-hidden">
      <style>{`
      @media (max-width: 768px) {
        .space-y-6 {
        padding: 1rem;
        }
        .flex.justify-between {
        flex-wrap: wrap;
        gap: 1rem;
        }
        .grid.gap-6 {
        grid-template-columns: 1fr;
        }
        .flex-wrap.gap-4 {
        flex-direction: column;
        }
        .overflow-hidden {
        overflow-x: auto;
        }
        .mobile-flex {
        flex-direction: column;
        align-items: flex-start;
        }
        .mobile-flex button {
        margin-top: 1rem;
        }
        .mobile-search-filter {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        }
        .mobile-search-filter input,
        .mobile-search-filter select {
        width: 100%;
        height: 100%;
        }
      }
      .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      `}</style>
      <div className="flex justify-between items-center mobile-flex">
        <div className="flex items-center space-x-1">
        <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">👩‍🏫 Manage Teachers</h1>
            <button
              className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 md:rounded-md md:w-auto md:h-auto md:px-4 md:py-2"
              onClick={() => {
              setShowForm(true);
              setEditTeacherId(null);
              }}
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden md:inline-block ml-2">Add Teacher</span>
            </button>
        </div>
      </div>
      
      <div className="flex space-x-4 items-center mobile-search-filter">
        <div>
          <input
            type="text"
            placeholder="Search by name"
            value={searchName}
            onChange={handleSearchChange}
            className="px-2 py-1 border rounded-md focus:ring focus:ring-blue-300"
          />
        </div>
        <div>
          <select
            value={selectedDepartment}
            onChange={handleFilterChange}
            className="px-2 py-1 border rounded-md focus:ring focus:ring-blue-300"
          >
            <option value="">Filter by Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            {editTeacherId ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={newTeacher.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={newTeacher.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department"
                value={newTeacher.department}
                onChange={handleSelectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              onClick={handleAddTeacher}
            >
              {editTeacherId ? 'Update Teacher' : 'Add Teacher'}
            </button>
            <button
              className="mt-2 w-full text-gray-600 py-2 rounded-md hover:bg-gray-100"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-6">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="bg-white p-6 rounded-lg shadow card">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <User className="w-12 h-12 text-gray-400 bg-gray-100 rounded-full p-2" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{teacher.name}</h3>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{teacher.email}</span>
                    </div>
                    <p className="text-gray-600">Department: {teacher.department}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  Joined: {new Date(teacher.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                onClick={() => handleEditTeacher(teacher)}
              >
                <Edit2 className="w-4 h-4 mr-2 inline-block" />
                Edit
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={() => handleDeleteTeacher(teacher.id)}
              >
                <Trash className="w-4 h-4 mr-2 inline-block" />
                Delete
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => handleViewMore(teacher.email)}
              >
                <Eye className="w-4 h-4 mr-2 inline-block" />
                View More
              </button>
            </div>
            {viewMoreId === teacher.id && teacherDetails && (
              <div className="space-y-8 mt-6">
                <h2 className="text-2xl font-semibold">📋 Teacher Details</h2>
                <div className="flex flex-wrap gap-4">
                  {/* Classes Card */}
                  <div
                    className="flex-1 max-w-[300px] bg-blue-100 p-4 rounded-md shadow card cursor-pointer"
                    onClick={() => handleCardClick('/TeachingLearning', teacher.id)}
                  >
                    <h3 className="text-xl font-semibold text-blue-700">TeachingLearning</h3>
                    <p className="mt-2 text-sm">Number of entries: {teacherDetails.TeachingLearningcount}</p>
                  </div>
                  {/* Documents Card */}
                  <div
                    className="flex-1 max-w-[300px] bg-green-100 p-4 rounded-md shadow card cursor-pointer"
                    onClick={() => handleCardClick('/ResearchConsultancy', teacher.id)}
                  >
                    <h3 className="text-xl font-semibold text-green-700">ResearchConsultancy</h3>
                    <p className="mt-2 text-sm">Number of entries: {teacherDetails.Researconsultancycount}</p>
                  </div>
                  {/* Syllabus Card */}
                  <div
                    className="flex-1 max-w-[300px] bg-purple-100 p-4 rounded-md shadow card cursor-pointer"
                    onClick={() => handleCardClick('/AdminProfessionalDevelopment', teacher.id)}
                  >
                    <h3 className="text-xl font-semibold text-purple-700">ProfessionalDevelopment</h3>
                    <p className="mt-2 text-sm">Number of entries: {teacherDetails.ProfessionalDevelopmentcount}</p>
                  </div>
                  {/* Publications Card */}
                  <div
                    className="flex-1 max-w-[300px] bg-yellow-100 p-4 rounded-md shadow card cursor-pointer"
                    onClick={() => handleCardClick('/AdminStudentDevelopment', teacher.id)}
                  >
                    <h3 className="text-xl font-semibold text-yellow-700">StudentDevelopment</h3>
                    <p className="mt-2 text-sm">Number of entries: {teacherDetails.StudentDevelopmentcount}</p>
                  </div>
                  <div
                    className="flex-1 max-w-[300px] bg-yellow-100 p-4 rounded-md shadow card cursor-pointer"
                    onClick={() => handleCardClick('/AdminInstitutionalDevelopment', teacher.id)}
                  >
                    <h3 className="text-xl font-semibold text-green-700">InstitutionalDevelopment</h3>
                    <p className="mt-2 text-sm">Number of entries: {teacherDetails.institutionalDevelopmentCount}</p>
                  </div>
                </div>
                <button
                  className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setViewMoreId(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
