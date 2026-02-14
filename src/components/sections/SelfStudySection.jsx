import React from "react";
import '../../styles/SelfStudy.css';
import HabitHeatmaps from '../HabitHeatmaps';

function SelfStudySection() {
  return (
    <div className="selfStudyPage">
      <div className="section-title">Study</div>
      
      <HabitHeatmaps />

      <div className="study-intro">
        <p>
          For over a year, I've been on a journey of deliberate self-improvement through 
          structured learning platforms. I've been using <a href="https://www.mathacademy.com/">Math Academy</a> for 
          mathematics, <a href="https://apps.ankiweb.net/">Anki</a> for spaced repetition, 
          and <a href="https://www.chess.com/">Chess.com</a> to sharpen my tactical thinking.
        </p>
        <p>
          I've also been exploring ways to use <a href="https://github.com/clawdbot/clawdbot">Clawdbot</a> to 
          manage my progress and optimize my learning across all three platforms.
        </p>
      </div>

      <div className="study-philosophy">
        <h2>The Journey</h2>
        <p>
          My approach has evolved significantly. Initially, I tried to optimize all three simultaneously—pushing 
          hard on math, reviews, and chess every single day. But as work demands increased (I'm now working 
          ~10 hours a day at my job), I realized something had to give.
        </p>
        <p>
          I pivoted to <strong>optimizing for streaks</strong>—just maintaining the habit, even minimally. 
          This kept the momentum alive but eventually I noticed a problem: those streaks became so 
          minimally maintained that they were almost meaningless. Doing one Anki card or one chess puzzle 
          just to keep a streak alive wasn't actually helping me learn.
        </p>
        <p>
          Now I'm in <strong>maintenance mode</strong>, trying to identify a sustainable approach that 
          balances consistent progress across all three areas while still working out, navigating significant 
          life uncertainty, and maintaining my sanity. The search continues.
        </p>
      </div>

      <div className="study-section">
        <h2 className="section-header-centered">Math Academy</h2>
        <p className="streak-info">Longest streak: 101 days</p>
        <div className="study-content">
          <div className="course-list">
            <div className="course-item">
              <h3>Mathematical Foundations II ✓</h3>
              <div className="topics">
                <span className="topic">Quadratics</span>
                <span className="topic">Logarithms</span>
                <span className="topic">Trigonometry</span>
                <span className="topic">Polynomials</span>
                <span className="topic">Limits & Derivatives</span>
                <span className="topic">Integrals</span>
                <span className="topic">Complex Numbers</span>
                <span className="topic">Vectors</span>
                <span className="topic">Probability</span>
                <span className="topic">Statistics</span>
              </div>
            </div>

            <div className="course-item">
              <h3>Mathematical Foundations III ✓</h3>
              <div className="topics">
                <span className="topic">Advanced Calculus</span>
                <span className="topic">Related Rates</span>
                <span className="topic">Optimization</span>
                <span className="topic">Particle Motion</span>
                <span className="topic">Differential Equations</span>
                <span className="topic">Matrices</span>
                <span className="topic">Parametric Curves</span>
                <span className="topic">Polar Curves</span>
              </div>
            </div>

            <div className="course-item">
              <h3>Mathematics for Machine Learning (20%)</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '20%'}}></div>
              </div>
              <div className="topics">
                <span className="topic">Linear Algebra</span>
                <span className="topic">Multivariable Calculus</span>
                <span className="topic">Probability & Statistics</span>
                <span className="topic">Gradient Descent</span>
                <span className="topic">Neural Networks</span>
                <span className="topic">Backpropagation</span>
                <span className="topic">SVMs</span>
                <span className="topic">PCA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="study-section">
        <h2 className="section-header-centered">Anki</h2>
        <p className="streak-info">Longest streak: 124 days</p>
        <div className="study-content">
          <p>
            I use Anki for spaced repetition—the scientifically-proven method of reviewing information 
            at optimal intervals to maximize long-term retention.
          </p>
          <div className="deck-list">
            <div className="deck-item">
              <span className="deck-name">Math</span>
              <span className="deck-count">~170 cards</span>
            </div>
            <div className="deck-item">
              <span className="deck-name">Systems Design</span>
              <span className="deck-count">~140 cards</span>
            </div>
            <div className="deck-item">
              <span className="deck-name">Mental Health Quotes</span>
              <span className="deck-count">~30 cards</span>
            </div>
            <div className="deck-item">
              <span className="deck-name">Debate</span>
              <span className="deck-count">~25 cards</span>
            </div>
          </div>
          <p className="anki-total">~365 cards total</p>
        </div>
      </div>

      <div className="study-section">
        <h2 className="section-header-centered">Chess.com</h2>
        <p className="streak-info">Longest streak: 35 days</p>
        <div className="study-content">
          <p>
            Chess has been my tactical playground since May 2023. I primarily play Rapid games 
            (10+ minutes per side) to balance thoughtful play with time management.
          </p>
          <div className="chess-stats">
            <div className="stat-card">
              <div className="stat-value">579</div>
              <div className="stat-label">Rapid Rating</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">580</div>
              <div className="stat-label">Peak Rating</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">740</div>
              <div className="stat-label">Games Played</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">1520</div>
              <div className="stat-label">Puzzle Rating</div>
            </div>
          </div>
          <div className="chess-record">
            <span>369 W</span>
            <span>32 D</span>
            <span>339 L</span>
          </div>
          <p className="chess-link-small">
            <a href="https://www.chess.com/member/mbbbackus">play me in chess!</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SelfStudySection;
