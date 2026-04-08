import { useMemo, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../../config/api";
import "./TimeTable Generation/Timetable.css";

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const periods = [1, 2, 3, 4, 5, 6, 7, 8];

const formatDay = (day) => day.charAt(0) + day.slice(1).toLowerCase();

const TutorTimetable = () => {
  const [tutorId, setTutorId] = useState("");
  // accept academic year range instead of weeklyTimetableId
  const [academicYearStart, setAcademicYearStart] = useState("2026-06-01");
  const [academicYearEnd, setAcademicYearEnd] = useState("2027-03-31");
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const fetchTimetable = async () => {
    if (!tutorId || !academicYearStart || !academicYearEnd) {
      setError("Tutor ID and academic year start/end are required.");
      return;
    }

    try {
      setError("");
      setHasFetched(true);
      const res = await axios.get(`${API_BASE}/scheduler/tutor/timetable`, {
        params: { tutorId, academicYearStart, academicYearEnd },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setData(res.data || []);
    } catch (fetchError) {
      setData([]);
      setError(fetchError?.response?.data?.message || "Unable to load tutor timetable.");
    }
  };

  const getCell = (day, period) =>
    data.find((entry) => entry.dayOfWeek === day && entry.periodNumber === period);

  const stats = useMemo(() => {
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();
    const scheduledDays = days.filter((day) =>
      data.some((entry) => entry.dayOfWeek === day)
    ).length;
    const assignedPeriods = data.filter((entry) => entry.status === "ASSIGNED").length;
    const freePeriods = days.length * periods.length - data.length;
    const todayAssignedPeriods = data.filter(
      (entry) => entry.dayOfWeek === today && entry.status === "ASSIGNED"
    ).length;

    return {
      scheduledDays,
      assignedPeriods,
      freePeriods,
      todayAssignedPeriods,
      today,
    };
  }, [data]);

  return (
    <section className="timetable-card timetable-card--wide">
      <div className="timetable-card__header">
        <div>
          <p className="timetable-eyebrow">Teaching View</p>
          <h2>Tutor Timetable</h2>
          <p className="timetable-subtitle">
            Review a tutor&apos;s day-by-day teaching allocation with subject delivery,
            class coverage, and period-by-period visibility.
          </p>
        </div>
      </div>

      <div className="timetable-form-grid timetable-form-grid--compact">
        <div className="timetable-field">
          <label htmlFor="tutor-id">Tutor ID</label>
          <input
            id="tutor-id"
            type="text"
            placeholder="Tutor ID"
            value={tutorId}
            onChange={(e) => setTutorId(e.target.value)}
          />
        </div>

        <div className="timetable-field">
          <label htmlFor="academic-year-start">Academic Year Start</label>
          <input
            id="academic-year-start"
            type="date"
            value={academicYearStart}
            onChange={(e) => setAcademicYearStart(e.target.value)}
          />
        </div>

        <div className="timetable-field">
          <label htmlFor="academic-year-end">Academic Year End</label>
          <input
            id="academic-year-end"
            type="date"
            value={academicYearEnd}
            onChange={(e) => setAcademicYearEnd(e.target.value)}
          />
        </div>

        <div className="timetable-field">
          <label>Tutor Scope</label>
          <input
            type="text"
            value={tutorId ? `Tutor ${tutorId}` : "Not selected"}
            readOnly
          />
        </div>

        <div className="timetable-action">
          <button
            type="button"
            className="timetable-button timetable-button--primary"
            onClick={fetchTimetable}
          >
            Fetch Timetable
          </button>
        </div>
      </div>

      {error && <div className="timetable-feedback is-error">{error}</div>}

      <div className="timetable-shell">
        <div className="timetable-shell__meta">
          <div>
            <span className="meta-label">Displayed Days</span>
            <strong>{stats.scheduledDays}</strong>
          </div>
          <div>
            <span className="meta-label">Assigned Periods</span>
            <strong>{stats.assignedPeriods}</strong>
          </div>
          <div>
            <span className="meta-label">Free Periods</span>
            <strong>{stats.freePeriods}</strong>
          </div>
          <div>
            <span className="meta-label">{formatDay(stats.today)} Assigned</span>
            <strong>{stats.todayAssignedPeriods}</strong>
          </div>
        </div>

        {!hasFetched ? (
          <div className="timetable-empty-state">
              <p className="timetable-empty-state__title">No tutor timetable loaded yet</p>
              <p className="timetable-empty-state__copy">
                Enter a tutor ID and an academic year start/end above, then fetch the
                schedule to populate the period grid.
              </p>
            </div>
        ) : (
          <div className="timetable-table-wrap">
            <table className="timetable">
              <thead>
                <tr>
                  <th>Day / Period</th>
                  {periods.map((period) => (
                    <th key={period}>P{period}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td className="timetable-day">{formatDay(day)}</td>
                    {periods.map((period) => {
                      const cell = getCell(day, period);
                      const isConflict = cell?.status === "CONFLICT";
                      const cellClassName = cell
                        ? `timetable-cell ${isConflict ? "is-inactive" : "is-filled"}`
                        : "timetable-cell is-empty";

                      return (
                        <td key={`${day}-${period}`} className={cellClassName}>
                          {cell ? (
                            <div className="timetable-entry">
                              <span className="entry-subject">{cell.subjectName}</span>
                              <span className="entry-tutor">Class {cell.classRoomId}</span>
                            </div>
                          ) : (
                            <span className="entry-empty">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default TutorTimetable;
