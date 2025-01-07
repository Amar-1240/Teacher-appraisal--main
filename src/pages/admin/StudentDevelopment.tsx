import React, { useState, useEffect } from "react";
import { db } from "../../config/firebaseConfig";
import { doc, collection, getDocs, query, where, getDoc } from "firebase/firestore";
import { useAuthStore } from "../../store/authStore";
import { Entry } from "../../types";
import { useLocation } from "react-router-dom";

const StudentDevelopment: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const teacherIdFromState = location.state?.teacherId || null;
  const [entries, setEntries] = useState<Record<string, Record<string, Entry[]>>>({
    "Mentoring/Counseling Effectiveness": {
      "Correspondence with Parents (Letter/Phone): 2 points": [],
      "Frequency of Meetings with Students: 2 points": [],
      "Initiatives for Slow Learners (Identifying, Tracking, Interventions): 2 points": [],
      "Problem Solving for Students: 2 points": [],
      "Student Career Planning: 2 points": [],
    },
    "Encouraging Student Innovation/Start-ups": {
      "Student/Self-Idea: 6 points": [],
      "Student/Self-Prototype/Innovation: 8 points": [],
      "Student/Self-Business Model/Start-up: 12 points": [],
      "Hackathon/Workshop Handholding: 6 points": [],
    },
    "Focused Career Guidance": {
      "Placement Training: 6 points": [],
      "GATE Training: 6 points": [],
    },
    "Guidance for National Level Participation": {
      "International/National Level Fests/Competitions (Design/Development): 4 points": [],
      "Facilitating Industrial Tours/Field Visits: 2 points": [],
    },
    "Organizing Hackathons/Competitions": {
      "Hackathons/Design/Development Competitions: 3 points per event": [],
    },
    "Student Publications/Patents": {
      "Indexed Publications/Patents (Student + Faculty)": [],
    },
  });
  const [teacherId, setTeacherId] = useState<string | null>(teacherIdFromState);
  const [teacherInfo, setTeacherInfo] = useState<{ id: string; name: string; department: string }[]>([]);

  useEffect(() => {
    if (user?.id && !teacherIdFromState) fetchTeacherId();
  }, [user?.id]);

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
        ? query(collection(db, "StudentDevelopment"), where("teacherId", "==", teacherId))
        : collection(db, "StudentDevelopment");
      const querySnapshot = await getDocs(q);

      const updatedEntries: Record<string, Record<string, Entry[]>> = {
        "Mentoring/Counseling Effectiveness": {
          "Correspondence with Parents (Letter/Phone): 2 points": [],
          "Frequency of Meetings with Students: 2 points": [],
          "Initiatives for Slow Learners (Identifying, Tracking, Interventions): 2 points": [],
          "Problem Solving for Students: 2 points": [],
          "Student Career Planning: 2 points": [],
        },
        "Encouraging Student Innovation/Start-ups": {
          "Student/Self-Idea: 6 points": [],
          "Student/Self-Prototype/Innovation: 8 points": [],
          "Student/Self-Business Model/Start-up: 12 points": [],
          "Hackathon/Workshop Handholding: 6 points": [],
        },
        "Focused Career Guidance": {
          "Placement Training: 6 points": [],
          "GATE Training: 6 points": [],
        },
        "Guidance for National Level Participation": {
          "International/National Level Fests/Competitions (Design/Development): 4 points": [],
          "Facilitating Industrial Tours/Field Visits: 2 points": [],
        },
        "Organizing Hackathons/Competitions": {
          "Hackathons/Design/Development Competitions: 3 points per event": [],
        },
        "Student Publications/Patents": {
          "Indexed Publications/Patents (Student + Faculty)": [],
        },
      };

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (updatedEntries[data.category] && updatedEntries[data.category][data.className]) {
          const entry: Entry = {
            id: doc.id,
            className: data.className,
            title: data.title,
            description: data.description,
            url: data.url,
            teacherId: data.teacherId,
            category: data.category,
          };

          updatedEntries[data.category][data.className].push(entry);
        }
      }

      setEntries(updatedEntries);

      if (!teacherId) {
        const teacherIds = Array.from(new Set(querySnapshot.docs.map(doc => doc.data().teacherId)));
        const teacherInfoPromises = teacherIds.map(async id => {
          const teacherDoc = await getDoc(doc(db, "teachers", id));
          if (teacherDoc.exists()) {
            const { name, department } = teacherDoc.data();
            return { id, name, department };
          }
          return null;
        });
        const teacherInfos = await Promise.all(teacherInfoPromises);
        setTeacherInfo(teacherInfos.filter(info => info !== null) as any);
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [teacherId]);

  const cardColors = ["#e7f3ff", "#e3fcef", "#f9f0ff", "#fff7e6", "#f0f7ff", "#fce4ec", "#e8f5e9", "#fff3e0", "#ede7f6"];
  const cardHoverColors = ["#cce7ff", "#c3f3e0", "#e0cfff", "#ffe6cc", "#d0e7ff", "#f8bbd0", "#c8e6c9", "#ffe0b2", "#d1c4e9"];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <b><h1 style={{fontSize: "38px",marginBottom: "20px"}}>👨‍🎓 Student Development</h1></b>
      <div style={{ display: "grid", gap: "20px" ,fontSize: "16px"}}>
        {Object.keys(entries).map(
          (category, index) => (
            <Card
              key={category}
              title={category}
              subcategories={entries[category]}
              color={cardColors[index]}
              hoverColor={cardHoverColors[index]}
              teacherInfo={teacherInfo.length > 0 ? teacherInfo : null}
              teacherId={teacherId}
            />
          )
        )}
      </div>
    </div>
  );
};

