import { useEffect, useState } from "react";
import axios from "axios";
import "./Timetable.css";
import { API_BASE } from "../../../../config/api";

const defaultDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const defaultPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const formatAcademicYearLabel = (year, years) => {
  const today = new Date();
  const start = new Date(year.academicYearStart);
  const end = new Date(year.academicYearEnd);

  if (today >= start && today <= end) {
    return "Current Academic Year";
  }

  const hasCurrentAcademicYear = years.some((item) => {
    const itemStart = new Date(item.academicYearStart);
    const itemEnd = new Date(item.academicYearEnd);
    return today >= itemStart && today <= itemEnd;
  });

  if (!hasCurrentAcademicYear && years.length > 0) {
    const latestYear = [...years].sort((a, b) =>
      new Date(b.academicYearStart) - new Date(a.academicYearStart)
    )[0];

    if (
      latestYear.academicYearStart === year.academicYearStart &&
      latestYear.academicYearEnd === year.academicYearEnd
    ) {
      return "Current Academic Year";
    }
  }

  return `${year.academicYearStart} to ${year.academicYearEnd}`;
};

const Conflicts = ({ mode = "all" }) => {
  const [schoolId, setSchoolId] = useState(localStorage.getItem("schoolId") || 1);
  const [tutorId, setTutorId] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [conflicts, setConflicts] = useState([]);
  const [error, setError] = useState("");

  const [periodsState, setPeriodsState] = useState(defaultPeriods);
  const [daysState, setDaysState] = useState(defaultDays);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        setError("");
        const res = await axios.get(`${API_BASE}/scheduler/admin/timetable/years`, {
          params: { schoolId },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const years = Array.isArray(res.data) ? res.data : [];
        setAcademicYears(years);

        if (years.length > 0) {
          const defaultValue = `${years[0].academicYearStart}|${years[0].academicYearEnd}`;
          setSelectedAcademicYear((currentValue) => currentValue || defaultValue);
        } else {
          setSelectedAcademicYear("");
        }
      } catch (err) {
        setAcademicYears([]);
        setSelectedAcademicYear("");
        setError("Failed to load academic years");
      }
    };

    if (schoolId) fetchAcademicYears();
  }, [schoolId]);

  const deriveGrid = (rows) => {
    const rowsArr = Array.isArray(rows) ? rows : [];

    const periodNums = Array.from(
      new Set(
        rowsArr
          .map((r) => {
            const n = Number(r.periodNumber);
            return Number.isNaN(n) ? null : n;
          })
          .filter((n) => n !== null)
      )
    ).sort((a, b) => a - b);

    setPeriodsState(periodNums.length > 0 ? periodNums : defaultPeriods);

    const canonicalOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    const uniqueDays = Array.from(
      new Set(rowsArr.map((r) => (r.dayOfWeek ? String(r.dayOfWeek).toUpperCase() : r.dayOfWeek)).filter(Boolean))
    );

    if (uniqueDays.length > 0) {
      const ordered = canonicalOrder.filter((d) => uniqueDays.includes(d));
      const extras = uniqueDays.filter((d) => !canonicalOrder.includes(d));
      setDaysState([...ordered, ...extras]);
    } else {
      setDaysState(defaultDays);
    }
  };

  const fetchAllConflicts = async () => {
    if (!selectedAcademicYear) {
      setError("Select an academic year");
      return;
    }

    const [academicYearStart, academicYearEnd] = selectedAcademicYear.split("|");
    try {
      setError("");
      const res = await axios.get(`${API_BASE}/scheduler/admin/timetable/conflicts`, {
        params: { schoolId, academicYearStart, academicYearEnd },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const rows = Array.isArray(res.data) ? res.data : [];
      setConflicts(rows);
      deriveGrid(rows);
    } catch (err) {
      setError("Failed to load conflicts");
      setConflicts([]);
    }
  };

  const fetchTutorConflicts = async () => {
    if (!selectedAcademicYear) {
      setError("Select an academic year");
      return;
    }
    if (!tutorId) {
      setError("Enter a tutor ID to fetch tutor conflicts");
      return;
    }

    const [academicYearStart, academicYearEnd] = selectedAcademicYear.split("|");
    try {
      setError("");
      const res = await axios.get(`${API_BASE}/scheduler/admin/timetable/conflicts/tutor`, {
        params: { schoolId, tutorId, academicYearStart, academicYearEnd },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const rows = Array.isArray(res.data) ? res.data : [];
      setConflicts(rows);
      deriveGrid(rows);
    } catch (err) {
      setError("Failed to load tutor conflicts");
      setConflicts([]);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ day: null, period: null, items: [] });

  const getCellConflicts = (day, period) =>
    conflicts.filter((c) => {
      const dDay = c.dayOfWeek ? String(c.dayOfWeek).toUpperCase() : c.dayOfWeek;
      const pNum = c.periodNumber !== undefined ? Number(c.periodNumber) : c.periodNumber;
      return dDay === day && pNum === period;
    });

  const openCellModal = (day, period) => {
    const items = getCellConflicts(day, period);
    setModalData({ day, period, items });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData({ day: null, period: null, items: [] });
  };

  return (
    <section className="timetable-card timetable-card--wide">
      <div className="timetable-card__header">
        <div>
          <p className="timetable-eyebrow">Conflicts View</p>
          <h2>Timetable Conflicts</h2>
          <p className="timetable-subtitle">Review all scheduling conflicts by day, period, class and tutor.</p>
        </div>
      </div>

      <div className="timetable-form-grid timetable-form-grid--compact">
        <div className="timetable-field">
          <label>School ID</label>
          <input type="number" placeholder="School ID" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
        </div>
        {mode === "tutor" && (
          <div className="timetable-field">
            <label>Tutor ID</label>
            <input type="text" placeholder="Tutor ID (e.g. T003)" value={tutorId} onChange={(e) => setTutorId(e.target.value)} />
          </div>
        )}
        <div className="timetable-field">
          <label>Academic Year</label>
          <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)}>
            <option value="">Select Academic Year</option>
            {academicYears.map((year) => {
              const value = `${year.academicYearStart}|${year.academicYearEnd}`;
              return (
                <option key={value} value={value}>
                  {formatAcademicYearLabel(year, academicYears)}
                </option>
              );
            })}
          </select>
        </div>

        {mode === "all" && (
          <div className="timetable-action">
            <button className="timetable-button timetable-button--primary" onClick={fetchAllConflicts}>Fetch All Conflicts</button>
          </div>
        )}
        {mode === "tutor" && (
          <div className="timetable-action">
            <button className="timetable-button" onClick={fetchTutorConflicts}>Fetch Tutor Conflicts</button>
          </div>
        )}
      </div>

      {error ? <p className="timetable-feedback is-error">{error}</p> : null}

      <div className="timetable-shell">
        <div className="timetable-shell__meta">
          <div>
            <span className="meta-label">Total Conflicts</span>
            <strong>{conflicts.length}</strong>
          </div>
          <div>
            <span className="meta-label">Displayed Days</span>
            <strong>{daysState.length}</strong>
          </div>
          <div>
            <span className="meta-label">Periods Per Day</span>
            <strong>{periodsState.length}</strong>
          </div>
        </div>

        <div className="timetable-table-wrap">
          <table className="timetable">
            <thead>
              <tr>
                <th>Day / Period</th>
                {periodsState.map((p) => (
                  <th key={p}>P{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysState.map((day) => (
                <tr key={day}>
                  <td className="timetable-day"><b>{day}</b></td>
                  {periodsState.map((p) => {
                    const cellConflicts = getCellConflicts(day, p);
                    const count = cellConflicts.length;
                    return (
                      <td key={p} className={count ? "timetable-cell is-conflict" : "timetable-cell is-empty"}>
                        <button
                          type="button"
                          className="cell-button"
                          onClick={() => count && openCellModal(day, p)}
                          title={count ? `${count} conflicts — click for details` : "No conflicts"}
                        >
                          {count > 0 ? (
                            <>
                              <div className="cell-count-badge">{count}</div>
                              <div className="conflict-cell-list">
                                {cellConflicts.slice(0, 4).map((c) => (
                                  <div key={c.id} className="timetable-entry">
                                    <span className="entry-subject">{c.subjectName ?? "—"}</span>
                                    <div className="entry-badges">
                                      <span className="entry-class">Class: {c.classRoomId ?? "—"}</span>
                                      <span className={`entry-tutor ${c.tutorId ? 'present' : 'missing'}`}>Tutor: {c.tutorId ?? "—"}</span>
                                    </div>
                                  </div>
                                ))}
                                {count > 4 ? <div className="cell-more">+{count - 4} more</div> : null}
                              </div>
                            </>
                          ) : (
                            <span className="entry-empty">—</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend and modal */}
        <div className="timetable-legend" aria-hidden="false">
          <div className="legend-item"><span className="legend-pill present" /> Tutor assigned</div>
          <div className="legend-item"><span className="legend-pill missing" /> No tutor</div>
          <div className="legend-item"><span className="legend-pill multiple" /> Multiple conflicts</div>
        </div>

        {modalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
              <div className="modal-header">
                <h3>Conflicts — {modalData.day} P{modalData.period}</h3>
                <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
              </div>
              <div className="modal-body">
                {modalData.items.length === 0 ? (
                  <p>No conflicts.</p>
                ) : (
                  <ul className="modal-conflict-list">
                    {modalData.items.map((c) => (
                      <li key={c.id} className="modal-conflict-item">
                        <div className="modal-subject">{c.subjectName ?? '—'}</div>
                        <div className="modal-details">
                          <span>Class: {c.classRoomId ?? '—'}</span>
                          <span> Tutor: {c.tutorId ?? '—'}</span>
                          <span> Status: {c.status ?? '—'}</span>
                          <span> Reason: {c.conflictReason ?? '—'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="timetable-conflicts-list">
          <h3>All Conflicts ({conflicts.length})</h3>
          {conflicts.length === 0 ? <p>No conflicts to display.</p> : (
            <ul>
              {conflicts.map((c) => (
                <li key={c.id}>
                  <strong>{c.subjectName}</strong> — Class {c.classRoomId} — Day {c.dayOfWeek} — P{c.periodNumber} — Tutor {c.tutorId ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default Conflicts;
