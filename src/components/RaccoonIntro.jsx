import "./RaccoonIntro.css";
import { useEffect, useState } from "react";

const messages = [
  "Welcome back, Explorer...",
  "Ready to explore?",
  "New discoveries await...",
  "Let’s find something cool...",
  "Adventure time!",
];

const TOTAL_FRAMES = 25;
const COLS = 5;
const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");
const isFirstTime = !hasLoggedInBefore;
const duration = isFirstTime ? 4000 : 3000;

export default function RaccoonIntro({ onFinish }) {
  const [message] = useState(() => {

    if(isFirstTime){
      // First time user
      localStorage.setItem("hasLoggedInBefore", "true");
      return "Welcome to Roamie! Let's start your adventure ✨✨";
    }

    // Returning user -> random message
    return messages[Math.floor(Math.random() * messages.length)];
  });

  const [fadeOut, setFadeOut] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % TOTAL_FRAMES);
    }, 40); // speed (lower = faster)

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const navTimer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(navTimer);
    };
  }, [onFinish]);

  const col = frame % COLS;
  const row = Math.floor(frame / COLS);

  const FRAME_SIZE = 256; // adjust to your actual size

  return (
    <div className="intro-overlay">

      {/* TEXT */}
      <div className="text-mask">
        <div className="intro-text">
          {message}
        </div>
      </div>

      {/* RACCOON */}
      <div
        className="raccoon-sprite"
        style={{
          backgroundPosition: `-${col * FRAME_SIZE}px -${row * FRAME_SIZE}px`,
        }}
      />
      <div className="sparkle sparkle-1">✨</div>
      <div className="sparkle sparkle-2">✨</div>
      <div className="sparkle sparkle-3">✨</div>

      <div className={`fade-overlay ${fadeOut ? "active" : ""}`} />

    </div>
  );
}