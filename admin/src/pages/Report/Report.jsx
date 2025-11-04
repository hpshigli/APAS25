import React, { useState, useEffect } from 'react';
import './Report.css';
import { Bar, Pie } from 'react-chartjs-2';
import Papa from 'papaparse';

// Dummy: you may replace with real API call
const csvPath = 'http://localhost:4000/assets/dummy_students.csv';

const subjects = ['Physics', 'Chemistry', 'Maths'];

const Report = () => {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [summary, setSummary] = useState(null);

  // Load CSV on mount
  useEffect(() => {
    fetch(csvPath)
      .then((res) => res.text())
      .then((csv) => {
        Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
          complete: (result) => {
            setStudents(result.data);
            // Get unique section list
            const sectionList = [
              ...new Set(result.data.map((row) => row.Section).filter(Boolean)),
            ];
            setSections(sectionList);
            setSelectedSection(sectionList[0]);
          },
        });
      });
  }, []);

  // Calculate summary on section change
  useEffect(() => {
    if (!selectedSection) return;
    const filtered = students.filter((stu) => stu.Section === selectedSection);

    if (!filtered.length) {
      setSummary(null);
      return;
    }

    // Gather stats:
    const avgAttendance =
      filtered.reduce((sum, stu) => sum + stu.Attendance, 0) / filtered.length;
    const avgMarks = {};
    subjects.forEach((subj) => {
      avgMarks[subj] =
        filtered.reduce((sum, stu) => sum + stu[subj], 0) / filtered.length;
    });

    setSummary({
      numStudents: filtered.length,
      avgAttendance: avgAttendance.toFixed(2),
      avgPhysics: avgMarks.Physics.toFixed(2),
      avgChemistry: avgMarks.Chemistry.toFixed(2),
      avgMaths: avgMarks.Maths.toFixed(2),
      avgMarks, // For chart
    });
  }, [selectedSection, students]);

  return (
    <div className="report-container">
      <h2>Class Summary Report</h2>
      <label htmlFor="section-select" className="section-label">
        Select Class Section:
      </label>
      <select
        id="section-select"
        value={selectedSection}
        onChange={(e) => setSelectedSection(e.target.value)}
        className="section-select"
      >
        {sections.map((sec) => (
          <option key={sec} value={sec}>
            {sec}
          </option>
        ))}
      </select>
      {summary && (
        <div className="summary-box">
          <h3>Summary for Section {selectedSection}</h3>
          <ul>
            <li>Total Students: {summary.numStudents}</li>
            <li>Average Attendance: {summary.avgAttendance}%</li>
            <li>Average Physics Marks: {summary.avgPhysics}</li>
            <li>Average Chemistry Marks: {summary.avgChemistry}</li>
            <li>Average Maths Marks: {summary.avgMaths}</li>
          </ul>
          <div className="charts-row">
            <div className="chart-box">
              <Bar
                data={{
                  labels: subjects,
                  datasets: [
                    {
                      label: 'Average Marks',
                      data: subjects.map((subj) => summary.avgMarks[subj]),
                      backgroundColor: ['#e94b3c', '#fd821d', '#2d91c2'],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="chart-box">
              <Pie
                data={{
                  labels: ['Attendance', 'Absence'],
                  datasets: [
                    {
                      data: [
                        summary.avgAttendance,
                        (100 - summary.avgAttendance).toFixed(2),
                      ],
                      backgroundColor: ['#e94b3c', '#cfd8dc'],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
