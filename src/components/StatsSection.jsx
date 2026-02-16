import React, { useState, useEffect } from 'react';
import '../styles/StatsSection.css';

const SUPABASE_URL = 'https://qtdsqfebryixryjudkcp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ph4txCpe97qV80KH2fkRlw_yV7ZX2Av';

// Hardcoded Claude usage for last 180 days
const CLAUDE_TOKENS = {
  total: 47_832_156,
  days: 180
};

function StatsSection() {
  const [showPerDay, setShowPerDay] = useState(false);
  const [stats, setStats] = useState({
    anki: { total: 0, days: 0 },
    math: { total: 0, days: 0 },
    chess: { rating: null },
    loading: true
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch habit data from Supabase
      const habitResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/habit_entries?select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const habitData = await habitResponse.json();

      // Calculate totals
      const ankiTotal = habitData.reduce((sum, d) => sum + (d.anki_value || 0), 0);
      const ankiDays = habitData.filter(d => d.anki_value > 0).length;
      const mathTotal = habitData.reduce((sum, d) => sum + (d.math_value || 0), 0);
      const mathDays = habitData.filter(d => d.math_value > 0).length;

      // Fetch chess rating
      let chessRating = null;
      try {
        const chessResponse = await fetch('https://api.chess.com/pub/player/mbbbackus/stats');
        const chessData = await chessResponse.json();
        chessRating = chessData.chess_rapid?.last?.rating || 
                      chessData.chess_blitz?.last?.rating || 
                      chessData.chess_bullet?.last?.rating || null;
      } catch (e) {
        console.error('Failed to fetch chess rating:', e);
      }

      setStats({
        anki: { total: ankiTotal, days: ankiDays },
        math: { total: mathTotal, days: mathDays },
        chess: { rating: chessRating },
        loading: false
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const formatNumber = (num) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getDisplayValue = (total, days) => {
    if (showPerDay && days > 0) {
      return Math.round(total / days);
    }
    return total;
  };

  if (stats.loading) {
    return (
      <div className="stats-section">
        <div className="stats-loading">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="stats-section">
      <div className="stats-toggle">
        <button 
          className={!showPerDay ? 'active' : ''} 
          onClick={() => setShowPerDay(false)}
        >
          Total
        </button>
        <button 
          className={showPerDay ? 'active' : ''} 
          onClick={() => setShowPerDay(true)}
        >
          Per Day
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">
            {formatNumber(getDisplayValue(stats.anki.total, stats.anki.days))}
          </div>
          <div className="stat-label">
            Anki Cards {showPerDay ? '/ day' : 'reviewed'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {formatNumber(getDisplayValue(stats.math.total, stats.math.days))}
          </div>
          <div className="stat-label">
            Math Academy XP {showPerDay ? '/ day' : 'earned'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {stats.chess.rating || '—'}
          </div>
          <div className="stat-label">
            Chess.com Rating
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {formatNumber(getDisplayValue(CLAUDE_TOKENS.total, CLAUDE_TOKENS.days))}
          </div>
          <div className="stat-label">
            Claude Tokens {showPerDay ? '/ day' : '(180 days)'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsSection;
