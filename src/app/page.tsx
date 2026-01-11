"use client";

import { useRef, useState, useEffect } from 'react';
import HandTracker from '../HandTracker';
import { TranscriptPanel } from '../ui/components/TranscriptPanel';
import { CameraPanel } from '../ui/components/CameraPanel';

async function playAudioInBrowser(audioBuffer: ArrayBuffer, volume: number = 100): Promise<void> {
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume / 100)); 

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

const VOICES = {
  female: { id: "kdmDKE6EkgrWrrykO9Qt", label: "Female" },
  male: { id: "iP95p4xoKVk53GoZ742B", label: "Male" },
};

export default function Home() {
  const [transcript, setTranscript] = useState<{ text: string; emotion: string; timestamp: number }[]>([]);
  const [voice, setVoice] = useState<"female" | "male">("female");
  const [volume, setVolume] = useState(100);
  
  // 1. ADD STATE FOR PROCESSING VISUALS
  const [isProcessing, setIsProcessing] = useState(false);

  const volumeRef = useRef(100);
  const pipelineInFlight = useRef(false);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const handleSentenceComplete = (text: string, emotion?: string) => {
    void (async () => {
      const raw = (text ?? "").trim();
      if (!raw) return;
      if (pipelineInFlight.current) return;
      pipelineInFlight.current = true;
      
      // 2. TRIGGER THINKING STATE (Do not add raw text to transcript)
      setIsProcessing(true);

      const emotionLabel = (emotion ?? "Neutral").trim();

      try {
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
          throw new Error("Failed to process with Cohere");
        }

        const refineData = await refineResponse.json();
        const refined = String(refineData?.text ?? "").trim();

        if (refined) {
          // 3. ADD ONLY THE AI RESULT
          setTranscript(prev => [
            ...prev,
            { text: refined, emotion: emotionLabel || "AI", timestamp: Date.now() }
          ]);

          const currentVolume = volumeRef.current;
          if (currentVolume > 0) {
            const speakResponse = await fetch("/api/speak", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: refined, emotion: emotionLabel, voiceId: VOICES[voice].id })
            });

            if (speakResponse.ok) {
              const audioBuffer = await speakResponse.arrayBuffer();
              await playAudioInBrowser(audioBuffer, currentVolume);
            }
          }
        }
      } catch (e) {
        console.error("Pipeline error:", e);
      } finally {
        // 4. STOP THINKING ANIMATION
        pipelineInFlight.current = false;
        setIsProcessing(false);
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
      overflow: 'hidden',
      paddingTop: '80px' 
    }}>
      
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
          <TranscriptPanel 
            history={transcript} 
            onClear={clearTranscript}
            voice={voice}
            onVoiceChange={setVoice}
            volume={volume}
            onVolumeChange={setVolume}
            isProcessing={isProcessing} // <--- PASS THE STATE PROP
          />
        </div>

      </div>
    </main>
  );
}