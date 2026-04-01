import { Settings } from 'lucide-react';
import { PAPER_SIZES, Orientation, getCanvasDimensions } from '../lib/paperSizes';

interface ConfigPanelProps {
  paperSizeId: string;
  orientation: Orientation;
  onPaperSizeChange: (id: string) => void;
  onOrientationChange: (orientation: Orientation) => void;
  disabled?: boolean;
}

export default function ConfigPanel({
  paperSizeId,
  orientation,
  onPaperSizeChange,
  onOrientationChange,
  disabled = false,
}: ConfigPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Output Paper Size
      </h3>

      <div className="flex gap-2 mb-4">
        {(['landscape', 'portrait'] as Orientation[]).map(o => (
          <button
            key={o}
            onClick={() => !disabled && onOrientationChange(o)}
            disabled={disabled}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
              orientation === o
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {o === 'landscape' ? 'Landscape' : 'Portrait'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {PAPER_SIZES.map(size => {
          const dims = getCanvasDimensions(size, orientation);
          return (
            <label
              key={size.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                paperSizeId === size.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="paper-size"
                value={size.id}
                checked={paperSizeId === size.id}
                onChange={() => !disabled && onPaperSizeChange(size.id)}
                disabled={disabled}
                className="accent-blue-600"
              />
              <div>
                <p className={`text-sm font-medium ${paperSizeId === size.id ? 'text-blue-700' : 'text-slate-700'}`}>
                  {size.label}
                </p>
                <p className="text-xs text-slate-400">
                  {dims.widthMm} × {dims.heightMm} mm
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