const Card: React.FC<{
  title: string;
  subcategories: Record<string, Entry[]>;
  color: string;
  hoverColor: string;
  teacherInfo: { id: string; name: string; department: string }[] | null;
  teacherId: string | null;
}> = ({ title, subcategories, color, hoverColor, teacherInfo, teacherId }) => {
  const [viewMore, setViewMore] = useState(false);

  const subtitleColors = ["#ff6347", "#4682b4", "#32cd32", "#ff69b4", "#ffa500"];

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
        <span>{Object.values(subcategories).flat().length} Entries</span>
        {Object.values(subcategories).flat().length > 0 && (
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
              gridTemplateColumns: "1fr", // This makes it row-wise
              gap: "10px",
              width: "100%", // Adjust width based on requirement
              backgroundColor: "#f8f9fa",
              padding: "10px",
              borderRadius: "8px",
              maxHeight: "400px", // Limit the height of the view area
              overflowY: "auto", // Scrollbar will appear if items exceed the height
            }}
          >
            {Object.keys(subcategories).map((subcat, index) => (
              <div key={subcat}>
                <h3 style={{ color: subtitleColors[index % subtitleColors.length] }}><b>{subcat}</b></h3>
                {subcategories[subcat].map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "10px",
                      borderRadius: "5px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      width: "auto", // Set width to auto to fit content
                      maxWidth: "100%", // Ensure it doesn't exceed the container
                    }}
                  >
                    <p><strong>Title:</strong> {entry.title}</p>
                    <p><strong>Description:</strong> {entry.description}</p>
                    <p><strong>URL:</strong> <a href={entry.url} target="_blank" rel="noopener noreferrer">View Resource</a></p>
                    {!teacherId && teacherInfo && (
                      <>
                        <p><strong>Teacher Name:</strong> {teacherInfo.find(info => info.id === entry.teacherId)?.name}</p>
                        <p><strong>Department:</strong> {teacherInfo.find(info => info.id === entry.teacherId)?.department}</p>
                      </>
                    )}
                  </div>
                ))}
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
              backgroundColor: "grey", // Red for Close
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

export default StudentDevelopment;
