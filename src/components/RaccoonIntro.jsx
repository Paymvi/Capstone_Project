import "./RaccoonIntro.css";
<<<<<<< HEAD
import { useEffect, useState } from "react";

const messages = [
  "Welcome back, Explorer...",
  "Ready to explore?",
  "New discoveries await...",
  "Let’s find something cool...",
  "Adventure time!",
];

export default function RaccoonIntro({ onFinish }) {
  const [message] = useState(() => {
    const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");

    if(!hasLoggedInBefore){
      // First time user
      localStorage.setItem("hasLoggedInBefore", "true");
      return "Welcome to Roamie! Let's start your adventure ✨✨";
    }

    // Returning user -> random message
    return messages[Math.floor(Math.random() * messages.length)];
  });

  const [fadeOut, setFadeOut] = useState(false);

  const isFirstTime = !localStorage.getItem("hasLoggedInBefore");
  const duration = isFirstTime ? 4000 : 3000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);  // start fade out
    }, duration - 500); // duration

    const navTimer = setTimeout(() => {
      onFinish(); // go to map after animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(navTimer);
    }
  }, []);

  return (
    <div className={`intro-overlay ${fadeOut ? "fade-out" : ""}`}>

      {/* TEXT */}
      <div className="text-mask">
        <div className="intro-text">
          {message}
        </div>
      </div>

      {/* RACCOON */}
      <div className="raccoon-sprite" />
      <div className="sparkle sparkle-1">✨</div>
      <div className="sparkle sparkle-2">✨</div>
      <div className="sparkle sparkle-3">✨</div>

=======
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
>>>>>>> 3f7fed4 (Feat: Added login intro animation with mascot overlay and delayed navigation flow)
    </div>
  );
}