import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Users, BookOpen, ClipboardList, Briefcase, GraduationCap, X } from 'lucide-react';
import { db } from '../../config/firebaseConfig';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Activity, StatCardProps } from '../../types';
import vishnu_logo from '../../../public/vishnu_logo.png';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [teachersCount, setTeachersCount] = useState(0);
  const [completionStatuses, setCompletionStatuses] = useState<number>(0);
  const [classesCount, setClassesCount] = useState<number>(0);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [institutionalDocumentsCount, setInstitutionalDocumentsCount] = useState<number>(0);
  const [studentDocumentsCount, setStudentDocumentsCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const teachersSnapshot = await getDocs(collection(db, 'teachers'));
        setTeachersCount(teachersSnapshot.size);

        const syllabusRef = collection(db, 'TeachingLearning');
        const syllabusSnapshot = await getDocs(syllabusRef);
        setCompletionStatuses(syllabusSnapshot.size);

        const classesRef = collection(db, 'ResearchConsultancy');
        const classesSnapshot = await getDocs(classesRef);
        setClassesCount(classesSnapshot.size);

        const documentsRef = collection(db, 'ProfessionalDevelopment');
        const documentsSnapshot = await getDocs(documentsRef);
        setDocumentsCount(documentsSnapshot.size);

        const institutionalDocumentsRef = collection(db, 'InstitutionalDevelopment');
        const institutionalDocumentsSnapshot = await getDocs(institutionalDocumentsRef);
        setInstitutionalDocumentsCount(institutionalDocumentsSnapshot.size);

        const studentDocumentsRef = collection(db, 'StudentDevelopment');
        const studentDocumentsSnapshot = await getDocs(studentDocumentsRef);
        setStudentDocumentsCount(studentDocumentsSnapshot.size);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        // Query activityLogs where userId is 'admin'
        const activitiesRef = collection(db, 'activityLogs');
        const adminQuery = query(activitiesRef, where('userId', '==', 'admin')); // Add filter for userId
        const snapshot = await getDocs(adminQuery);
  
        const activities: Activity[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const now = new Date();
          const activityDate = data.timestamp.toDate(); // Convert Firestore timestamp to JS Date
          const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
  
          let timeAgo = '';
          if (diffInSeconds < 60) {
            timeAgo = `${diffInSeconds} seconds ago`;
          } else if (diffInSeconds < 3600) {
            timeAgo = `${Math.floor(diffInSeconds / 60)} minutes ago`;
          } else if (diffInSeconds < 86400) {
            timeAgo = `${Math.floor(diffInSeconds / 3600)} hours ago`;
          } else {
            timeAgo = `${Math.floor(diffInSeconds / 86400)} days ago`;
          }
  
          return {
            id: doc.id,
            entity: data.entity,
            description: data.description,
            timestamp: timeAgo,
            diffInSeconds,
          };
        });
  
        // Delete activities older than 1 day
        const oneDayInSeconds = 86400;
        for (const activity of activities) {
          if (activity.diffInSeconds > oneDayInSeconds) {
            await deleteDoc(doc(db, 'activityLogs', activity.id));
          }
        }
  
        // Filter and sort activities for display
        const recentActivities = activities.filter((activity) => activity.diffInSeconds <= oneDayInSeconds);
        recentActivities.sort((a, b) => a.diffInSeconds - b.diffInSeconds);
  
        setRecentActivities(recentActivities);
      } catch (err) {
        console.error('Error fetching recent activities:', err);
      }
    };
  
    fetchRecentActivities();
  }, []);
  
  const handleStatCardClick = (path: string) => {
    navigate(path);
  };

  const handleRemoveActivity = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'activityLogs', id));
      setRecentActivities((prevActivities) => prevActivities.filter((activity) => activity.id !== id));
    } catch (err) {
      console.error('Error removing activity:', err);
    }
  };

  if (user?.role === 'teacher') {
    return null; // Teachers will see TeacherDashboard instead
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col items-center justify-center">
        <img src={vishnu_logo} alt="Logo" className="w-16 h-16 mb-2" />
        <h1 className="text-4xl font-extrabold text-gray-900 text-center">👨‍💼 Admin Dashboard</h1>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Teachers"
          value={teachersCount}
          icon={<Users className="w-10 h-10 text-white" />}
          bgFrom="from-yellow-500"
          bgTo="to-white-200"
          onClick={() => handleStatCardClick('/teachers')}
        />
        <StatCard
          title="TeachingAndLearning"
          value={completionStatuses}
          icon={<BookOpen className="w-10 h-10 text-white" />}
          bgFrom="from-blue-500"
          bgTo="to-red-200"
          onClick={() => handleStatCardClick('/Teachinglearning')}
        />
        <StatCard
          title="ResearchAndDevelopment"
          value={classesCount}
          icon={<ClipboardList className="w-10 h-10 text-white" />}
          bgFrom="from-green-500"
          bgTo="to-white-400"
          onClick={() => handleStatCardClick('/ResearchConsultancy')}
        />
        <StatCard
          title="ProfessionalDevelopment"
          value={documentsCount}
          icon={<Briefcase className="w-10 h-10 text-white" />}
          bgFrom="from-pink-500"
          bgTo="to-blue-400"
          onClick={() => handleStatCardClick('/AdminProfessionalDevelopment')}
        />
        <StatCard
          title="InstitutionalDevelopment"
          value={institutionalDocumentsCount}
          icon={<Users className="w-10 h-10 text-white" />}
          bgFrom="from-red-500"
          bgTo="to-yellow-400"
          onClick={() => handleStatCardClick('/AdminInstitutionalDevelopment')}
        />
        <StatCard
          title="StudentDevelopment"
          value={studentDocumentsCount}
          icon={<GraduationCap className="w-10 h-10 text-white" />}
          bgFrom="from-purple-500"
          bgTo="to-white-100"
          onClick={() => handleStatCardClick('/AdminStudentDevelopment')}
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
      <p className="text-gray-200">{title === 'Teachers' ? 'Active teachers' : title === 'TeachingAndLearning' ? 'Overall completion' : 'Uploaded this month'}</p>
    </div>
  );
};

export default AdminDashboard;
