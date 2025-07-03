import { ChevronLeftIcon, PauseIcon, PlayIcon, ChevronRightIcon } from "lucide-react";

interface DiagramControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  onStepSelect: (step: number) => void; // Add this prop
}

export default function DiagramControls({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onPlay,
  onPause,
  isPlaying,
  onStepSelect // Add this prop
}: DiagramControlsProps) {
  
  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="p-2 bg-gray-700 rounded-full disabled:opacity-50"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-2 bg-blue-600 rounded-full"
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={onNext}
            disabled={currentStep === totalSteps - 1}
            className="p-2 bg-gray-700 rounded-full disabled:opacity-50"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-sm">
          Step {currentStep + 1} of {totalSteps}
        </div>
        
        <div className="w-48">
          <input
            type="range"
            min="0"
            max={totalSteps - 1}
            value={currentStep}
            onChange={(e) => onStepSelect(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}