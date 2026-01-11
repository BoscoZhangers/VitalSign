"use client";

import { useState } from "react";
import { speakText } from "@/src/modules/elevenlabs";
import HandTracker from "@/src/HandTracker";

const VOICES = {
  girl: { id: "kdmDKE6EkgrWrrykO9Qt", label: "Girl Voice" },
  guy: { id: "iP95p4xoKVk53GoZ742B", label: "Guy Voice" },
};

export default function VoicePage() {
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState("");
  const [voice, setVoice] = useState<"girl" | "guy">("girl");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refinedText, setRefinedText] = useState<string | null>(null);

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRefinedText(null);

    try {
      // Build prompt and call Gemini API to refine
      const basePrompt = 'You are an expressive assistant. You MUST begin every single sentence with an emotion or action tag in square brackets that describes your current tone. Examples: [laughing], [hesitant], [regretful], [excited]. Ensure the tag matches the context of the sentence that follows. Do not add any additional text or commentary besides the [text]. Return ONLY plain text, no markdown, no code blocks, no formatting - just the text itself.';
      const fullPrompt = `${basePrompt}\n\nText to process: "${text.trim()}"${emotion ? `\nEmotion/Tone: ${emotion}` : ''}`;
      
      const geminiResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        throw new Error(errorData.error || "Failed to refine text with Gemini");
      }

      const geminiData = await geminiResponse.json();
      const refined = geminiData.text.trim();
      
      // Show the refined text for confirmation
      setRefinedText(refined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!refinedText) return;

    setIsSpeaking(true);
    setError(null);

    try {
      // Speak the confirmed refined text using ElevenLabs with selected voice
      const voiceId = VOICES[voice].id;
      await speakText(refinedText, voiceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while speaking");
      console.error("Error:", err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleSentenceComplete = (completedText: string) => {
    // When pause detected, populate the text input with completed sign language text
    setText(completedText);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", fontSize: "2rem", fontWeight: "bold" }}>
        Voice
      </h1>
      
      {/* HandTracker for sign language input */}
      <div style={{ marginBottom: "2rem" }}>
        <HandTracker onSentenceComplete={handleSentenceComplete} compact={true} />
      </div>

      <form onSubmit={handleRefine} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Enter text to speak..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading || isSpeaking}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            opacity: isLoading || isSpeaking ? 0.6 : 1,
          }}
        />
        <input
          type="text"
          placeholder="Enter tone/emotion (e.g., Urgent, Happy, Neutral)..."
          value={emotion}
          onChange={(e) => setEmotion(e.target.value)}
          disabled={isLoading || isSpeaking}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            opacity: isLoading || isSpeaking ? 0.6 : 1,
          }}
        />
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label style={{ fontSize: "1rem", fontWeight: "500" }}>Voice:</label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: isLoading || isSpeaking ? "not-allowed" : "pointer" }}>
              <input
                type="radio"
                name="voice"
                value="girl"
                checked={voice === "girl"}
                onChange={(e) => setVoice(e.target.value as "girl" | "guy")}
                disabled={isLoading || isSpeaking}
              />
              <span style={{ opacity: isLoading || isSpeaking ? 0.6 : 1 }}>Girl</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: isLoading || isSpeaking ? "not-allowed" : "pointer" }}>
              <input
                type="radio"
                name="voice"
                value="guy"
                checked={voice === "guy"}
                onChange={(e) => setVoice(e.target.value as "girl" | "guy")}
                disabled={isLoading || isSpeaking}
              />
              <span style={{ opacity: isLoading || isSpeaking ? 0.6 : 1 }}>Guy</span>
            </label>
          </div>
        </div>
        {error && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "4px",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading || isSpeaking || !text.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: isLoading || isSpeaking || !text.trim() ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || isSpeaking || !text.trim() ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Refining..." : "Refine with Gemini"}
        </button>
      </form>

      {refinedText && (
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#e3f2fd",
              borderRadius: "4px",
              fontSize: "1rem",
              border: "2px solid #2196f3",
            }}
          >
            <div style={{ marginBottom: "0.5rem", fontWeight: "bold", color: "#1976d2" }}>
              Refined Text:
            </div>
            <div style={{ color: "#333" }}>{refinedText}</div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handleSpeak}
              disabled={isSpeaking || !refinedText}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                backgroundColor: isSpeaking || !refinedText ? "#ccc" : "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSpeaking || !refinedText ? "not-allowed" : "pointer",
                flex: 1,
              }}
            >
              {isSpeaking ? "Speaking..." : "✓ Confirm & Speak"}
            </button>
            <button
              onClick={() => {
                setRefinedText(null);
                setError(null);
              }}
              disabled={isSpeaking}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                backgroundColor: isSpeaking ? "#ccc" : "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSpeaking ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

