import { CSSProperties } from 'react';
import { ProgressBar, ProgressBarProps } from 'react-aria-components';

const center = 16;
const strokeWidth = 4;
const r = 16 - strokeWidth;
const circumference = 2 * r * Math.PI;

interface CircleProgressProps extends ProgressBarProps {}

export function CircleProgress(props: CircleProgressProps) {
  return (
    <ProgressBar
      {...props}
      aria-label="Loading…"
      className="circle-progress text-pink-700 w-8 h-8"
    >
      {({ percentage = 0 }) => (
        <>
          <svg
            viewBox="0 0 32 32"
            fill="none"
            strokeWidth={strokeWidth}
            style={{ '--circumference': circumference } as CSSProperties}
          >
            <circle
              cx={center}
              cy={center}
              r={r - (strokeWidth / 2 - 0.25)}
              stroke="currentColor"
              strokeWidth={0.5}
            />
            <circle
              cx={center}
              cy={center}
              r={r + (strokeWidth / 2 - 0.25)}
              stroke="currentColor"
              strokeWidth={0.5}
            />
            <circle
              className="fill"
              cx={center}
              cy={center}
              r={r}
              stroke="currentColor"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={
                circumference - (percentage / 100) * circumference
              }
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
          </svg>
        </>
      )}
    </ProgressBar>
  );
}
