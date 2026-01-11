import { useEffect } from "react";

export function useWebcam(videoRef) {
  useEffect(() => {
    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    setup();
  }, []);
}

