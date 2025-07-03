import React from "react";

interface Props {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectStep: (step: number) => void;
}

export default function DiagramControls({
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onSelectStep,
}: Props) {
  return (
    <div className="bg-gray-800 p-2 flex justify-between items-center">
      <div>
        <button onClick={onPrev} disabled={currentStep === 0}>Prev</button>
        <button onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={onNext} disabled={currentStep === totalSteps - 1}>Next</button>
      </div>
      <div>
        Step {currentStep + 1} of {totalSteps}
      </div>
      <input
        type="range"
        min="0"
        max={totalSteps - 1}
        value={currentStep}
        onChange={(e) => onSelectStep(Number(e.target.value))}
      />
    </div>
  );
}
