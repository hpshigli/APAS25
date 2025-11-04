import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './Insights.css';
import { StoreData } from '../../context/StoreData';

const Insights = () => {
  const { adToken } = useContext(StoreData);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // thresholds default & guard against empty input
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [marksThreshold, setMarksThreshold] = useState(40);

  const headers = { Authorization: `Bearer ${adToken}` };

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await axios.get('/api/atrisk', { headers });
      if (res.data.success) setList(res.data.students || []);
      else setErr(res.data.message || 'Failed to load');
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adToken) load();
  }, [adToken]);

  // helpers to keep numbers finite
  const toInt = (v, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };

  const rebuild = async () => {
  const att = toInt(attendanceThreshold, 75);
  const mk = toInt(marksThreshold, 40);
  try {
    setLoading(true);
    setErr('');
    const res = await axios.post(
      `/api/atrisk/rebuild?attendance=${att}&marks=${mk}`,
      {},
      { headers }
    );
    if (res.data.success) {
      // IMPORTANT: fetch from DB so each row has its AtRisk.id
      await load();
    } else {
      setErr(res.data.message || 'Rebuild failed');
    }
  } catch (e) {
    setErr(e?.response?.data?.message || e.message || 'Rebuild failed');
  } finally {
    setLoading(false);
  }
};


  const notify = async (row) => {
  console.log('[Notify click] row =', row);
  // AtRisk PK:
  const id = Number(row?.id);
  if (!Number.isFinite(id) || id <= 0) {
    alert('Invalid record id');
    return;
  }

  // Optimistic remove from UI
  setList(prev => prev.filter(x => x.id !== id));

  try {
    const res = await axios.delete(`/api/atrisk/${encodeURIComponent(id)}/notify`, {
      headers: { Authorization: `Bearer ${adToken}` },
    });
    console.log('[Notify response]', res.data);
    if (!res.data?.success) {
      await load(); // resync if backend reported failure
      alert(res.data?.message || 'Notify failed');
    }
  } catch (e) {
    console.error('[Notify error]', e?.response?.data || e.message);
    await load(); // resync on any error
    alert(e?.response?.data?.message || e.message || 'Notify failed');
  }
};


  return (
    <div className="insights-container">
      <h2>At-Risk Insights</h2>

      <div className="controls">
        <div className="field">
          <label>Attendance &lt; (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={attendanceThreshold}
            onChange={(e) =>
              setAttendanceThreshold(e.target.value === '' ? 0 : Number(e.target.value))
            }
          />
        </div>

        <div className="field">
          <label>Marks &lt;</label>
          <input
            type="number"
            min="0"
            max="100"
            value={marksThreshold}
            onChange={(e) =>
              setMarksThreshold(e.target.value === '' ? 0 : Number(e.target.value))
            }
          />
        </div>

        <button className="rebuild-btn" onClick={rebuild} disabled={loading}>
          Rebuild At-Risk List
        </button>
      </div>

      {err && <p className="error">{err}</p>}
      {loading && <p className="loading">Working…</p>}

      <div className="list">
        {list.length === 0 && !loading ? (
          <div className="empty">No at-risk students 🎉</div>
        ) : (
          list.map((s) => (
            <div key={s.id} className="card">
              <div className="row">
                <div className="name">{s.name}</div>
                <div className="srn">{s.srn}</div>
                <div className="section">Section {s.section}</div>
              </div>

              <div className="row metrics">
                <span>Attendance: <b>{s.attendance}%</b></span>
                <span>Phy: <b>{s.physics}</b></span>
                <span>Che: <b>{s.chemistry}</b></span>
                <span>Maths: <b>{s.maths}</b></span>
              </div>

              <div className="row reason">
                <span>Reason: {s.reason}</span>
              </div>

              <div className="row actions">
                <button
                  className="notify-btn"
                  onClick={() => notify(s)}   // pass the whole row
                  disabled={loading}      
                >
                  Notify
                </button>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Insights;
