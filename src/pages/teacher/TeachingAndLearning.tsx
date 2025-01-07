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
      entity,     // "TeachingLearning"
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

const TeachingAndLearning: React.FC = () => {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<Record<string, Entry[]>>({
    "Course Design": [],
    "Pedagogical Innovations": [],
    "Student Feedback": [],
    "Academic Results": [],
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
        collection(db, "TeachingLearning"),
        where("teacherId", "==", teacherId)
      );
      const querySnapshot = await getDocs(q);

      const updatedEntries: Record<string, Entry[]> = {
        "Course Design": [],
        "Pedagogical Innovations": [],
        "Student Feedback": [],
        "Academic Results": [],
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (updatedEntries[data.category]) {
          updatedEntries[data.category].push({
            id: doc.id,
            title: data.title,
            className: data.className,
            section: data.section, // Add section field
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

  const validateForm = (formData: { title: string; className: string; section: string; description: string; url: string }): boolean => {
    return formData.title !== "" && formData.className !== "" && formData.section !== "" && formData.description !== "" && formData.url !== "";
  };

  const addOrUpdateEntry = async (
    category: string,
    title: string,
    className: string,
    section: string,
    description: string,
    url: string,
    entryId?: string
  ) => {
    if (!teacherId) return;

    const newEntry = {
      category,
      title,
      className,
      section, // Add section field
      description,
      url,
      teacherId,
    };

    try {
      if (entryId) {
        // Update existing entry
        const entryRef = doc(db, "TeachingLearning", entryId);
        await updateDoc(entryRef, newEntry);
        await logActivity(
          "Edit",
          "TeachingLearning",
          `Edited an entry titled "${title}" in the "${category}" category`,
          user?.id ?? null
        );
      } else {
        // Add new entry
        await addDoc(collection(db, "TeachingLearning"), newEntry);
        await logActivity(
          "Add",
          "TeachingLearning",
          `Added a new entry titled "${title}" in the "${category}" category`,
          user?.id ?? null
        );
      }
      fetchEntries();
    } catch (error) {
      console.error(entryId ? "Error updating entry:" : "Error adding entry:", error);
    }
  };

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
              onAddOrUpdate={(title, className, section, description, url, entryId) =>
                addOrUpdateEntry(category, title, className, section, description, url, entryId)
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
  entries: Entry[];
  onAddOrUpdate: (
    title: string,
    className: string,
    section: string,
    description: string,
    url: string,
    entryId?: string
  ) => void;
  color: string;
  hoverColor: string;
  fetchEntries: () => void; // Accept fetchEntries as a prop
}> = ({ title, entries, onAddOrUpdate, color, hoverColor, fetchEntries }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    className: "",
    section: "",
    description: "",
    url: "",
  });
  const [viewMore, setViewMore] = useState(false);
  const { user } = useAuthStore();
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddOrUpdate = () => {
    onAddOrUpdate(formData.title, formData.className, formData.section, formData.description, formData.url, formData.id || undefined);
    setFormData({ id: "", title: "", className: "", section: "", description: "", url: "" });
    setShowForm(false);
  };
  const handleEdit = (entry: Entry) => {
    setFormData({ ...entry, section: entry.section || "" });
    setShowForm(true);
  };

  const handleDelete = async (entryId: string, title: string, category: string) => {
    try {
      await deleteDoc(doc(db, "TeachingLearning", entryId));
      await logActivity(
        "Delete",
        "TeachingLearning",
        `Deleted an entry titled "${title}" in the "${category}" category`,
        user?.id ?? null
      );
      // Deleting the entry from Firestore
      fetchEntries(); // Refresh the entries after deletion
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

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
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // This makes it column-wise
              gap: "10px",
              width: "100%", // Adjust width based on requirement
              backgroundColor: "#f8f9fa",
              padding: "10px",
              borderRadius: "8px",
              maxHeight: "400px", // Limit the height of the view area
              overflowY: "auto", // Scrollbar will appear if items exceed the height
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
                <p><strong>Class:</strong> {entry.className}-{entry.section}</p> {/* Display class and section */}
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
          <input
            type="text"
            name="title"
            placeholder="Subject"
            value={formData.title}
            onChange={handleInputChange}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
          />
          <select
            name="className"
            value={formData.className}
            onChange={handleInputChange}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
          >
            <option value="" disabled>
              Select Class
            </option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
          <select
            name="section"
            value={formData.section}
            onChange={handleInputChange}
            style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
          >
            <option value="" disabled>
              Select Section
            </option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
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

export default TeachingAndLearning;