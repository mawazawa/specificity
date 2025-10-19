import { useState, useEffect } from "react";

interface NeumorphicSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const NeumorphicSlider = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 1, 
  step = 0.05,
  className = ""
}: NeumorphicSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseUp = () => setIsDragging(false);
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  return (
    <div 
      className={`neumorphic-slider ${isDragging ? 'active' : ''} ${className}`}
      style={{ '--val': value, '--pos': `${percentage}%` } as React.CSSProperties}
    >
      <input
        type="range"
        value={value}
        onChange={handleChange}
        onMouseDown={() => setIsDragging(true)}
        min={min}
        max={max}
        step={step}
        className="slider-input"
      />
    </div>
  );
};
