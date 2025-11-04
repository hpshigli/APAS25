import React, { useState, useEffect, useContext, useMemo } from 'react';
import './Report.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  Tooltip,
} from 'chart.js';
import axios from 'axios';
import { StoreData } from '../../context/StoreData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

const subjects = ['Physics', 'Chemistry', 'Maths'];

const Report = () => {
  const { adToken } = useContext(StoreData);

  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);

  const [showAll, setShowAll] = useState(false);
  const [dbStats, setDbStats] = useState({ total: 0, perSection: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // ---- Fetch unique sections
  useEffect(() => {
    const loadSections = async () => {
      try {
        setErr('');
        const res = await axios.get('/api/students/sections', {
          headers: { Authorization: `Bearer ${adToken}` }
        });
        if (res.data.success) {
          const secs = res.data.sections || [];
          setSections(secs);
          setSelectedSection(secs[0] || '');
        } else {
          setErr(res.data.message || 'Failed to load sections');
        }
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || 'Failed to load sections');
      }
    };
    if (adToken) loadSections();
  }, [adToken]);

  // ---- Fetch overall DB stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get('/api/students/stats', {
          headers: { Authorization: `Bearer ${adToken}` }
        });
        if (res.data?.success) setDbStats(res.data);
      } catch {
        // ignore
      }
    };
    if (adToken) loadStats();
  }, [adToken]);

  // ---- Fetch current view data (all vs section)
  useEffect(() => {
    const loadData = async () => {
      if (!adToken) return;
      if (!showAll && !selectedSection) return;

      setLoading(true);
      setErr('');
      try {
        const endpoint = showAll
          ? '/api/students/all'
          : `/api/students/section/${encodeURIComponent(selectedSection)}`;

        console.log('Fetching:', endpoint);
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${adToken}` }
        });

        if (res.data.success) {
          setStudents(res.data.students || []);
          setSummary(res.data.summary || null);

          // authoratative DB total when on "all"
          if (showAll && typeof res.data.totalDbCount === 'number') {
            setDbStats((s) => ({ ...s, total: res.data.totalDbCount }));
          }
        } else {
          setErr(res.data.message || 'Failed to load data');
          setStudents([]);
          setSummary(null);
        }
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || 'Failed to load data');
        setStudents([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [adToken, selectedSection, showAll]);

  // ---- Per-student grouped bars
  const perStudentChartData = useMemo(() => {
    if (!students?.length) return null;

    const labels = students.map((s) => `${s.name} (${s.srn})`);
    return {
      labels,
      datasets: [
        { label: 'Physics', data: students.map((s) => Number(s.physics) || 0), backgroundColor: '#2d91c2' },
        { label: 'Chemistry', data: students.map((s) => Number(s.chemistry) || 0), backgroundColor: '#fd821d' },
        { label: 'Maths', data: students.map((s) => Number(s.maths) || 0), backgroundColor: '#7cb342' },
        { label: 'Attendance %', data: students.map((s) => Number(s.attendance) || 0), backgroundColor: '#e94b3c' },
      ],
    };
  }, [students]);

  // ---- Averages bar
  const averagesChartData = useMemo(() => {
    if (!summary) return null;
    return {
      labels: ['Attendance', ...subjects],
      datasets: [
        {
          label: 'Average (%)',
          data: [
            Number(summary.avgAttendance) || 0,
            Number(summary.avgPhysics) || 0,
            Number(summary.avgChemistry) || 0,
            Number(summary.avgMaths) || 0,
          ],
          backgroundColor: ['#e94b3c', '#2d91c2', '#fd821d', '#7cb342'],
        },
      ],
    };
  }, [summary]);

  return (
    <div className="report-container">
      <h2>Class Summary Report</h2>

      <div className="controls-row">
        <label htmlFor="section-select" className="section-label">
          Select Class Section:
        </label>

        <select
          id="section-select"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="section-select"
          disabled={showAll}
        >
          {sections.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>

        <button className="toggle-btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show Selected Section' : 'Show All Sections'}
        </button>
      </div>

      {err && <p className="error">{err}</p>}
      {loading && <p className="loading">Loading…</p>}

      {!loading && summary && (
        <>
          <div className="summary-box">
            <h3>{showAll ? 'Summary for All Sections' : `Summary for Section ${selectedSection}`}</h3>
            <ul>
              <li>
                Total Students (current view): {summary.numStudents}
                {!!dbStats?.total && (
                  <> &nbsp; <span style={{ color: '#666' }}>| Total in DB: {dbStats.total}</span></>
                )}
              </li>
              <li>Average Attendance: {summary.avgAttendance}%</li>
              <li>Average Physics Marks: {summary.avgPhysics}</li>
              <li>Average Chemistry Marks: {summary.avgChemistry}</li>
              <li>Average Maths Marks: {summary.avgMaths}</li>
            </ul>
          </div>

          <div className="charts-row">
            <div className="chart-box wide">
              <h4>Per-Student Scores</h4>
              {perStudentChartData ? (
                <Bar
                  data={perStudentChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Score / %' } },
                      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } },
                    },
                  }}
                />
              ) : (
                <p>No student data</p>
              )}
            </div>

            <div className="chart-box">
              <h4>Averages</h4>
              {averagesChartData ? (
                <Bar
                  data={averagesChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Average %' } },
                    },
                  }}
                />
              ) : (
                <p>No averages</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Report;
