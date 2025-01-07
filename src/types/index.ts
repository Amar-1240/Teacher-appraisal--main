export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
  documentId: null | string;
}
export interface TeacherDetails {
  TeachingLearningcount: number;
  Researconsultancycount: number;
  ProfessionalDevelopmentcount: number;
  StudentDevelopmentcount: number;
  institutionalDevelopmentCount: number;
}

export interface Activity {
  id: string;
  entity: string;
  description: string;
  timestamp: string;
  diffInSeconds: number;
}

export interface Entry {
  id: string;
  title: string;
  className: string;
  description: string;
  url: string;
  teacherId: string;
  category: string;
  teacherName?: string;
  teacherDepartment?: string;
  section?: string;
}

export interface Teacher {
  name: string;
  email: string;
  profileImage: string;
  department?: string;
  joinDate?: string;
  password?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgFrom: string;
  bgTo: string;
  onClick: () => void;
}

export interface ClassDesignEntry {
  id: string;
  title: string;
  class: string;
  description: string;
  documentUrl: string; // e.g., "https://drive.google.com/..."
}

export interface AdvancedLearningEntry {
  id: string;
  title: string;
  class: string;
  description: string;
  documentUrl: string; // e.g., "https://drive.google.com/..."
}

export interface StudentFeedbackEntry {
  id: string;
  title: string;
  class: string;
  description: string;
  documentUrl: string; // e.g., "https://drive.google.com/..."
}

export interface AcademicResultsEntry {
  id: string;
  title: string;
  class: string;
  description: string;
  documentUrl: string; // e.g., "https://drive.google.com/..."
}
