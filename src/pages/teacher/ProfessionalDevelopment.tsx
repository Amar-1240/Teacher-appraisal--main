import React, { useState, useEffect } from "react";
import { db } from "../../config/firebaseConfig";
import { deleteDoc, updateDoc, doc, collection, getDocs, addDoc, query, where, getDoc } from "firebase/firestore";
import { useAuthStore } from "../../store/authStore";
import { Entry } from "../../types";

const logActivity = async (
  actionType: string,
  entity: string,
  description: string,
  userId: string | null
) => {
  try {
    const logEntry = {
      actionType, // "Add", "Edit", "Delete"
      entity,     // "ProfessionalDevelopment"
      description,
      timestamp: new Date(),
      userId,
    };

    await addDoc(collection(db, "activityLogs"), logEntry);
    console.log("Activity logged successfully!");
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

const ProfessionalDevelopment: React.FC = () => {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<Record<string, Record<string, Entry[]>>>({
    "Attending Development Programs": {
      "Refresher Courses": [],
      "Other Programs (≥ 5 days)": [],
    },
    "Organizing Development Programs": {
      "Refresher Courses (2–4 weeks)": [],
      "Shorter Workshops/Programs (1 week or other durations)": [],
    },
    "Certification Programs": {
      "NPTEL Certifications": [],
      "Other Certifications": [],
    },
    "Training on Scopus, Web of Science, Clarivate Analytics": {
      "Each Training/Certification Program": [],
    },
    "Membership in Professional Societies": {
      "Membership": [],
      "Activities Through Societies": [],
    },
    "Participation in Sports, Games, Cultural Activities": {
      "Participation": [],
      "Committee Member Role": [],
    },
    "Academic Outreach": {
      "Keynote Speaker, Resource Person, Guest Lecturer, Invited Talks, Committee/BOS Member": [],
    },
    "Extension Activities (Social Outreach)": {
      "Coordinator/Convener": [],
      "Committee Member": [],
    },
    "Awards, Recognitions, Fellowships": {
      "Awards/Recognitions from Central/State Agencies, Institutions, or Professional Societies": [],
    },
  });
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchTeacherId();
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
    if (!teacherId) return;

    try {
      const q = query(
        collection(db, "ProfessionalDevelopment"),
        where("teacherId", "==", teacherId)
      );
      const querySnapshot = await getDocs(q);

      const updatedEntries: Record<string, Record<string, Entry[]>> = {
        "Attending Development Programs": {
          "Refresher Courses": [],
          "Other Programs (≥ 5 days)": [],
        },
        "Organizing Development Programs": {
          "Refresher Courses (2–4 weeks)": [],
          "Shorter Workshops/Programs (1 week or other durations)": [],
        },
        "Certification Programs": {
          "NPTEL Certifications": [],
          "Other Certifications": [],
        },
        "Training on Scopus, Web of Science, Clarivate Analytics": {
          "Each Training/Certification Program": [],
        },
        "Membership in Professional Societies": {
          "Membership": [],
          "Activities Through Societies": [],
        },
        "Participation in Sports, Games, Cultural Activities": {
          "Participation": [],
          "Committee Member Role": [],
        },
        "Academic Outreach": {
          "Keynote Speaker, Resource Person, Guest Lecturer, Invited Talks, Committee/BOS Member": [],
        },
        "Extension Activities (Social Outreach)": {
          "Coordinator/Convener": [],
          "Committee Member": [],
        },
        "Awards, Recognitions, Fellowships": {
          "Awards/Recognitions from Central/State Agencies, Institutions, or Professional Societies": [],
        },
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (updatedEntries[data.category] && updatedEntries[data.category][data.className]) {
          updatedEntries[data.category][data.className].push({
            id: doc.id,
            className: data.className,
            title: data.title,
            description: data.description,
            url: data.url,
            teacherId: data.teacherId,
            category: data.category,
          });
        }
      });

      setEntries(updatedEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchEntries();
    }
  }, [teacherId]);

  const validateForm = (formData: { className: string; title: string; description: string; url: string }): boolean => {
    return formData.className !== "" && formData.title !== "" && formData.description !== "" && formData.url !== "";
  };

  const addOrUpdateEntry = async (
    category: string,
    className: string,
    title: string,
    description: string,
    url: string,
    entryId?: string
  ) => {
    if (!teacherId) return;

    if (!validateForm({ className, title, description, url })) {
      alert("Please fill all fields before submitting.");
      return;
    }

    const newEntry = {
      category,
      className,
      title,
      description,
      url,
      teacherId,
    };

    try {
      if (entryId) {
        // Update existing entry
        const entryRef = doc(db, "ProfessionalDevelopment", entryId);
        await updateDoc(entryRef, newEntry);
        await logActivity(
          "Edit",
          "ProfessionalDevelopment",
          `Edited an entry titled "${title}" in the "${category}" category`,
          user?.id ?? null
        );
      } else {
        // Add new entry
        await addDoc(collection(db, "ProfessionalDevelopment"), newEntry);
        await logActivity(
          "Add",
          "ProfessionalDevelopment",
          `Added a new entry titled "${title}" in the "${category}" category`,
          user?.id ?? null
        );
      }
      fetchEntries();
    } catch (error) {
      console.error(entryId ? "Error updating entry:" : "Error adding entry:", error);
    }
  };

  const cardColors = ["#e7f3ff", "#e3fcef", "#f9f0ff", "#fff7e6", "#f0f7ff", "#fce4ec", "#e8f5e9", "#fff3e0", "#ede7f6"];
  const cardHoverColors = ["#cce7ff", "#c3f3e0", "#e0cfff", "#ffe6cc", "#d0e7ff", "#f8bbd0", "#c8e6c9", "#ffe0b2", "#d1c4e9"];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <b><h1 style={{fontSize: "38px",marginBottom: "20px"}}>👨‍🏫 Professional Development</h1></b>
      <div style={{ display: "grid", gap: "20px" ,fontSize: "16px"}}>
        {Object.keys(entries).map(
          (category, index) => (
            <Card
              key={category}
              title={category}
              subcategories={entries[category]}
              onAddOrUpdate={(className, title, description, url, entryId) =>
                addOrUpdateEntry(category, className, title, description, url, entryId)
              }
              color={cardColors[index]}
              hoverColor={cardHoverColors[index]}
              fetchEntries={fetchEntries} // Pass fetchEntries as a prop
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
  onAddOrUpdate: (className: string, title: string, description: string, url: string, entryId?: string) => void;
  color: string;
  hoverColor: string;
  fetchEntries: () => void; // Accept fetchEntries as a prop
}> = ({ title, subcategories, onAddOrUpdate, color, hoverColor, fetchEntries }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    className: "",
    title: "",
    description: "",
    url: "",
  });
  const [viewMore, setViewMore] = useState(false);
  const { user } = useAuthStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddOrUpdate = () => {
    onAddOrUpdate(formData.className, formData.title, formData.description, formData.url, formData.id || undefined);
    setFormData({ id: "", className: "", title: "", description: "", url: "" });
    setShowForm(false);
  };

  const handleEdit = (entry: Entry) => {
    setFormData({ ...entry });
    setShowForm(true);
  };

  const handleDelete = async (entryId: string, title: string, category: string) => {
    try {
      await deleteDoc(doc(db, "ProfessionalDevelopment", entryId));
      await logActivity(
        "Delete",
        "ProfessionalDevelopment",
        `Deleted an entry titled "${title}" in the "${category}" category`,
        user?.id ?? null
      );
      fetchEntries(); // Refresh the entries after deletion
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

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
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            margin: "10px 0",
            padding: "5px 10px",
            border: "none",
            borderRadius: "15px",
            cursor: "pointer",
            backgroundColor: "#007bff",
            color: "white",
          }}
        >
          +
        </button>
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

                    {/* Edit and Delete buttons */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                      <button
                        onClick={() => handleEdit(entry)}
                        style={{
                          padding: "5px 10px",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          backgroundColor: "#28a745", // Green for Edit
                          color: "white",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id, entry.title, entry.category)}
                        style={{
                          padding: "5px 10px",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          backgroundColor: "#dc3545", // Red for Delete
                          color: "white",
                        }}
                      >
                        Delete
                      </button>
                    </div>
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

      {showForm && (
        <div style={{ margin: "10px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          <select
            name="className"
            value={formData.className}
            onChange={handleInputChange}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
          >
            <option value="" disabled>
              Select Class
            </option>
            {Object.keys(subcategories).map((subcat) => (
              <option key={subcat} value={subcat}>{subcat}</option>
            ))}
          </select>
          <input
            type="text"
            name="title"
            placeholder="Topic"
            value={formData.title}
            onChange={handleInputChange}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
          />
          <input
            type="url"
            name="url"
            placeholder="Enter Google Drive URL"
            value={formData.url}
            onChange={handleInputChange}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={handleAddOrUpdate}
              style={{
                padding: "5px 10px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                backgroundColor: "#007bff",
                color: "white",
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "5px 10px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                backgroundColor: "#6c757d",
                color: "white",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalDevelopment;
