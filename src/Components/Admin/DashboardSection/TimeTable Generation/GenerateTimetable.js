import { useState } from "react";
import axios from "axios";
import { clearAuthStorage, isTokenExpired } from "../../../../utils/auth";
import "./Timetable.css";

const GenerateTimetable = () => {
  const [schoolId, setSchoolId] = useState(
    localStorage.getItem("schoolId") || 1
  );
  const [academicYearStart, setAcademicYearStart] = useState("2026-06-01");
  const [academicYearEnd, setAcademicYearEnd] = useState("2027-03-31");
  const [message, setMessage] = useState("");

  const generateTimetable = async () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      clearAuthStorage();
      window.location.replace("/");
      return;
    }

    if (!academicYearStart || !academicYearEnd) {
      setMessage("Provide both academic year start and end dates.");
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:8080/scheduler/api/admin/timetable/generate`,
        null,
        {
          params: { schoolId, academicYearStart, academicYearEnd },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const count = Array.isArray(res.data) ? res.data.length : 0;
      setMessage(`Timetable generated successfully. Assignments created: ${count}`);
    } catch (err) {
      setMessage("Failed to generate timetable");
    }
  };

  return (
    <section className="timetable-card timetable-card--accent">
      <div className="timetable-card__header">
        <div>
          <p className="timetable-eyebrow">Annual Scheduler</p>
          <h2>Generate Timetable</h2>
          <p className="timetable-subtitle">
            Create a fresh academic-year timetable for the selected school.
          </p>
        </div>
      </div>

      <div className="timetable-form-grid">
        <div className="timetable-field">
          <label>School ID</label>
          <input
            type="number"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
          />
        </div>

        <div className="timetable-field">
          <label>Academic Year Start</label>
          <input
            type="date"
            value={academicYearStart}
            onChange={(e) => setAcademicYearStart(e.target.value)}
          />
        </div>

        <div className="timetable-field">
          <label>Academic Year End</label>
          <input
            type="date"
            value={academicYearEnd}
            onChange={(e) => setAcademicYearEnd(e.target.value)}
          />
        </div>

        <div className="timetable-action">
          <button className="timetable-button timetable-button--primary" onClick={generateTimetable}>
            Generate
          </button>
        </div>
      </div>

      {message ? (
        <p className={`timetable-feedback ${message.toLowerCase().includes("success") ? "is-success" : "is-error"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
};

export default GenerateTimetable;
