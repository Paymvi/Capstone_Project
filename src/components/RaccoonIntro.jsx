import "./RaccoonIntro.css";
import { useEffect } from "react";

export default function RaccoonIntro({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish(); // go to map after animation
    }, 2500); // duration

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="intro-overlay">

      {/* TEXT */}
      <div className="text-mask">
        <div className="intro-text">
          Welcome back, Explorer...
        </div>
      </div>

      {/* RACCOON */}
      <img src="/Ray_Raccoon_Walking_Anims-0.png" className="raccoon-walk" />

    </div>
  );
}