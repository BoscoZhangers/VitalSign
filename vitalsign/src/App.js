import { useRef, useEffect } from "react";
import { setupHands } from "./handLandmarks";
import { classifyASLLetter } from "./aslClassifier";
import { useLetterBuffer } from "./useLetterBuffer";

function App() {
  const videoRef = useRef(null);
  const { text, push } = useLetterBuffer();

  useEffect(() => {
    setupHands(videoRef.current, (results) => {
      if (results.multiHandLandmarks) {
        const landmarks = results.multiHandLandmarks[0];
        const letter = classifyASLLetter(landmarks);
        push(letter);
      }
    });
  }, [push]);

  return (
    <>
      <video ref={videoRef} style={{ display: "none" }} />
      <div style={captionStyle}>{text}</div>
    </>
  );
}

const captionStyle = {
  position: "fixed",
  bottom: "12%",
  width: "100%",
  textAlign: "center",
  fontSize: "2.5rem",
  color: "white",
  background: "rgba(0,0,0,0.7)",
  padding: "12px",
};

export default App;

