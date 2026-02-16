import React from "react";
import Navbar from "./Navbar";
import BackgroundAnimation from "./BackgroundAnimation";
import HeaderAnimation from "./HeaderAnimation";
import AboutSection from "./sections/AboutSection";
import CodingSection from "./sections/CodingSection";
import ArtSection from "./sections/ArtSection";
import WritingSection from "./sections/WritingSection";
import SelfStudySection from "./sections/SelfStudySection";
import StatsSection from "./StatsSection";
import '../styles/SinglePage.css';

function SinglePage() {
  return (
    <div className="single-page-container">
      <BackgroundAnimation />
      <HeaderAnimation />
      <Navbar />
      <div className="sections-wrapper">
        <section id="hero" className="hero-section">
          <h1 className="hero-name">Ben Backus</h1>
          <p className="hero-tagline">Code · Art · Writing</p>
        </section>
        <section id="stats" className="stats-wrapper">
          <StatsSection />
        </section>
        <section id="about" className="page-section">
          <AboutSection />
        </section>
        <section id="coding" className="page-section">
          <CodingSection />
        </section>
        <section id="art" className="page-section">
          <ArtSection />
        </section>
        <section id="writing" className="page-section">
          <WritingSection />
        </section>
        <section id="study" className="page-section">
          <SelfStudySection />
        </section>
      </div>
    </div>
  );
}

export default SinglePage;
