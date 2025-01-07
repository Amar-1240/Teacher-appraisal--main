import React, { useState, useEffect } from "react";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, query, where, getDoc, doc, doc as firestoreDoc } from "firebase/firestore";
import { useAuthStore } from "../../store/authStore";
import { Entry } from "../../types";
import { useLocation } from "react-router-dom";

const ResearchAndConsultancy: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const { teacherId: paramTeacherId } = location.state || {};
  const [entries, setEntries] = useState<Record<string, Record<string, Entry[]>>>({
    "Publications and Citations": {
      "Publications in Fundamental/Applied/Educational Research, Articles/Chapters in Books": [],
      "Citations for the publications in the period of consideration": [],
    },
    "Discovery, Innovation, and Patents": {
      "Patents and Creative Works (including copyrights and trademarks)": [],
      "Patents Published/Granted (Indian/USA patents) and Innovation Contributions": [],
    },
    "Research and Consultancy Projects": {
      "Sponsored Research Projects": [],
      "Seed Funding Applications and Grants": [],
      "Consultancy Projects and Corporate Training": [],
    },
    "PhD Supervision and Research Work": {
      "PhD/Research Work Supervision and Co-Supervision": [],
      "Registration and Progress of Ph.D. students": [],
    },
    "Research Services and Academic Contributions": {
      "Research-Related Services (Reviewing, Editorial Roles, Organizing Conferences)": [],
      "Registration in Social Research Networking Platforms (Scopus, ResearchGate, etc.)": [],
    },
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
        ? query(collection(db, "ResearchConsultancy"), where("teacherId", "==", teacherId))
        : query(collection(db, "ResearchConsultancy"));
      const querySnapshot = await getDocs(q);

      const updatedEntries: Record<string, Record<string, Entry[]>> = {
        "Publications and Citations": {
          "Publications in Fundamental/Applied/Educational Research, Articles/Chapters in Books": [],
          "Citations for the publications in the period of consideration": [],
        },
        "Discovery, Innovation, and Patents": {
          "Patents and Creative Works (including copyrights and trademarks)": [],
          "Patents Published/Granted (Indian/USA patents) and Innovation Contributions": [],
        },
        "Research and Consultancy Projects": {
          "Sponsored Research Projects": [],
          "Seed Funding Applications and Grants": [],
          "Consultancy Projects and Corporate Training": [],
        },
        "PhD Supervision and Research Work": {
          "PhD/Research Work Supervision and Co-Supervision": [],
          "Registration and Progress of Ph.D. students": [],
        },
        "Research Services and Academic Contributions": {
          "Research-Related Services (Reviewing, Editorial Roles, Organizing Conferences)": [],
          "Registration in Social Research Networking Platforms (Scopus, ResearchGate, etc.)": [],
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

          if (!teacherId) {
            const teacherRef = firestoreDoc(db, "teachers", data.teacherId);
            const teacherDoc = await getDoc(teacherRef);
            if (teacherDoc.exists()) {
              entry.teacherName = teacherDoc.data().name;
              entry.teacherDepartment = teacherDoc.data().department;
            }
          }

          updatedEntries[data.category][data.className].push(entry);
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

  const cardColors = ["#e7f3ff", "#e3fcef", "#f9f0ff", "#fff7e6", "#f0f7ff"];
  const cardHoverColors = ["#cce7ff", "#c3f3e0", "#e0cfff", "#ffe6cc", "#d0e7ff"];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <b><h1 style={{fontSize: "38px",marginBottom: "20px"}}>🔍 Research and Consultancy</h1></b>
      <div style={{ display: "grid", gap: "20px" ,fontSize: "16px"}}>
        {Object.keys(entries).map(
          (category, index) => (
            <Card
              key={category}
              title={category}
              subcategories={entries[category]}
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
  subcategories: Record<string, Entry[]>;
  color: string;
  hoverColor: string;
  showTeacherInfo: boolean;
}> = ({ title, subcategories, color, hoverColor, showTeacherInfo }) => {
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
                    }}
                  >
                    <p><strong>Title:</strong> {entry.title}</p>
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

export default ResearchAndConsultancy;
