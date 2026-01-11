"use client";

import { useRef, useState } from 'react';
import HandTracker from '../HandTracker';
import { TranscriptPanel } from '../ui/components/TranscriptPanel';
import { CameraPanel } from '../ui/components/CameraPanel';

async function playAudioInBrowser(audioBuffer: ArrayBuffer): Promise<void> {
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    audio.play().catch(reject);
  });
}

export default function Home() {
  // Store the history of translated sentences
  const [transcript, setTranscript] = useState<{ text: string; emotion: string; timestamp: number }[]>([]);
  const pipelineInFlight = useRef(false);

  // Callback when HandTracker finishes a sentence
  const handleSentenceComplete = (text: string, emotion?: string) => {
    void (async () => {
      const raw = (text ?? "").trim();
      if (!raw) return;
      if (pipelineInFlight.current) return;
      pipelineInFlight.current = true;

      const emotionLabel = (emotion ?? "Neutral").trim();

      // 1) Save + append raw dialogue chunk to transcript
      setTranscript(prev => [
        ...prev,
        { text: raw, emotion: emotionLabel, timestamp: Date.now() }
      ]);

      try {
        // 2) Process with Gemini (refine into natural, speakable text)
        const basePrompt = [
          'You are a helpful assistant that rewrites sign-language translations into a clear, natural sentence.',
          'Return ONLY plain text. No markdown, no code blocks, no extra commentary.',
          'Keep it brief and faithful to the original meaning.'
        ].join('\n');

        const fullPrompt = `${basePrompt}\n\nRaw Text: ${JSON.stringify(raw)}${emotionLabel ? `\nDetected Emotion: ${emotionLabel}` : ''}`;
        const geminiResponse = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt })
        });

        if (!geminiResponse.ok) {
          const err = await geminiResponse.json().catch(() => ({}));
          throw new Error(err?.error || "Failed to process with Gemini");
        }

        const geminiData = await geminiResponse.json();
        const refined = String(geminiData?.text ?? "").trim();

        if (refined) {
          // 3) Append the processed text as an AI/system turn
          setTranscript(prev => [
            ...prev,
            { text: refined, emotion: emotionLabel || "AI", timestamp: Date.now() }
          ]);

          // 4) Speak it out with ElevenLabs (server-side)
          const speakResponse = await fetch("/api/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: refined, emotion: emotionLabel })
          });

          if (!speakResponse.ok) {
            const detail = await speakResponse.text().catch(() => "");
            throw new Error(detail || "Failed to speak text");
          }

          const audioBuffer = await speakResponse.arrayBuffer();
          await playAudioInBrowser(audioBuffer);
        }
      } catch (e) {
        console.error("Pipeline error:", e);
      } finally {
        pipelineInFlight.current = false;
      }
    })();
  };

  const clearTranscript = () => setTranscript([]);

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* HEADER */}
      <header style={{ 
        padding: '20px 40px', 
        borderBottom: '1px solid #334155', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: 12, height: 12, background: '#00FF7F', borderRadius: '50%', boxShadow: '0 0 10px #00FF7F' }} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', letterSpacing: '-0.5px' }}>VitalSign AI</h1>
        </div>
        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
          System Operational
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', // Split: Camera (Auto) | Transcript (Fixed)
        gap: '20px', 
        padding: '20px',
        height: 'calc(100vh - 80px)' 
      }}>
        
        {/* LEFT: CAMERA FEED */}
        <div style={{ 
          background: '#1e293b', 
          borderRadius: '16px', 
          border: '1px solid #334155', 
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <CameraPanel>
            {/* We pass compact=true so HandTracker fits inside this panel nicely */}
            <HandTracker 
              onSentenceComplete={handleSentenceComplete} 
              compact={true} 
            />
          </CameraPanel>
        </div>

        {/* RIGHT: TRANSCRIPT HISTORY */}
        <div style={{ 
          background: '#1e293b', 
          borderRadius: '16px', 
          border: '1px solid #334155', 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0
        }}>
          <TranscriptPanel history={transcript} onClear={clearTranscript} />
        </div>

      </div>
    </main>
  );
}