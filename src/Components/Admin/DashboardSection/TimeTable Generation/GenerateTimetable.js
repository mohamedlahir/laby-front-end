import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { API_BASE } from "../../../../config/api";
import { clearAuthStorage, isTokenExpired } from "../../../../utils/auth";
import "./Timetable.css";

const SAMPLE_TIMETABLE_FILE_URL = "/samples/Laby-Time-Table-with-grade-and-section-sample.xlsx";

const CONFLICT_REASON_LABELS = {
  TUTOR_PERIOD_COLLISION: "Tutor period collision",
  DUPLICATE_CLASS_SLOT: "Duplicate class slot",
};

const GenerateTimetable = ({ mode = "both" }) => {
  const [schoolId, setSchoolId] = useState(localStorage.getItem("schoolId") || 1);
  const [academicYearStart, setAcademicYearStart] = useState("");
  const [academicYearEnd, setAcademicYearEnd] = useState("");
  const [importAcademicYearStart, setImportAcademicYearStart] = useState("");
  const [importAcademicYearEnd, setImportAcademicYearEnd] = useState("");
  const [message, setMessage] = useState("");

  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const sortedRowErrors = useMemo(() => {
    if (!importResult?.errors || typeof importResult.errors !== "object") return [];

    return Object.entries(importResult.errors)
      .map(([rowKey, errorMessage]) => ({ rowKey, errorMessage }))
      .sort((a, b) => {
        const aNum = Number((a.rowKey || "").replace(/\D+/g, ""));
        const bNum = Number((b.rowKey || "").replace(/\D+/g, ""));

        if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
          return a.rowKey.localeCompare(b.rowKey);
        }

        return aNum - bNum;
      });
  }, [importResult]);

  const getValidTokenOrRedirect = () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      clearAuthStorage();
      window.location.replace("/");
      return null;
    }
    return token;
  };

  useEffect(() => {
    const hydrateAcademicYear = async () => {
      const token = getValidTokenOrRedirect();
      if (!token) return;

      try {
        const res = await axios.get(`${API_BASE}/scheduler/api/admin/timetable/years`, {
          params: { schoolId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!Array.isArray(res.data) || res.data.length === 0) return;

        const sorted = [...res.data].sort(
          (a, b) => new Date(b.academicYearStart).getTime() - new Date(a.academicYearStart).getTime()
        );
        const selected = sorted[0];
        setAcademicYearStart(selected.academicYearStart || "");
        setAcademicYearEnd(selected.academicYearEnd || "");
        setImportAcademicYearStart(selected.academicYearStart || "");
        setImportAcademicYearEnd(selected.academicYearEnd || "");
      } catch (err) {
        // keep date pickers empty so user can still choose dates manually
      }
    };

    hydrateAcademicYear();
  }, [schoolId]);

  const generateTimetable = async () => {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    if (!academicYearStart || !academicYearEnd) {
      setMessage("Provide both academic year start and end dates.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/scheduler/admin/timetable/generate`, null, {
        params: { schoolId, academicYearStart, academicYearEnd },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const count = Array.isArray(res.data) ? res.data.length : 0;
      setMessage(`Timetable generated successfully. Assignments created: ${count}`);
    } catch (err) {
      setMessage("Failed to generate timetable");
    }
  };

  const importTimetable = async () => {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    setImportResult(null);
    setImportError("");

    if (!importAcademicYearStart || !importAcademicYearEnd) {
      setImportError("Provide both academic year start and end dates.");
      return;
    }

    if (!importFile) {
      setImportError("Please select an Excel file before upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      setIsImporting(true);

      const res = await axios.post(`${API_BASE}/scheduler/annual-timetable/import`, formData, {
        params: { academicYearStart: importAcademicYearStart, academicYearEnd: importAcademicYearEnd },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setImportResult(res.data);
      setImportError("");
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data?.error || "Failed to import timetable file.";
      setImportError(serverMessage);
      setImportResult(null);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="timetable-card timetable-card--accent">
      <div className="timetable-card__header">
        <div>
          <p className="timetable-eyebrow">Annual Scheduler</p>
          <h2>{mode === "import" ? "Import Timetable" : "Generate Timetable"}</h2>
          <p className="timetable-subtitle">
            {mode === "import"
              ? "Upload a filled annual timetable file for the selected academic year."
              : "Create a fresh academic-year timetable for the selected school."}
          </p>
        </div>
      </div>

      {(mode === "both" || mode === "generation") && (
        <>
          <div className="timetable-form-grid">
            <div className="timetable-field">
              <label>School ID</label>
              <input type="number" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
            </div>

            <div className="timetable-field">
              <label>Academic Year Start</label>
              <input type="date" value={academicYearStart} onChange={(e) => setAcademicYearStart(e.target.value)} />
            </div>

            <div className="timetable-field">
              <label>Academic Year End</label>
              <input type="date" value={academicYearEnd} onChange={(e) => setAcademicYearEnd(e.target.value)} />
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
        </>
      )}

      {(mode === "both" || mode === "import") && (
        <div className="timetable-import-block">
        <div className="timetable-import-block__head">
          <h3>Import Annual Timetable (Excel)</h3>
          <a className="timetable-sample-link" href={SAMPLE_TIMETABLE_FILE_URL} download>
            Download Sample File
          </a>
        </div>

        <p className="timetable-subtitle timetable-import-subtitle">
          Upload the filled Excel template. We will import valid rows and show row-level mismatch errors and slot conflicts.
        </p>

        <div className="timetable-form-grid timetable-form-grid--import">
          <div className="timetable-field timetable-field--import-date">
            <label>Import Academic Year Start</label>
            <input
              type="date"
              value={importAcademicYearStart}
              onChange={(e) => setImportAcademicYearStart(e.target.value)}
            />
          </div>

          <div className="timetable-field timetable-field--import-date">
            <label>Import Academic Year End</label>
            <input
              type="date"
              value={importAcademicYearEnd}
              onChange={(e) => setImportAcademicYearEnd(e.target.value)}
            />
          </div>

          <div className="timetable-field timetable-field--file">
            <label>Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="timetable-action">
            <button
              className="timetable-button timetable-button--primary"
              onClick={importTimetable}
              disabled={isImporting}
            >
              {isImporting ? "Uploading..." : "Upload & Import"}
            </button>
          </div>
        </div>

        {importError ? <p className="timetable-feedback is-error">{importError}</p> : null}
        </div>
      )}

      {(mode === "both" || mode === "import") && importResult ? (
        <div className="timetable-shell timetable-import-result">
          <h3>Import Summary</h3>
          <div className="timetable-shell__meta timetable-shell__meta--import">
            <div>
              <span className="meta-label">School ID</span>
              <strong>{importResult.schoolId ?? "-"}</strong>
            </div>
            <div>
              <span className="meta-label">Academic Year</span>
              <strong>
                {importResult.academicYearStart} to {importResult.academicYearEnd}
              </strong>
            </div>
            <div>
              <span className="meta-label">Rows Read</span>
              <strong>{importResult.rowsRead ?? 0}</strong>
            </div>
            <div>
              <span className="meta-label">Slots Inserted</span>
              <strong>{importResult.slotsInserted ?? 0}</strong>
            </div>
            <div>
              <span className="meta-label">Conflicts</span>
              <strong>{importResult.conflicts ?? 0}</strong>
            </div>
            <div>
              <span className="meta-label">Data Errors</span>
              <strong>{sortedRowErrors.length}</strong>
            </div>
          </div>

          {sortedRowErrors.length > 0 ? (
            <div className="timetable-import-table-block">
              <h4>Data Mismatch Errors</h4>
              <div className="timetable-table-wrap">
                <table className="timetable timetable--simple">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRowErrors.map(({ rowKey, errorMessage }) => (
                      <tr key={`${rowKey}-${errorMessage}`}>
                        <td>{rowKey}</td>
                        <td>{errorMessage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {Array.isArray(importResult.conflictEntries) && importResult.conflictEntries.length > 0 ? (
            <div className="timetable-import-table-block">
              <h4>Slot Conflicts</h4>
              <div className="timetable-table-wrap">
                <table className="timetable timetable--simple timetable--conflicts">
                  <thead>
                    <tr>
                      <th>Class Room ID</th>
                      <th>Day</th>
                      <th>Period</th>
                      <th>Subject</th>
                      <th>Tutor</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.conflictEntries.map((item, index) => (
                      <tr key={`${item.classRoomId}-${item.dayOfWeek}-${item.periodNumber}-${item.tutorId}-${index}`}>
                        <td>{item.classRoomId ?? "-"}</td>
                        <td>{item.dayOfWeek ?? "-"}</td>
                        <td>{item.periodNumber ?? "-"}</td>
                        <td>{item.subjectName || item.subjectId || "-"}</td>
                        <td>{item.tutorId ?? "-"}</td>
                        <td>{CONFLICT_REASON_LABELS[item.reason] || item.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

GenerateTimetable.propTypes = {
  mode: PropTypes.oneOf(["both", "generation", "import"]),
};

export default GenerateTimetable;
