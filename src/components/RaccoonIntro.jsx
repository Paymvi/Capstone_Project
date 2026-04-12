import "./RaccoonIntro.css";
import { useEffect } from "react";

export default function RaccoonIntro({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish(); // go to map after animation
    }, 2000); // duration

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="intro-overlay">
      <img src="/Pegman.png" className="raccoon" />
      <p className="welcome-text">Welcome back, Explorer</p>
    </div>
  );
}