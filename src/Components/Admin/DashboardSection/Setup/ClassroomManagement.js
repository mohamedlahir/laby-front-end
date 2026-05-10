import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../../../../config/api";
import { clearAuthStorage, isTokenExpired } from "../../../../utils/auth";
import "../TimeTable Generation/Timetable.css";

const CLASSROOM_SAMPLE_FILE_URL = "/samples/Laby-Classrooms-sample.xlsx";

const ClassroomManagement = () => {
  const [classRoomsFile, setClassRoomsFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const getValidTokenOrRedirect = () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      clearAuthStorage();
      window.location.replace("/");
      return null;
    }
    return token;
  };

  const uploadClassrooms = async () => {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    setMessage("");
    setError("");

    if (!classRoomsFile) {
      setError("Please select an Excel file before upload.");
      return;
    }

    const formData = new FormData();
    formData.append("classRoomsFile", classRoomsFile);

    try {
      setIsUploading(true);

      const res = await axios.post(`${API_BASE}/scheduler/internal/setup/upload/classrooms`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const responseBody = res?.data;
      const successMessage =
        (typeof responseBody === "string" && responseBody) ||
        responseBody?.message ||
        responseBody?.data ||
        "Classrooms imported successfully.";

      setMessage(successMessage);
      setError("");
    } catch (uploadError) {
      const responseBody = uploadError?.response?.data;
      const serverMessage =
        (typeof responseBody === "string" && responseBody) ||
        responseBody?.message ||
        responseBody?.error ||
        "Failed to upload classrooms file.";

      setError(serverMessage);
      setMessage("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="timetable-card timetable-card--accent">
      <div className="timetable-card__header">
        <div>
          <p className="timetable-eyebrow">Setup Workspace</p>
          <h2 className="timetable-card__title-sm">Classroom Management</h2>
          <p className="timetable-subtitle">
            Upload classroom setup in bulk using the Excel template.
          </p>
        </div>
      </div>

      <div className="timetable-import-block">
        <div className="timetable-import-block__head">
          <h3>Import Classrooms (Excel)</h3>
          <a className="timetable-sample-link" href={CLASSROOM_SAMPLE_FILE_URL} download>
            Download Sample File
          </a>
        </div>

        <p className="timetable-subtitle timetable-import-subtitle">
          Choose the completed classroom file and upload it to create classrooms in bulk.
        </p>

        <div className="timetable-form-grid timetable-form-grid--classrooms">
          <div className="timetable-field timetable-field--file">
            <label>Classrooms Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setClassRoomsFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="timetable-action">
            <button
              className="timetable-button timetable-button--primary"
              onClick={uploadClassrooms}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Classrooms"}
            </button>
          </div>
        </div>

        {message ? <p className="timetable-feedback is-success">{message}</p> : null}
        {error ? <p className="timetable-feedback is-error">{error}</p> : null}
      </div>
    </section>
  );
};

export default ClassroomManagement;
