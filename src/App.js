import React from "react";
import SinglePage from './components/SinglePage';
import AnimationLab from './components/AnimationLab';
import AnimationLibrary from './components/AnimationLibrary';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <main className="App">
      <Router>
        <Routes>
          <Route path="/" element={<SinglePage/>} />
          <Route path="/about" element={<SinglePage/>} />
          <Route path="/coding" element={<SinglePage/>} />
          <Route path="/art" element={<SinglePage/>} />
          <Route path="/writing" element={<SinglePage/>} />
          <Route path="/animation-lab" element={<AnimationLab/>} />
          <Route path="/animation-library" element={<AnimationLibrary/>} />
        </Routes>
      </Router>
    </main>
  );
}

export default App;
