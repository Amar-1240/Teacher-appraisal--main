import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, BookOpen, ClipboardList, Briefcase, Users, GraduationCap, User, X } from 'lucide-react';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Activity, Teacher, StatCardProps } from '../../types';


const TeacherDashboard = () => {
  const { user } = useAuthStore();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [completionStatuses, setCompletionStatuses] = useState<number>(0);
  const [classesCount, setClassesCount] = useState<number>(0);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [institutionalDocumentsCount, setInstitutionalDocumentsCount] = useState<number>(0);
  const [studentDocumentsCount, setStudentDocumentsCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [teacherDetails, setTeacherDetails] = useState<Teacher | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedProfileImage, setEditedProfileImage] = useState('');
  const [editedDepartment, setEditedDepartment] = useState('');
  const [editedJoinDate, setEditedJoinDate] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const fetchTeacherId = async () => {
    try {
      if (!user?.id) {
        console.error('User ID is not available');
        return;
      }

      const teacherRef = doc(db, 'teachers', user.id);
      const teacherDoc = await getDoc(teacherRef);

      if (teacherDoc.exists()) {
        setTeacherId(teacherDoc.id);
      } else {
        console.error('Teacher document does not exist.');
      }
    } catch (error) {
      console.error('Error fetching teacher ID:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTeacherId();
    }
  }, [user?.id]);

  useEffect(() => {
    if (teacherId) {
      fetchSyllabusProgress();
      fetchClassesCount();
      fetchDocumentsCount();
      fetchInstitutionalDocumentsCount();
      fetchStudentDocumentsCount();
      fetchRecentActivities();
      fetchTeacherDetails();
    }
  }, [teacherId]);

  const fetchSyllabusProgress = async () => {
    try {
      const syllabusRef = collection(db, 'TeachingLearning');
      const q = query(syllabusRef, where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      setCompletionStatuses(snapshot.size);
    } catch (err) {
      console.error('Error fetching syllabus progress:', err);
    }
  };

  const fetchClassesCount = async () => {
    try {
      const classesRef = collection(db, 'ResearchConsultancy');
      const q = query(classesRef, where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      setClassesCount(snapshot.size);
    } catch (err) {
      console.error('Error fetching classes count:', err);
    }
  };

  const fetchDocumentsCount = async () => {
    try {
      const documentsRef = collection(db, 'ProfessionalDevelopment');
      const q = query(documentsRef, where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      setDocumentsCount(snapshot.size);
    } catch (err) {
      console.error('Error fetching documents count:', err);
    }
  };

  const fetchInstitutionalDocumentsCount = async () => {
    try {
      const documentsRef = collection(db, 'InstitutionalDevelopment');
      const q = query(documentsRef, where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      setInstitutionalDocumentsCount(snapshot.size);
    } catch (err) {
      console.error('Error fetching institutional documents count:', err);
    }
  };

  const fetchStudentDocumentsCount = async () => {
    try {
      const documentsRef = collection(db, 'StudentDevelopment');
      const q = query(documentsRef, where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      setStudentDocumentsCount(snapshot.size);
    } catch (err) {
      console.error('Error fetching student documents count:', err);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activitiesRef = collection(db, 'activityLogs');
      const q = query(activitiesRef, where('userId', '==', teacherId));
      const snapshot = await getDocs(q);
      const activities: Activity[] = [];

      const now = new Date();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const activityDate = new Date(data.timestamp.seconds * 1000);
        const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

        if (diffInSeconds >= 86400) {
          // Delete activity if it's older than 1 day
          await deleteDoc(doc.ref);
        } else {
          let timeAgo = '';
          if (diffInSeconds < 60) {
            timeAgo = `${diffInSeconds} seconds ago`;
          } else if (diffInSeconds < 3600) {
            timeAgo = `${Math.floor(diffInSeconds / 60)} minutes ago`;
          } else if (diffInSeconds < 86400) {
            timeAgo = `${Math.floor(diffInSeconds / 3600)} hours ago`;
          }

          activities.push({
            id: doc.id,
            entity: data.entity,
            description: `${data.description}`,
            timestamp: timeAgo,
            diffInSeconds,
          });
        }
      }

      // Sort activities by increasing time difference
      activities.sort((a, b) => a.diffInSeconds - b.diffInSeconds);

      setRecentActivities(activities);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
    }
  };

  const fetchTeacherDetails = async () => {
    try {
      const teacherRef = doc(db, 'teachers', teacherId || '');
      const teacherDoc = await getDoc(teacherRef);
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        setTeacherDetails({
          name: teacherData.name,
          email: teacherData.email,
          profileImage: teacherData.profileImage || '',
        });
        setEditedName(teacherData.name);
        setEditedEmail(teacherData.email);
        setEditedProfileImage(teacherData.profileImage || '');
        setEditedDepartment(teacherData.department || '');
        setEditedJoinDate(teacherData.joinDate || '');
      }
    } catch (error) {
      console.error('Error fetching teacher details:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (!teacherId) return;

    const teacherRef = doc(db, 'teachers', teacherId);
    try {
      // Only update the password if it's been modified
      const updatedData: any = {
        name: editedName,
        email: editedEmail,
        profileImage: editedProfileImage,
        department: editedDepartment,
        joinDate: editedJoinDate,
      };

      if (editedPassword) {
        updatedData.password = editedPassword; // Update password if provided
      }

      await updateDoc(teacherRef, updatedData);

      // If password was changed, show an alert
      if (editedPassword) {
        alert('Password changed successfully');
        setEditedPassword(''); // Clear the password field after update
      }

      // Update teacher details in the state after saving
      setTeacherDetails({
        name: editedName,
        email: editedEmail,
        profileImage: editedProfileImage,
      });

      setIsEditMode(false); // Close edit mode
    } catch (error) {
      console.error('Error updating teacher details:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword); // Toggle password visibility
  };

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  const handleStatCardClick = (path: string) => {
    navigate(path);
  };

  const handleRemoveActivity = (id: string) => {
    setRecentActivities((prevActivities) => prevActivities.filter((activity) => activity.id !== id));
  };

  if (user?.role === 'admin') {
    return null;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        {/* Welcome Message */}
        <h1 className="text-4xl font-extrabold text-gray-900">
          👋 Welcome, <span className="text-blue-500">{user?.name}</span>
        </h1>

        {/* Profile Image */}
        <div className="relative">
          {teacherDetails?.profileImage ? (
            <div
              className="cursor-pointer"
              onClick={toggleEditMode}
            >
              <img
                src={teacherDetails.profileImage}
                alt="Profile"
                className="w-16 h-16 rounded-full border-4 border-blue-500 shadow-lg transition-transform transform hover:scale-105"
              />
            </div>
          ) : (
            <div
              className="cursor-pointer bg-blue-100 p-1 rounded-full border-4 border-blue-500 shadow-lg"
              onClick={toggleEditMode}
            >
              <User className="w-14 h-14 text-blue-500 transition-transform transform hover:scale-105" />
            </div>
          )}
        </div>
      </div>

      {/* Editable Modal */}
      {isEditMode && teacherDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-96 md:w-1/3">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

            {/* Editable Fields */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={editedName}
                readOnly
                onChange={(e) => setEditedName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={editedEmail}
                readOnly
                onChange={(e) => setEditedEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={editedDepartment}
                readOnly
                onChange={(e) => setEditedDepartment(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Join Date</label>
              <input
                type="text"
                value={editedJoinDate}
                readOnly
                onChange={(e) => setEditedJoinDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} // Toggle password visibility
                  value={editedPassword}
                  onChange={(e) => setEditedPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {/* Eye toggle */}
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                onClick={handleSaveChanges}
              >
                Save
              </button>
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                onClick={toggleEditMode}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="TeachingAndLearning"
          value={completionStatuses}
          icon={<BookOpen className="w-10 h-10 text-white" />}
          bgFrom="from-blue-500"
          bgTo="to-red-200"
          onClick={() => handleStatCardClick('/Teachingandlearning')}
        />
        <StatCard
          title="ResearchAndDevelopment"
          value={classesCount}
          icon={<ClipboardList className="w-10 h-10 text-white" />}
          bgFrom="from-green-500"
          bgTo="to-white-400"
          onClick={() => handleStatCardClick('/ResearchAndConsultancy')}
        />
        <StatCard
          title="ProfessionalDevelopment"
          value={documentsCount}
          icon={<Briefcase className="w-10 h-10 text-white" />}
          bgFrom="from-pink-500"
          bgTo="to-blue-400"
          onClick={() => handleStatCardClick('/ProfessionalDevelopment')}
        />
        <StatCard
          title="InstitutionalDevelopment"
          value={institutionalDocumentsCount}
          icon={<Users className="w-10 h-10 text-white" />}
          bgFrom="from-red-500"
          bgTo="to-yellow-400"
          onClick={() => handleStatCardClick('/InstitutionalDevelopment')}
        />
        <StatCard
          title="StudentDevelopment"
          value={studentDocumentsCount}
          icon={<GraduationCap className="w-10 h-10 text-white" />}
          bgFrom="from-purple-500"
          bgTo="to-white-100"
          onClick={() => handleStatCardClick('/StudentDevelopment')}
        />
      </div>

      {/* Recent Activities Section */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-lg shadow-lg transform hover:shadow-xl transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Recent Activities</h2>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500">No recent activities</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center bg-white p-4 rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                {activity.entity === 'TeachingLearning' && <BookOpen className="w-6 h-6 text-blue-500 mr-4" />}
                {activity.entity === 'ResearchConsultancy' && <ClipboardList className="w-6 h-6 text-green-500 mr-4" />}
                {activity.entity === 'ProfessionalDevelopment' && <Briefcase className="w-6 h-6 text-purple-500 mr-4" />}
                {activity.entity === 'InstitutionalDevelopment' && <Users className="w-6 h-6 text-red-500 mr-4" />}
                {activity.entity === 'StudentDevelopment' && <GraduationCap className="w-6 h-6 text-yellow-500 mr-4" />}
                <span className="text-gray-800"><b>{activity.entity}</b>: {activity.description}</span>
                <span className="ml-auto text-sm text-gray-500">{activity.timestamp}</span>
                <X className="w-5 h-5 text-gray-500 ml-4 cursor-pointer" onClick={() => handleRemoveActivity(activity.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgFrom, bgTo, onClick }) => {
  return (
    <div
      className={`bg-gradient-to-br ${bgFrom} ${bgTo} p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center">
        {icon}
        <h2 className="ml-3 text-xl font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-4 text-5xl font-bold text-white">{value}</p>
      <p className="text-gray-200">{title === 'Syllabus Progress' ? 'Overall completion' : title === 'Classes' ? 'Classes this month' : 'Uploaded this month'}</p>
    </div>
  );
};

export default TeacherDashboard;
