import { useState, useEffect, useRef } from "react";

export default function BackgroundMusic() {

  const audioRef = useRef(null); // This does not cause re renders when changed

  const [isPlaying, setIsPlaying] = useState(false); // Nothing plays under after rendering

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return; // safety check

    audio.loop = true;  // so it loops forever

    // Try to autoplay
    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {

        // If the autoplay fails (most browsers will block it) just wait for the user to click something
        const startOnClick = () => {
          audio.play();
          setIsPlaying(true);

          // Remove listener after the first click
          window.removeEventListener("click", startOnClick);
        };
        window.addEventListener("click", startOnClick);
      });

  }, []); // empty array

  // This toggle music function plays when the button is clicked
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // If it is currently playing, then pause it
      audio.pause();
      setIsPlaying(false);
    } else {
      // If currently paused, then play it
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <>
      {/* The actual audio */}
      <audio ref={audioRef} src="/theme.mpeg" />

      {/* Music control button */}
      <button
        onClick={toggleMusic}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000
        }}
      >
        {isPlaying ? "🔇 Stop Music" : "🔊 Play Music"}
      </button>
    </>
  );

}