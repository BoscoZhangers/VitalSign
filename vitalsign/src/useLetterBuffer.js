import { useState, useRef } from "react";

export function useLetterBuffer() {
  const [text, setText] = useState("");
  const last = useRef("");
  const lastTime = useRef(0);

  function push(letter) {
    const now = Date.now();
    if (
      letter &&
      letter !== last.current &&
      now - lastTime.current > 700
    ) {
      setText((prev) => prev + letter);
      last.current = letter;
      lastTime.current = now;
    }
  }

  return { text, push };
}

