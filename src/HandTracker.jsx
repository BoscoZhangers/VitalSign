"use client"; // <--- ADD THIS LINE AT THE VERY TOP

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export default function HandTracker() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [landmarker, setLandmarker] = useState(null);

  // 1. Initialize MediaPipe HandLandmarker
  useEffect(() => {
    const createLandmarker = async () => {
      console.log("1. Starting Model Load..."); // <--- DEBUG STEP 1
      
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      const newLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU" // Switch to "CPU" if your browser crashes
        },
        runningMode: "VIDEO",
        numHands: 2
      });
      
      console.log("2. Model Loaded Successfully!"); // <--- DEBUG STEP 2
      setLandmarker(newLandmarker);
    };
    createLandmarker();
  }, []);

  // 2. Process Frames Loop
  const predictWebcam = () => {
    if (landmarker && webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const { videoWidth, videoHeight } = video;

      // Ensure canvas matches video size
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      let startTimeMs = performance.now();
      const results = landmarker.detectForVideo(video, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        console.log("3. Hand Detected:", results.landmarks); // <--- DEBUG STEP 3
        draw(results.landmarks);
      } else {
        // Clear canvas if no hands are found (visual feedback that it's running)
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    requestAnimationFrame(predictWebcam);
  };

  // 3. Draw Logic
  const draw = (landmarks) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Style settings
    ctx.lineWidth = 4; 
    
    landmarks.forEach((hand) => {
      // Draw Points
      ctx.fillStyle = "yellow";
      for (let point of hand) {
        const x = point.x * canvasRef.current.width;
        const y = point.y * canvasRef.current.height;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI); 
        ctx.fill();
      }

      // Draw Connections
      ctx.strokeStyle = "green";
      ctx.beginPath();
      
      const drawFinger = (indices) => {
        ctx.moveTo(hand[indices[0]].x * canvasRef.current.width, hand[indices[0]].y * canvasRef.current.height);
        for(let i = 1; i < indices.length; i++) {
           ctx.lineTo(hand[indices[i]].x * canvasRef.current.width, hand[indices[i]].y * canvasRef.current.height);
        }
      }
      
      drawFinger([0, 1, 2, 3, 4]);       // Thumb
      drawFinger([0, 5, 6, 7, 8]);       // Index
      drawFinger([9, 10, 11, 12]);       // Middle
      drawFinger([13, 14, 15, 16]);      // Ring
      drawFinger([0, 17, 18, 19, 20]);   // Pinky
      drawFinger([5, 9, 13, 17]);        // Knuckles
      
      ctx.stroke();
    });
  };

  // Trigger prediction when data is loaded
  useEffect(() => {
    if (landmarker) {
      predictWebcam();
    }
  }, [landmarker]);

  return (
    <div style={{ position: "relative" }}>
      {/* The Camera Feed */}
      <Webcam
        ref={webcamRef}
        style={{ 
          position: "absolute", 
          left: 0, 
          top: 0, 
          width: "100%", 
          height: "auto",
          zIndex: 9 // Behind the canvas
        }}
      />
      {/* The Overlay (Lines & Dots) */}
      <canvas
        ref={canvasRef}
        style={{ 
          position: "absolute", 
          left: 0, 
          top: 0, 
          width: "100%", 
          height: "auto",
          border: "5px solid red", // <--- VISUAL DEBUG: Proves canvas exists
          zIndex: 10 // On top of the video
        }}
      />
    </div>
  );
}