import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const BackgroundMusic = forwardRef(function BackgroundMusic(props, ref) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;

    const startOnClick = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // do nothing if browser still blocks it
        });

      window.removeEventListener("click", startOnClick);
    };

    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        window.addEventListener("click", startOnClick);
      });

    return () => {
      window.removeEventListener("click", startOnClick);
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.log("Music play blocked:", err);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    toggleMusic,
    isPlaying,
  }));

  return <audio ref={audioRef} src="/theme.mpeg" />;
});

export default BackgroundMusic;