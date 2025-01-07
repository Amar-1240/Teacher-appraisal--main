import React, { useState, useEffect } from "react";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { useAuthStore } from "../../store/authStore";
import { Entry } from "../../types";
import { useLocation } from "react-router-dom";

const TeachingAndLearning: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const { teacherId: paramTeacherId } = location.state || {};
  const [entries, setEntries] = useState<Record<string, Entry[]>>({
    "Course Design": [],
    "Pedagogical Innovations": [],
    "Student Feedback": [],
    "Academic Results": [],
  });
  const [teacherId, setTeacherId] = useState<string | null>(paramTeacherId || null);

  useEffect(() => {
    if (user?.id && !paramTeacherId) fetchTeacherId();
  }, [user?.id, paramTeacherId]);

  const fetchTeacherId = async () => {
    try {
      if (!user?.id) {
        console.error("User ID is not available");
        return;
      }

      const teacherRef = doc(db, "teachers", user.id);
      const teacherDoc = await getDoc(teacherRef);

      if (teacherDoc.exists()) {
        setTeacherId(teacherDoc.id);
      } else {
        console.error("Teacher document does not exist.");
      }
    } catch (error) {
      console.error("Error fetching teacher ID:", error);
    }
  };

  const fetchEntries = async () => {
    try {
      const q = teacherId
        ? query(collection(db, "TeachingLearning"), where("teacherId", "==", teacherId))
        : collection(db, "TeachingLearning");

      const querySnapshot = await getDocs(q);

      const updatedEntries: Record<string, Entry[]> = {
        "Course Design": [],
        "Pedagogical Innovations": [],
        "Student Feedback": [],
        "Academic Results": [],
      };

      for (const document of querySnapshot.docs) {
        const data = document.data();
        if (updatedEntries[data.category]) {
          const entry: Entry = {
            id: document.id,
            title: data.title,
            className: data.className,
            description: data.description,
            url: data.url,
            teacherId: data.teacherId,
            category: data.category,
          };

          if (!teacherId) {
            const teacherRef = doc(db, "teachers", data.teacherId);
            const teacherDoc = await getDoc(teacherRef);
            if (teacherDoc.exists()) {
              entry.teacherName = teacherDoc.data().name;
              entry.teacherDepartment = teacherDoc.data().department;
            }
          }

          updatedEntries[data.category].push(entry);
        }
      }

      setEntries(updatedEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [teacherId]);

  const cardColors = ["#e7f3ff", "#e3fcef", "#f9f0ff", "#fff7e6"];
  const cardHoverColors = ["#cce7ff", "#c3f3e0", "#e0cfff", "#ffe6cc"];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <b><h1 style={{fontSize: "38px",marginBottom: "20px"}}>📚 Teaching and Learning</h1></b>
      <div style={{ display: "grid", gap: "20px" ,fontSize: "16px"}}>
        {["Course Design", "Pedagogical Innovations", "Student Feedback", "Academic Results"].map(
          (category, index) => (
            <Card
              key={category}
              title={category}
              entries={entries[category]}
              color={cardColors[index]}
              hoverColor={cardHoverColors[index]}
              showTeacherInfo={!teacherId}
            />
          )
        )}
      </div>
    </div>
  );
};

const Card: React.FC<{
  title: string;
  entries: Entry[];
  color: string;
  hoverColor: string;
  showTeacherInfo: boolean;
}> = ({ title, entries, color, hoverColor, showTeacherInfo }) => {
  const [viewMore, setViewMore] = useState(false);

  return (
    <div
      style={{
        borderRadius: "10px",
        padding: "15px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        backgroundColor: color,
        transition: "transform 0.2s ease, background-color 0.2s ease",
        width: "100%",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.backgroundColor = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.backgroundColor = color;
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>{title}</h2>
      </div>

      <div>
        <span>{entries.length} Entries</span>
        {entries.length > 0 && (
          <button
            onClick={() => setViewMore(!viewMore)}
            style={{
              marginLeft: "10px",
              padding: "5px 10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              backgroundColor: "#007bff",
              color: "white",
            }}
          >
            View More
          </button>
        )}
      </div>

      {viewMore && (
        <div>
          <div
            style={{
              marginTop: "10px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "10px",
              width: "100%",
              backgroundColor: "#f8f9fa",
              padding: "10px",
              borderRadius: "8px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "10px",
                  borderRadius: "5px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                <p><strong>Title:</strong> {entry.title}</p>
                <p><strong>Class:</strong> {entry.className}</p>
                <p><strong>Description:</strong> {entry.description}</p>
                <p><strong>URL:</strong> <a href={entry.url} target="_blank" rel="noopener noreferrer">View Resource</a></p>
                {showTeacherInfo && (
                  <>
                    <p><strong>Teacher Name:</strong> {entry.teacherName}</p>
                    <p><strong>Department:</strong> {entry.teacherDepartment}</p>
                  </>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setViewMore(false)}
            style={{
              padding: "5px 10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              backgroundColor: "grey",
              color: "white",
              marginTop: "10px",
              marginLeft: "800px",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default TeachingAndLearning;
