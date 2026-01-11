import React from 'react';

interface HandTrackerProps {
  onSentenceComplete?: (text: string) => void;
  compact?: boolean;
}

declare const HandTracker: React.FC<HandTrackerProps>;
export default HandTracker;
