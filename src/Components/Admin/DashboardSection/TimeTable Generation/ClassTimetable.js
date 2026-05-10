import { useEffect, useState } from "react";
import axios from "axios";
import "./Timetable.css";
import { API_BASE } from "../../../../config/api";

const defaultDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  // "SATURDAY",
];

// sensible default: up to 9 periods (used only when API doesn't provide period numbers)
const defaultPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9,10];

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

const ClassTimetable = () => {
  const [schoolId, setSchoolId] = useState(localStorage.getItem("schoolId") || 1);
  const [classRoomId, setClassRoomId] = useState(2);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  // dynamic state derived from fetched timetable
  const [periodsState, setPeriodsState] = useState(defaultPeriods);
  const [daysState, setDaysState] = useState(defaultDays);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        setError("");
  const res = await axios.get(`${API_BASE}/scheduler/admin/timetable/years`, {
          params: { schoolId },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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

    if (schoolId) {
      fetchAcademicYears();
    }
  }, [schoolId]);

  const fetchTimetable = async () => {
    if (!selectedAcademicYear) {
      setError("Select an academic year");
      return;
    }

    const [academicYearStart, academicYearEnd] = selectedAcademicYear.split("|");
    const params = { schoolId, classRoomId, academicYearStart, academicYearEnd };
    if (targetDate) params.targetDate = targetDate;

  const res = await axios.get(`${API_BASE}/scheduler/admin/timetable/class`, {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const rows = Array.isArray(res.data) ? res.data : [];

    // Derive unique period numbers (as numbers) from returned data and sort them.
    const periodNums = Array.from(
      new Set(
        rows
          .map((r) => {
            // Normalize periodNumber to number when possible
            const n = Number(r.periodNumber);
            return Number.isNaN(n) ? null : n;
          })
          .filter((n) => n !== null)
      )
    ).sort((a, b) => a - b);

    if (periodNums.length > 0) {
      setPeriodsState(periodNums);
    } else {
      // fallback to sensible default
      setPeriodsState(defaultPeriods);
    }

    // Derive unique days from returned data and order them by a canonical weekday order
    const canonicalOrder = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    const uniqueDays = Array.from(
      new Set(rows.map((r) => (r.dayOfWeek ? String(r.dayOfWeek).toUpperCase() : r.dayOfWeek)))
    ).filter(Boolean);

    if (uniqueDays.length > 0) {
      // keep canonical ordering where possible
      const ordered = canonicalOrder.filter((d) => uniqueDays.includes(d));
      // if API returned days that are outside canonical list, append them in their returned order
      const extras = uniqueDays.filter((d) => !canonicalOrder.includes(d));
      setDaysState([...ordered, ...extras]);
    } else {
      setDaysState(defaultDays);
    }

    setData(rows);
    setError("");
  };

  const getCell = (day, period) =>
    data.find((d) => {
      const dDay = d.dayOfWeek ? String(d.dayOfWeek).toUpperCase() : d.dayOfWeek;
      const pNum = d.periodNumber !== undefined ? Number(d.periodNumber) : d.periodNumber;
      return dDay === day && pNum === period;
    });

  return (
    <section className="timetable-card timetable-card--wide">
      <div className="timetable-card__header">
        <div>
          <p className="timetable-eyebrow">Operational View</p>
          <h2>Class Timetable</h2>
          <p className="timetable-subtitle">
            Review the full weekly schedule by class, subject, and assigned tutor.
          </p>
        </div>
      </div>

      <div className="timetable-form-grid timetable-form-grid--compact">
        <div className="timetable-field">
          <label>School ID</label>
          <input
            type="number"
            placeholder="School ID"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
          />
        </div>
        <div className="timetable-field">
          <label>Class ID</label>
          <input
            type="number"
            placeholder="Class ID"
            value={classRoomId}
            onChange={(e) => setClassRoomId(e.target.value)}
          />
        </div>
        <div className="timetable-field">
          <label>Academic Year</label>
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
          >
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
        <div className="timetable-field">
          <label>Check substitution for date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div className="timetable-action">
          <button className="timetable-button timetable-button--primary" onClick={fetchTimetable}>
            Fetch Timetable
          </button>
        </div>
      </div>

      {error ? <p className="timetable-feedback is-error">{error}</p> : null}

      <div className="timetable-shell">
          <div className="timetable-shell__meta">
          <div>
            <span className="meta-label">Displayed Days</span>
            <strong>{daysState.length}</strong>
          </div>
          <div>
            <span className="meta-label">Periods Per Day</span>
            <strong>{periodsState.length}</strong>
          </div>
          <div>
            <span className="meta-label">Academic Year</span>
            <strong>
              {selectedAcademicYear
                ? academicYears.find(
                    (year) =>
                      `${year.academicYearStart}|${year.academicYearEnd}` === selectedAcademicYear
                  )
                  ? formatAcademicYearLabel(
                      academicYears.find(
                        (year) =>
                          `${year.academicYearStart}|${year.academicYearEnd}` === selectedAcademicYear
                      ),
                      academicYears
                    )
                  : "Not selected"
                : "Not selected"}
            </strong>
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
                    const cell = getCell(day, p);
                    let cellClass = "timetable-cell is-empty";

                    // Treat CONFLICT with NO_TUTOR_AVAILABLE specially: keep neutral styling but show a note
                    if (!cell?.active || (cell?.status === "CONFLICT" && cell?.conflictReason !== "NO_TUTOR_AVAILABLE")) {
                      cellClass = "timetable-cell is-inactive";
                    } else if (cell?.status === "REPLACED") {
                      cellClass = "timetable-cell is-replaced";
                    } else if (cell) {
                      cellClass = "timetable-cell is-filled";
                    }

                    return (
                      <td key={p} className={cellClass}>
                        {cell ? (
                          // If there's a NO_TUTOR_AVAILABLE conflict, show a note but keep neutral styling
                          cell.status === "CONFLICT" && cell.conflictReason === "NO_TUTOR_AVAILABLE" ? (
                            <div className="timetable-entry">
                              <span className="entry-subject">{cell.subjectName ?? "—"}</span>
                              <span className="entry-note">No tutor available</span>
                            </div>
                          ) : (
                            <div className="timetable-entry">
                              <span className="entry-subject">{cell.subjectName ?? "—"}</span>
                              <span className="entry-tutor">{cell.tutorName ?? "—"}</span>
                            </div>
                          )
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
      </div>
    </section>
  );
};

export default ClassTimetable;
