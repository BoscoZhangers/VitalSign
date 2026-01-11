import { useState, useRef } from "react";

export function useCaptionBuffer() {
  const [text, setText] = useState("");
  const lastGesture = useRef("");
  const lastTime = useRef(0);

  function push(word) {
    const now = Date.now();
    if (word && word !== lastGesture.current && now - lastTime.current > 800) {
      setText((prev) => prev + " " + word);
      lastGesture.current = word;
      lastTime.current = now;
    }
  }

  return { text, push };
}

