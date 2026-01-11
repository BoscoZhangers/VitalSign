"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { loadEmotionModels, detectEmotion } from '@/src/modules/emotion';

export default function HandTracker({ onSentenceComplete, compact = false }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [landmarker, setLandmarker] = useState(null);
  const [gesture, setGesture] = useState("No Hand");
  const [sentence, setSentence] = useState("");
  const [faceEmotion, setFaceEmotion] = useState("Neutral");
  const [faceEmotionConfidence, setFaceEmotionConfidence] = useState(0);
  const emotionInFlight = useRef(false);
  const lastEmotionUpdatedAt = useRef(0);

  // RAF loop reads from refs (state values would be stale inside the loop)
  const sentenceRef = useRef("");
  const faceEmotionRef = useRef("Neutral");
  
  // HISTORY FOR DEBOUNCING AND MOTION
  const gestureHistory = useRef([]);
  const motionBuffer = useRef([]); 
  const lastTypedTime = useRef(0);
  const lastCommittedGesture = useRef(null);
  const handWasDetected = useRef(false);

  // Hand-left-frame debounce
  const noHandFrames = useRef(0);
  const lastFinalizeAt = useRef(0);

  const HISTORY_SIZE = 10;
  const MOTION_WINDOW_MS = 500; 

  // Tune to reduce false-finalize on brief landmark dropouts.
  const NO_HAND_FRAME_THRESHOLD = 8;
  const FINALIZE_COOLDOWN_MS = 800;

  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  useEffect(() => {
    faceEmotionRef.current = faceEmotion;
  }, [faceEmotion]);

  const classifyGesture = (g) => {
    if (!g || g === "..." || g === "No Hand") {
      return { kind: "none", baseWeight: 0, minCount: Infinity, typeMinCount: Infinity, typeDelayMs: Infinity };
    }
    return { kind: "word", baseWeight: 2.5, minCount: 5, typeMinCount: 5, typeDelayMs: 600 };
  };

  const applyGestureToSentence = (prev, g) => {
    const trimRight = (s) => s.replace(/[ \t\n\r]+$/g, "");
    const ensureSpace = (s) => (s.length === 0 || /\s$/.test(s) ? s : s + " ");
    const base = ensureSpace(trimRight(prev));
    return base + g + " ";
  };

  useEffect(() => {
    const initAI = async () => {
      // Load face-api.js emotion models
      try {
        await loadEmotionModels();
      } catch (err) {
        console.error('Failed to load emotion models:', err);
      }

      // Load MediaPipe hand landmarker
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      const nl = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO", numHands: 1
      });
      setLandmarker(nl);
    };
    initAI();
  }, []);

  const detectFaceEmotion = async () => {
    if (emotionInFlight.current) return;
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return;

    emotionInFlight.current = true;
    try {
      const result = await detectEmotion(video);
      if (result?.emotion) setFaceEmotion(result.emotion);
      if (typeof result?.confidence === 'number') setFaceEmotionConfidence(result.confidence);
      lastEmotionUpdatedAt.current = Date.now();
    } catch (err) {
      console.error('Emotion detection error:', err);
    } finally {
      emotionInFlight.current = false;
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;
      detectFaceEmotion();
    }, 1500);
    return () => {
      clearInterval(id);
      emotionInFlight.current = false;
    };
  }, []);

  const predict = () => {
    if (landmarker && webcamRef.current?.video?.readyState === 4) {
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      const results = landmarker.detectForVideo(video, performance.now());

      if (results.landmarks?.length > 0) {
        noHandFrames.current = 0;
        const lm = results.landmarks[0];
        draw(results.landmarks);
        
        motionBuffer.current.unshift({ x: lm[0].x, y: lm[0].y, z: lm[0].z || 0, time: Date.now() });
        if (motionBuffer.current.length > 30) motionBuffer.current.pop();

        const rawSign = analyzeASL(lm);
        if (rawSign !== "..." && rawSign !== "No Hand") {
          handWasDetected.current = true;
        }
        debounceAndType(rawSign);
      } else {
        noHandFrames.current += 1;

        const now = Date.now();
        const canFinalize =
          handWasDetected.current &&
          onSentenceComplete &&
          noHandFrames.current >= NO_HAND_FRAME_THRESHOLD &&
          now - lastFinalizeAt.current > FINALIZE_COOLDOWN_MS;

        if (canFinalize) {
          const currentText = sentenceRef.current.trim();
          if (currentText.length > 0) {
            onSentenceComplete(currentText, faceEmotionRef.current);
            setSentence("");
          }
          handWasDetected.current = false;
          lastFinalizeAt.current = now;
          noHandFrames.current = 0;
        }
        setGesture("No Hand");
        gestureHistory.current = [];
      }
    }
    requestAnimationFrame(predict);
  };

  const analyzeASL = (lm) => {
    const dist = (p1, p2) => Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow((p1.z || 0) - (p2.z || 0), 2)
    );
    
    const wrist = lm[0];
    const thumbT = lm[4], indexT = lm[8], middleT = lm[12], ringT = lm[16], pinkyT = lm[20];
    const indexK = lm[5], middleK = lm[9], ringK = lm[13], pinkyK = lm[17];
    
    // Normalization scale
    const handScale = dist(wrist, middleK);
  
    // Extended Logic
    const isExtended = (tip, knuckle) => dist(tip, wrist) > dist(knuckle, wrist) + (handScale * 0.15);
    
    const f1 = isExtended(indexT, indexK); // Index
    const f2 = isExtended(middleT, middleK); // Middle
    const f3 = isExtended(ringT, ringK);   // Ring
    const f4 = isExtended(pinkyT, pinkyK); // Pinky
  
    // --- 1. MOTION ANALYSIS ---
    let startPos = wrist;
    let endPos = wrist;
    
    if (motionBuffer.current.length > 5) {
      endPos = motionBuffer.current[0];
      for (let i = 0; i < motionBuffer.current.length; i++) {
        if (Date.now() - motionBuffer.current[i].time > 400) {
          startPos = motionBuffer.current[i];
          break;
        }
      }
    }
    
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y; 
    const dxView = -dx; 

    // --- "HELLO" (Wave) ---
    const isPalmOpen = f1 && f2 && f3 && f4;
    let wiggleEnergy = 0;
    for(let i=0; i < motionBuffer.current.length - 1; i++){
        wiggleEnergy += Math.abs(motionBuffer.current[i].x - motionBuffer.current[i+1].x);
    }
    if (isPalmOpen && (wiggleEnergy > 0.4 || Math.abs(dxView) > 0.15)) {
        return "HELLO";
    }

    // --- "THANK YOU" ---
    if (isPalmOpen && dy > 0.10) { 
        return "THANK YOU";
    }

    // --- STATIC GESTURES ---

    const isThumbOut = dist(thumbT, indexK) > handScale * 0.6;
    const isSideways = Math.abs(wrist.x - middleK.x) > Math.abs(wrist.y - middleK.y);

    // --- "HELP" (Signal for Help - Stage 1) ---
    // 4 Fingers Open + Thumb Tucked (Not extended)
    if (isPalmOpen && !isThumbOut) {
        return "HELP";
    }

    // --- "LOVE" (ILY Sign) ---
    if (f1 && !f2 && !f3 && f4 && isThumbOut) {
        return "LOVE";
    }

    // --- "CALL" ---
    if (!f1 && !f2 && !f3 && f4 && isThumbOut) {
        if (isSideways) return "CALL";
    }

    // --- "ME" (Pointing at self with thumb) ---
    if (!f1 && !f2 && !f3 && !f4) {
        const isThumbMostlyOut = dist(thumbT, indexK) > handScale * 0.4;
        if (isThumbMostlyOut) {
            const isHorizontal = Math.abs(thumbT.y - indexK.y) < handScale * 0.5;
            // Ensure pointing inward (Thumb tip between wrist/pinky X plane)
            const isPointingIn = Math.abs(thumbT.x - pinkyK.x) < Math.abs(thumbT.x - indexK.x) || 
                                 Math.abs(thumbT.x - wrist.x) < handScale * 0.3;
            if (isHorizontal) return "ME";
        }
    }

    // --- "YES" (Thumbs Up) ---
    if (!f1 && !f2 && !f3 && !f4) {
        if (thumbT.y < indexK.y - (handScale * 0.2)) {
            return "YES";
        }
    }

    // --- "NO" (Thumbs Down) ---
    if (!f1 && !f2 && !f3 && !f4) {
         if (thumbT.y > wrist.y + (handScale * 0.2)) {
             return "NO";
         }
    }

    // --- "I" (Pinky Up) ---
    if (!f1 && !f2 && !f3 && f4 && !isThumbOut) {
        return "I";
    }

    // --- "YOU" (Point) ---
    if (f1 && !f2 && !f3 && !f4) {
        return "YOU";
    }

    return "...";
  };

  const debounceAndType = (sign) => {
    gestureHistory.current.unshift(sign);
    if (gestureHistory.current.length > HISTORY_SIZE) gestureHistory.current.pop();

    const counts = {};
    gestureHistory.current.forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    });

    const best = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const count = counts[best];
    const meta = classifyGesture(best);

    const now = Date.now();
    const timeSinceLastType = now - lastTypedTime.current;
    
    if (best !== "..." && best !== "No Hand" && count >= meta.minCount && 
       (lastCommittedGesture.current !== best || timeSinceLastType > 2000)) {
       
       setSentence(prev => applyGestureToSentence(prev, best));
       setGesture(best);
       lastTypedTime.current = now;
       lastCommittedGesture.current = best;
    } else if (best !== "..." && best !== "No Hand" && count >= 3) {
       setGesture(best); 
    }
  };

  const draw = (landmarks) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const { width, height } = canvasRef.current;
    const conn = [[0,1,2,3,4],[0,5,6,7,8],[9,10,11,12],[13,14,15,16],[0,17,18,19,20],[5,9,13,17]];
    landmarks.forEach(hand => {
      ctx.strokeStyle = "#00FF00"; ctx.lineWidth = 5;
      conn.forEach(p => {
        ctx.beginPath();
        p.forEach((idx, i) => {
          const x = (1 - hand[idx].x) * width;
          const y = hand[idx].y * height;
          if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
      });
    });
  };

  useEffect(() => { if (landmarker) predict(); }, [landmarker]);

  // UI STYLES
  const containerStyle = compact 
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#121212', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' };
  
  const videoContainerStyle = compact
    ? { position: 'relative', width: '100%', maxWidth: '640px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #333', marginBottom: '1rem' }
    : { position: 'relative', width: '100%', maxWidth: '720px', borderRadius: '15px', overflow: 'hidden', border: '3px solid #333' };

  const textContainerStyle = compact
    ? { width: '100%', maxWidth: '640px', background: '#f5f5f5', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }
    : { marginTop: '20px', width: '100%', maxWidth: '720px', background: '#1e1e1e', padding: '25px', borderRadius: '15px', border: '1px solid #444' };

  return (
    <div style={containerStyle}>
      <div style={videoContainerStyle}>
        <Webcam ref={webcamRef} mirrored={true} style={{ width: '100%', display: 'block' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        {!compact && (
          <>
            <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '10px' }}>
              Live Translation Engine
            </div>
            <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '10px' }}>
              Emotion: {faceEmotion} ({Math.round(faceEmotionConfidence * 100)}%)
            </div>
            <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#00FF7F', color: 'black', padding: '12px 35px', borderRadius: '50px', fontSize: '28px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,255,127,0.4)' }}>
              {gesture}
            </div>
          </>
        )}
      </div>
      <div style={textContainerStyle}>
        {!compact ? (
          <>
             <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Emotion</div>
               <div style={{ background: '#0b1220', color: '#c7f9d8', padding: '6px 10px', borderRadius: '8px', fontWeight: '600' }}>
                 {faceEmotion} {faceEmotionConfidence ? `(${Math.round(faceEmotionConfidence * 100)}%)` : ''}
               </div>
             </div>
             <p style={{ color: '#aaa', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Current Sentence</p>
             <p style={{ fontSize: '32px', minHeight: '45px', margin: '0', fontWeight: '500' }}>{sentence}</p>
             <button onClick={() => { setSentence(""); }} style={{ marginTop: '20px', padding: '10px 25px', background: '#ff3b3b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Text</button>
          </>
        ) : (
          <>
             <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Emotion</div>
               <div style={{ background: '#f0f7ef', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '12px' }}>
                 {faceEmotion} {faceEmotionConfidence ? `(${Math.round(faceEmotionConfidence * 100)}%)` : ''}
               </div>
             </div>
             <p style={{ color: '#333', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', fontWeight: '500' }}>Current Sentence</p>
             <p style={{ fontSize: '18px', minHeight: '30px', margin: '0', fontWeight: '500', color: '#333' }}>{sentence}</p>
          </>
        )}
      </div>
    </div>
  );
}