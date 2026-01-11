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
        // 2) Process with Cohere (refine into natural, speakable text)
        const basePrompt = [
          'You are a helpful assistant that rewrites sign-language translations into a clear, natural sentence.',
          'Return ONLY plain text. No markdown, no code blocks, no extra commentary.',
          'Keep it brief and faithful to the original meaning.'
        ].join('\n');

        const fullPrompt = `${basePrompt}\n\nRaw Text: ${JSON.stringify(raw)}${emotionLabel ? `\nDetected Emotion: ${emotionLabel}` : ''}`;
        const refineResponse = await fetch("/api/cohere", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt })
        });

        if (!refineResponse.ok) {
          const err = await refineResponse.json().catch(() => ({}));
          const message =
            typeof err?.error === "string" && err.error.trim()
              ? err.error
              : "Failed to process with Cohere";
          const details = typeof err?.details === "string" ? err.details.trim() : "";
          throw new Error(details ? `${message}: ${details}` : message);
        }

        const refineData = await refineResponse.json();
        const refined = String(refineData?.text ?? "").trim();

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
      height: '100vh',
      background: 'var(--vs-bg)', 
      color: 'var(--vs-text)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* HEADER */}
      <header style={{ 
        padding: '16px 32px', 
        borderBottom: '1px solid var(--vs-border)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'var(--vs-surface)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 10, height: 10, background: 'var(--vs-accent)', borderRadius: '50%', boxShadow: '0 0 12px var(--vs-accent), 0 0 4px var(--vs-accent)' }} />
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', letterSpacing: '-0.75px' }}>VitalSign</h1>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--vs-muted)', fontWeight: '500' }}>
          System Operational
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: '1fr 420px', 
        gap: '24px', 
        padding: '24px',
        minHeight: 0
      }}>
        
        {/* LEFT: CAMERA FEED */}
        <div style={{ 
          background: 'var(--vs-surface)', 
          borderRadius: '20px', 
          border: '1px solid var(--vs-border)', 
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
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
          background: 'var(--vs-surface)', 
          borderRadius: '20px', 
          border: '1px solid var(--vs-border)', 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}>
          <TranscriptPanel history={transcript} onClear={clearTranscript} />
        </div>

      </div>
    </main>
  );
}