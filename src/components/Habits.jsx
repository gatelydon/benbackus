import React, { useState, useEffect } from 'react';
import '../styles/Habits.css';

const SUPABASE_URL = 'https://qtdsqfebryixryjudkcp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ph4txCpe97qV80KH2fkRlw_yV7ZX2Av';

const Habits = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="habits-loading">Loading habits data...</div>;
  if (error) return <div className="habits-error">Error: {error}</div>;

  return (
    <div className="habits-container">
      <h2>Habit Tracker</h2>
      <p className="habits-subtitle">Daily progress since May 2023</p>
      
      <HeatmapSection
        title="🎯 Math Academy"
        subtitle="XP earned"
        data={data}
        valueKey="math_value"
        shadeKey="math_shade"
        legend={['1-10 XP', '10-50 XP', '50+ XP']}
      />
      
      <HeatmapSection
        title="🃏 Anki"
        subtitle="Cards reviewed"
        data={data}
        valueKey="anki_value"
        shadeKey="anki_shade"
        legend={['1-10', '10-50', '50+']}
      />
      
      <HeatmapSection
        title="♟️ Chess"
        subtitle="Games played"
        data={data}
        valueKey="chess_value"
        shadeKey="chess_shade"
        legend={['1 game', '2 games', '3+ games']}
      />
    </div>
  );
};

const HeatmapSection = ({ title, subtitle, data, valueKey, shadeKey, legend }) => {
  // Group data by week for the heatmap grid
  const weeks = groupByWeek(data);
  const totalDays = data.filter(d => d[valueKey] > 0).length;
  const totalValue = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
  
  return (
    <div className="heatmap-section">
      <div className="heatmap-header">
        <h3>{title}</h3>
        <span className="heatmap-subtitle">{subtitle}</span>
        <span className="heatmap-stats">
          {totalDays} days · {totalValue.toLocaleString()} total
        </span>
      </div>
      
      <div className="heatmap-wrapper">
        <div className="heatmap-months">
          {getMonthLabels(data)}
        </div>
        <div className="heatmap-grid">
          <div className="heatmap-days">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div className="heatmap-weeks">
            {weeks.map((week, i) => (
              <div key={i} className="heatmap-week">
                {week.map((day, j) => (
                  <div
                    key={j}
                    className={`heatmap-day ${day ? day[shadeKey] : 'future'}`}
                    title={day ? `${day.date}: ${day[valueKey]} ${subtitle.toLowerCase()}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-boxes">
          <div className="heatmap-day empty" title="No activity" />
          <div className="heatmap-day light" title={legend[0]} />
          <div className="heatmap-day medium" title={legend[1]} />
          <div className="heatmap-day heavy" title={legend[2]} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

// Group entries by week (7 days per column)
function groupByWeek(data) {
  if (!data.length) return [];
  
  // Get date range - last 52 weeks
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364); // ~52 weeks
  
  // Adjust to start on Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // Create a map of date -> entry
  const dateMap = {};
  data.forEach(entry => {
    dateMap[entry.date] = entry;
  });
  
  // Build weeks array
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
  
  // Add remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null); // future days
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
}

// Generate month labels for the heatmap
function getMonthLabels(data) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 364);
  
  const labels = [];
  let currentMonth = -1;
  let currentDate = new Date(startDate);
  let weekIndex = 0;
  
  while (currentDate <= endDate) {
    if (currentDate.getMonth() !== currentMonth) {
      currentMonth = currentDate.getMonth();
      labels.push(
        <span 
          key={weekIndex} 
          style={{ gridColumnStart: weekIndex + 1 }}
        >
          {months[currentMonth]}
        </span>
      );
    }
    currentDate.setDate(currentDate.getDate() + 7);
    weekIndex++;
  }
  
  return labels;
}

export default Habits;
