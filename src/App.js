import React from "react";
import SinglePage from './components/SinglePage';
import Habits from './components/Habits';
import Navbar from './components/Navbar';
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
          <Route path="/habits" element={<><Navbar/><Habits/></>} />
        </Routes>
      </Router>
    </main>
  );
}

export default App;
