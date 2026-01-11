"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export default function HandTracker({ onSentenceComplete, compact = false }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [landmarker, setLandmarker] = useState(null);
  const [gesture, setGesture] = useState("No Hand");
  const [sentence, setSentence] = useState("");
  const [pendingLetters, setPendingLetters] = useState("");
  const pendingLettersRef = useRef("");

  // HISTORY FOR DEBOUNCING AND MOTION
  const gestureHistory = useRef([]);
  const motionBuffer = useRef([]); 
  const lastTypedTime = useRef(0);
  const letterStartTime = useRef(0);
  const lastCommittedGesture = useRef(null);
  const lastGestureTime = useRef(Date.now());
  const handWasDetected = useRef(false); // Track if hand was previously detected

  const HISTORY_SIZE = 15;
  const MOTION_WINDOW_MS = 350;
  const PAUSE_THRESHOLD_MS = 3000; // 3 seconds pause detection

  useEffect(() => {
    pendingLettersRef.current = pendingLetters;
  }, [pendingLetters]);

  const classifyGesture = (g) => {
    if (!g || g === "..." || g === "No Hand") {
      return { kind: "none", baseWeight: 0, minCount: Infinity, typeMinCount: Infinity, typeDelayMs: Infinity };
    }
    if (g === "SPACE" || g === "BACKSPACE") {
      return { kind: "command", baseWeight: 1.7, minCount: 6, typeMinCount: 6, typeDelayMs: 700 };
    }
    if (g === "HELLO" || g === "YES" || g === "NO") {
      // Prefer words over letters: lower stability requirement + higher vote weight.
      return { kind: "word", baseWeight: 2.5, minCount: 4, typeMinCount: 3, typeDelayMs: 550 };
    }
    // Letters: require higher confidence to actually *type*.
    return { kind: "letter", baseWeight: 1.0, minCount: 10, typeMinCount: 13, typeDelayMs: 1200 };
  };

  const applyGestureToSentence = (prev, g) => {
    const trimRight = (s) => s.replace(/[ \t\n\r]+$/g, "");
    const ensureSpace = (s) => (s.length === 0 || /\s$/.test(s) ? s : s + " ");

    if (g === "SPACE") {
      return ensureSpace(prev);
    }

    if (g === "BACKSPACE") {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    }

    if (g === "NO" || g === "YES" || g === "HELLO") {
      const base = ensureSpace(trimRight(prev));
      return base + g + " ";
    }

    // Letters (A, B, C, etc.)
    if (prev.length === 0) return g;
    return prev + g;
  };

  useEffect(() => {
    const initAI = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      const nl = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO", numHands: 1
      });
      setLandmarker(nl);
    };
    initAI();
  }, []);

  const predict = () => {
    if (landmarker && webcamRef.current?.video?.readyState === 4) {
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      const results = landmarker.detectForVideo(video, performance.now());

      if (results.landmarks?.length > 0) {
        const lm = results.landmarks[0];
        draw(results.landmarks);
        
        // Update Motion Buffer (Track wrist)
        motionBuffer.current.unshift({ x: lm[0].x, y: lm[0].y, time: Date.now() });
        if (motionBuffer.current.length > 20) motionBuffer.current.pop();

        const rawSign = analyzeASL(lm);
        // Update last gesture time when a gesture is detected (not "...")
        if (rawSign !== "..." && rawSign !== "No Hand") {
          lastGestureTime.current = Date.now();
        }
        debounceAndType(rawSign);
      } else {
        setGesture("No Hand");
        gestureHistory.current = [];
      }
    }
    requestAnimationFrame(predict);
  };

  const analyzeASL = (lm) => {
    const dist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    
    const wrist = lm[0];
    const thumbT = lm[4], indexT = lm[8], middleT = lm[12], ringT = lm[16], pinkyT = lm[20];
    const indexK = lm[5], middleK = lm[9], ringK = lm[13], pinkyK = lm[17];
    
    const handScale = dist(wrist, middleK);
    const palmWidth = dist(indexK, pinkyK);
  
    // Finger Extension Logic
    const isUp = (t, k) => t.y < (k.y - handScale * 0.1);
    const f1 = isUp(indexT, indexK), f2 = isUp(middleT, middleK);
    const f3 = isUp(ringT, ringK), f4 = isUp(pinkyT, pinkyK);
  
    // --- 1. MOTION LOGIC (HELLO, YES, BACKSPACE) ---
    // Use a time window rather than "oldest sample" to reduce jitter sensitivity.
    let oldPos = wrist;
    for (let i = motionBuffer.current.length - 1; i >= 0; i--) {
      const p = motionBuffer.current[i];
      if (!p) continue;
      if (Date.now() - p.time >= MOTION_WINDOW_MS) {
        oldPos = p;
        break;
      }
      oldPos = p;
    }
    const dx = wrist.x - oldPos.x;
    const dy = wrist.y - oldPos.y;
    // Align motion direction with UI (Webcam is mirrored in view)
    const dxView = -dx; // right swipe in UI => dxView > 0
  
    // HELLO Requirement: Wide open hand (Thumb OUT) + deliberate horizontal movement
    const isThumbOut = dist(thumbT, indexK) > handScale * 0.6;
    const isHandWideOpen = f1 && f2 && f3 && f4 && isThumbOut;
  
    // BACKSPACE: Swipe left with open hand in UI
    if (isHandWideOpen && dxView < -0.14) return "BACKSPACE";

    // HELLO: Swipe right with open hand in UI (favor motion over static C)
    if (isHandWideOpen && dxView > 0.08) return "HELLO";
  
    // --- 2. GESTURE LOGIC (YES / SPACE / NO) ---
    
    // YES: Fist with vertical motion (check BEFORE static SPACE)
    const isFist = !f1 && !f2 && !f3 && !f4;
    if (isFist && Math.abs(dy) > 0.06) return "YES";
    
    // SPACE: Thumbs Up (static, no motion)
    if (isFist && thumbT.y < indexK.y - (handScale * 0.5) && Math.abs(dy) < 0.03) return "SPACE";
  
    // NO: Thumbs Down
    if (!f1 && !f2 && !f3 && !f4 && thumbT.y > wrist.y + (handScale * 0.2)) return "NO";
  
    // --- 3. STATIC ALPHABET LOGIC ---

    // O detection (avoid misclassifying as C): thumb-index tips close and fingers curved
    const thumbIndexGap = dist(thumbT, indexT);
    const indexMiddleGap = dist(indexT, middleT);
    const fingerLength = dist(middleT, middleK);
    if (f1 && f2 && f3 && f4) {
      // Loosen thresholds to better capture circular shape
      if (thumbIndexGap < handScale * 0.40 && indexMiddleGap < handScale * 0.55 && fingerLength < handScale * 0.85) {
        return "O";
      }
    }
  
    // C vs B Differentiation (make B less prevalent)
    if (f1 && f2 && f3 && f4) {
      const thumbToMiddle = dist(thumbT, middleT);
      const fingerLen = dist(middleT, middleK);
      // C: Thumb closer to tips + finger foreshortening
      if (thumbToMiddle < handScale * 0.85 && fingerLen < handScale * 0.65) return "C";
      // B: Only if fingers are very straight and thumb is far from tips
      if (fingerLen > handScale * 0.8 && thumbToMiddle > handScale * 0.9) return "B";
      // If ambiguous, prefer C
      return "C";
    }
  
    // V vs U (Spread vs Together)
    if (f1 && f2 && !f3 && !f4) {
      return dist(indexT, middleT) < palmWidth * 0.4 ? "U" : "V";
    }
  
    // Fists (A, S, T, E)
    if (!f1 && !f2 && !f3 && !f4) {
      if (thumbT.y > middleT.y) return "E";
      const thumbToPinky = dist(thumbT, pinkyK);
      // A: Thumb out to the side
      if (thumbToPinky > palmWidth * 1.2) return "A";
      // T: Thumb tucked behind index
      if (dist(thumbT, indexK) < handScale * 0.4) return "T";
      // S: Thumb over knuckles
      return "S";
    }
  
    // L, D
    if (f1 && !f2 && !f3 && !f4) {
      return dist(thumbT, indexK) > handScale * 0.7 ? "L" : "D";
    }
    
    // Y, I
    if (f4 && !f1 && !f2 && !f3) {
      return dist(thumbT, indexK) > handScale * 0.8 ? "Y" : "I";
    }
  
    return "...";
  };

  const debounceAndType = (sign) => {
    // 1. Update History
    gestureHistory.current.unshift(sign);
    if (gestureHistory.current.length > HISTORY_SIZE) gestureHistory.current.pop();

    // 2. Prefer words over letters via weighted + recency-biased voting.
    const counts = {};
    const scores = {};
    gestureHistory.current.forEach((g, idx) => {
      counts[g] = (counts[g] || 0) + 1;
      const meta = classifyGesture(g);
      const recency = 1 - (idx / Math.max(1, HISTORY_SIZE - 1)) * 0.6; // 1.0 (newest) -> 0.4 (oldest)
      scores[g] = (scores[g] || 0) + meta.baseWeight * recency;
    });

    const entries = Object.keys(scores).map((g) => {
      const meta = classifyGesture(g);
      const kindRank = meta.kind === "word" ? 3 : meta.kind === "command" ? 2 : meta.kind === "letter" ? 1 : 0;
      return { g, score: scores[g], count: counts[g] || 0, meta, kindRank };
    });

    const bestEntry = entries.reduce((a, b) => {
      if (b.score !== a.score) return b.score > a.score ? b : a;
      if (b.kindRank !== a.kindRank) return b.kindRank > a.kindRank ? b : a;
      return b.count > a.count ? b : a;
    }, entries[0] || { g: "...", score: 0, count: 0, meta: classifyGesture("..."), kindRank: 0 });

    const best = bestEntry.g;
    const bestMeta = bestEntry.meta;

    // 2.5 Build a live preview sequence of letters (even before commit)
    // Only append when we have a stable letter and it differs from the last pending character.
    if (bestMeta.kind === "letter" && bestEntry.count >= bestMeta.minCount) {
      setPendingLetters((prev) => {
        if (prev.endsWith(best)) return prev;
        return prev + best;
      });
    }

    // 3a. Immediate commit for words (avoid hold-time for motion-based gestures)
    const now = Date.now();
    const timeSinceLastTypeImmediate = now - lastTypedTime.current;
    // Only commit if it's a different gesture or enough time has passed
    if (bestMeta.kind === "word" && bestEntry.count >= bestMeta.typeMinCount && 
        (lastCommittedGesture.current !== best || timeSinceLastTypeImmediate > 2000)) {
      setSentence(prev => applyGestureToSentence(prev + pendingLettersRef.current, best));
      pendingLettersRef.current = "";
      setPendingLetters("");
      setGesture(best);
      lastTypedTime.current = now;
      letterStartTime.current = now;
      lastCommittedGesture.current = best;
      return; // Skip hold-based typing path
    }

    // 3b. Update the UI Label
    if (bestEntry.count >= bestMeta.minCount && best !== gesture) {
      setGesture(best);
      letterStartTime.current = Date.now();
    }

    // 4. Typing Logic (Triggers after TYPE_DELAY)
    const timeHeld = Date.now() - letterStartTime.current;
    const timeSinceLastType = Date.now() - lastTypedTime.current;

    const activeMeta = classifyGesture(gesture);
    const delay = activeMeta.typeDelayMs;
    const cooldown = delay + 500;

    const activeCount = gestureHistory.current.reduce((acc, g) => (g === gesture ? acc + 1 : acc), 0);
    const confidentEnoughToType = activeCount >= activeMeta.typeMinCount;

    if (gesture !== "..." && gesture !== "No Hand" && confidentEnoughToType && timeHeld > delay && timeSinceLastType > cooldown) {
      setSentence(prev => {
        const base = activeMeta.kind === "letter" ? prev : prev + pendingLettersRef.current;
        return applyGestureToSentence(base, gesture);
      });
      pendingLettersRef.current = "";
      setPendingLetters("");
      lastTypedTime.current = Date.now();
      lastCommittedGesture.current = gesture;
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

  // Pause detection: check every 500ms if 3 seconds have passed without gesture
  useEffect(() => {
    if (!onSentenceComplete) return; // Only run if callback is provided

    const pauseCheckInterval = setInterval(() => {
      const timeSinceLastGesture = Date.now() - lastGestureTime.current;
      const currentText = (sentence + pendingLettersRef.current).trim();
      
      if (timeSinceLastGesture >= PAUSE_THRESHOLD_MS && currentText.length > 0) {
        // Pause detected with text - trigger callback and reset
        onSentenceComplete(currentText);
        setSentence("");
        setPendingLetters("");
        pendingLettersRef.current = "";
        lastGestureTime.current = Date.now(); // Reset timer to prevent immediate re-trigger
      }
    }, 500); // Check every 500ms

    return () => clearInterval(pauseCheckInterval);
  }, [sentence, onSentenceComplete]);

  const sentencePreview = (() => {
    // Show committed sentence + a live sequence of stable letters only (no word preview to avoid flicker).
    const base = sentence + pendingLetters;
    if (!base && (!gesture || gesture === "..." || gesture === "No Hand")) {
      return "Start signing to build a sentence…";
    }
    return base;
  })();

  // Style based on compact mode
  const containerStyle = compact 
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#121212', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' };

  const videoContainerStyle = compact
    ? { position: 'relative', width: '100%', maxWidth: '640px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #333', marginBottom: '1rem' }
    : { position: 'relative', width: '100%', maxWidth: '720px', borderRadius: '15px', overflow: 'hidden', border: '3px solid #333' };

  const textContainerStyle = compact
    ? { width: '100%', maxWidth: '640px', background: '#f5f5f5', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }
    : { marginTop: '20px', width: '100%', maxWidth: '720px', background: '#1e1e1e', padding: '25px', borderRadius: '15px', border: '1px solid #444' };

  const textStyle = compact
    ? { color: '#333', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px', fontWeight: '500' }
    : { color: '#aaa', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' };

  const previewStyle = compact
    ? { fontSize: '18px', minHeight: '30px', margin: '0', fontWeight: '500', color: '#333' }
    : { fontSize: '32px', minHeight: '45px', margin: '0', fontWeight: '500' };

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
            <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#00FF7F', color: 'black', padding: '12px 35px', borderRadius: '50px', fontSize: '28px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,255,127,0.4)' }}>
              {gesture}
            </div>
          </>
        )}
      </div>
      <div style={textContainerStyle}>
        <p style={textStyle}>Current Sentence</p>
        <p style={previewStyle}>{sentencePreview}</p>
        {!compact && (
          <button onClick={() => { setSentence(""); setPendingLetters(""); }} style={{ marginTop: '20px', padding: '10px 25px', background: '#ff3b3b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Text</button>
        )}
      </div>
    </div>
  );
}