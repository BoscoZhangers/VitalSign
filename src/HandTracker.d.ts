import React from 'react';

interface HandTrackerProps {
  onSentenceComplete?: (text: string, emotion?: string) => void;
  compact?: boolean;
}

declare const HandTracker: React.FC<HandTrackerProps>;
export default HandTracker;
