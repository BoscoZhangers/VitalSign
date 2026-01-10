"use client";

import { useState } from "react";
import { speakText } from "@/src/modules/elevenlabs";

export default function VoicePage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await speakText(text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", fontSize: "2rem", fontWeight: "bold" }}>
        Voice
      </h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Enter text to speak..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            opacity: isLoading ? 0.6 : 1,
          }}
        />
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
          disabled={isLoading || !text.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: isLoading || !text.trim() ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !text.trim() ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Speaking..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

