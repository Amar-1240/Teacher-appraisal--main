import React, { useState, useEffect } from "react";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { useAuthStore } from "../../store/authStore";
import { Entry } from "../../types";
import { useLocation } from "react-router-dom";

const InstitutionalDevelopment: React.FC = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const teacherIdFromState = location.state?.teacherId || null;
    const [entries, setEntries] = useState<Record<string, Record<string, Entry[]>>>({
        "Collaborative Projects and Industry Engagement": {
            "Industry-Sponsored Labs": [],
            "Joint Programs with Industry": [],
            "Student Industry Internships": [],
            "Inviting Guest Speakers from Industry/Research Centers": [],
        },
        "MoUs and Partnerships": {
            "International/National MoUs/Partnerships": [],
            "Facilitating MoU Objectives Implementation": [],
        },
        "Establishment of Special Labs/Centers of Excellence": {
            "Coordinator": [],
            "Co-Coordinator": [],
        },
        "Development of Software/Apps/Hardware and Alumni Activities": {
            "Development of Useful Software/Apps/Hardware for the Institute": [],
            "Active Involvement in Alumni Association Activities (Organizing Meets)": [],
        },
        "Institutional/Departmental Responsibilities": {
            "Institutional Level Roles": [],
            "Departmental Level Roles": [],
        },
    });
    const [teacherId, setTeacherId] = useState<string | null>(teacherIdFromState);
    const [teacherDetails, setTeacherDetails] = useState<{ name: string; department: string } | null>(null);

    useEffect(() => {
        if (user?.id && !teacherIdFromState) fetchTeacherId();
    }, [user?.id]);

    useEffect(() => {
        if (teacherId !== null) {
            fetchEntries();
            if (!teacherIdFromState) fetchTeacherDetails();
        } else {
            fetchEntries();
        }
    }, [teacherId]);

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

    const fetchTeacherDetails = async () => {
        try {
            if (!teacherId) return;

            const teacherRef = doc(db, "teachers", teacherId);
            const teacherDoc = await getDoc(teacherRef);

            if (teacherDoc.exists()) {
                const data = teacherDoc.data();
                setTeacherDetails({ name: data.name, department: data.department });
            } else {
                console.error("Teacher document does not exist.");
            }
        } catch (error) {
            console.error("Error fetching teacher details:", error);
        }
    };

    const fetchEntries = async () => {
        try {
            const q = teacherId
                ? query(collection(db, "InstitutionalDevelopment"), where("teacherId", "==", teacherId))
                : collection(db, "InstitutionalDevelopment");
            const querySnapshot = await getDocs(q);

            const updatedEntries: Record<string, Record<string, Entry[]>> = {
                "Collaborative Projects and Industry Engagement": {
                    "Industry-Sponsored Labs": [],
                    "Joint Programs with Industry": [],
                    "Student Industry Internships": [],
                    "Inviting Guest Speakers from Industry/Research Centers": [],
                },
                "MoUs and Partnerships": {
                    "International/National MoUs/Partnerships": [],
                    "Facilitating MoU Objectives Implementation": [],
                },
                "Establishment of Special Labs/Centers of Excellence": {
                    "Coordinator": [],
                    "Co-Coordinator": [],
                },
                "Development of Software/Apps/Hardware and Alumni Activities": {
                    "Development of Useful Software/Apps/Hardware for the Institute": [],
                    "Active Involvement in Alumni Association Activities (Organizing Meets)": [],
                },
                "Institutional/Departmental Responsibilities": {
                    "Institutional Level Roles": [],
                    "Departmental Level Roles": [],
                },
            };

            for (const entryDoc of querySnapshot.docs) {
                const data = entryDoc.data();
                const entry: Entry = {
                    id: entryDoc.id,
                    className: data.className,
                    title: data.title,
                    description: data.description,
                    url: data.url,
                    teacherId: data.teacherId,
                    category: data.category,
                };

                if (!teacherId) {
                    const teacherRef = doc(db, "teachers", data.teacherId);
                    const teacherDoc = await getDoc(teacherRef);
                    if (teacherDoc.exists()) {
                        const teacherData = teacherDoc.data() as { name: string; department: string };
                        entry.teacherName = teacherData.name;
                        entry.teacherDepartment = teacherData.department;
                    }
                }

                if (updatedEntries[data.category] && updatedEntries[data.category][data.className]) {
                    updatedEntries[data.category][data.className].push(entry);
                }
            }

            setEntries(updatedEntries);
        } catch (error) {
            console.error("Error fetching entries:", error);
        }
    };

    const cardColors = ["#e7f3ff", "#e3fcef", "#f9f0ff", "#fff7e6", "#f0f7ff", "#fce4ec", "#e8f5e9", "#fff3e0", "#ede7f6"];
    const cardHoverColors = ["#cce7ff", "#c3f3e0", "#e0cfff", "#ffe6cc", "#d0e7ff", "#f8bbd0", "#c8e6c9", "#ffe0b2", "#d1c4e9"];

    return (
        <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
            <b><h1 style={{ fontSize: "38px", marginBottom: "20px" }}>🏫 Institutional Development</h1></b>
            <div style={{ display: "grid", gap: "20px", fontSize: "16px" }}>
                {Object.keys(entries).map(
                    (category, index) => (
                        <Card
                            key={category}
                            title={category}
                            subcategories={entries[category]}
                            color={cardColors[index]}
                            hoverColor={cardHoverColors[index]}
                            teacherDetails={teacherDetails}
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
    teacherDetails: { name: string; department: string } | null;
    teacherId: string | null;
}> = ({ title, subcategories, color, hoverColor, teacherDetails, teacherId }) => {
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
                                        {!teacherId && (
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

export default InstitutionalDevelopment;
