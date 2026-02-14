import React, { useState, useEffect } from 'react';
import '../styles/HabitHeatmaps.css';

const SUPABASE_URL = 'https://qtdsqfebryixryjudkcp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ph4txCpe97qV80KH2fkRlw_yV7ZX2Av';

const HabitHeatmaps = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/habit_entries?select=*&order=date`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const entries = await response.json();
      setData(entries);
    } catch (err) {
      console.error('Failed to load habit data:', err);
    }
    setLoading(false);
  };

  if (loading) return <div className="heatmaps-loading">Loading activity...</div>;
  if (!data.length) return null;

  return (
    <div className="habit-heatmaps">
      <h2 className="section-header-centered">Activity</h2>
      <p className="heatmaps-subtitle">Daily progress tracked since 2023</p>
      
      <div className="heatmaps-grid">
        <MiniHeatmap
          title="Math Academy"
          data={data}
          valueKey="math_value"
          shadeKey="math_shade"
          unit="XP"
        />
        <MiniHeatmap
          title="Anki"
          data={data}
          valueKey="anki_value"
          shadeKey="anki_shade"
          unit="cards"
        />
        <MiniHeatmap
          title="Chess"
          data={data}
          valueKey="chess_value"
          shadeKey="chess_shade"
          unit="games"
        />
      </div>
    </div>
  );
};

const MiniHeatmap = ({ title, data, valueKey, shadeKey, unit }) => {
  const weeks = groupByWeek(data);
  const totalDays = data.filter(d => d[valueKey] > 0).length;
  const totalValue = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
  
  return (
    <div className="mini-heatmap">
      <div className="mini-heatmap-header">
        <span className="mini-heatmap-title">{title}</span>
        <span className="mini-heatmap-stats">
          {totalDays} days · {totalValue.toLocaleString()} {unit}
        </span>
      </div>
      <div className="mini-heatmap-grid">
        {weeks.map((week, i) => (
          <div key={i} className="heatmap-week">
            {week.map((day, j) => (
              <div
                key={j}
                className={`heatmap-cell ${day ? day[shadeKey] : 'future'}`}
                title={day ? `${day.date}: ${day[valueKey]} ${unit}` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mini-heatmap-legend">
        <span>Less</span>
        <div className="legend-cells">
          <div className="heatmap-cell empty" />
          <div className="heatmap-cell light" />
          <div className="heatmap-cell medium" />
          <div className="heatmap-cell heavy" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

function groupByWeek(data) {
  if (!data.length) return [];
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const dateMap = {};
  data.forEach(entry => { dateMap[entry.date] = entry; });
  
  const weeks = [];
  let currentWeek = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    currentWeek.push(dateMap[dateStr] || null);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  
  return weeks;
}

export default HabitHeatmaps;
