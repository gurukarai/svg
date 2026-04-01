import { MoveHorizontal, MoveVertical } from 'lucide-react';

interface PositionControlsProps {
  offsetX: number;
  offsetY: number;
  onOffsetXChange: (v: number) => void;
  onOffsetYChange: (v: number) => void;
  disabled?: boolean;
}

export default function PositionControls({
  offsetX,
  offsetY,
  onOffsetXChange,
  onOffsetYChange,
  disabled = false,
}: PositionControlsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4">PDF Page Position</h3>
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <MoveHorizontal className="w-4 h-4" />
            Horizontal offset (mm)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-50}
              max={50}
              step={0.5}
              value={offsetX}
              onChange={e => onOffsetXChange(Number(e.target.value))}
              disabled={disabled}
              className="flex-1 accent-blue-600 disabled:opacity-50"
            />
            <input
              type="number"
              min={-50}
              max={50}
              step={0.5}
              value={offsetX}
              onChange={e => onOffsetXChange(Number(e.target.value))}
              disabled={disabled}
              className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-center"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Negative = move left &nbsp;|&nbsp; Positive = move right
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <MoveVertical className="w-4 h-4" />
            Vertical offset (mm)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-50}
              max={50}
              step={0.5}
              value={offsetY}
              onChange={e => onOffsetYChange(Number(e.target.value))}
              disabled={disabled}
              className="flex-1 accent-blue-600 disabled:opacity-50"
            />
            <input
              type="number"
              min={-50}
              max={50}
              step={0.5}
              value={offsetY}
              onChange={e => onOffsetYChange(Number(e.target.value))}
              disabled={disabled}
              className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-center"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Negative = move up &nbsp;|&nbsp; Positive = move down
          </p>
        </div>
      </div>
    </div>
  );
}
