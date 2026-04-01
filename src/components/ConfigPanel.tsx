import { Settings } from 'lucide-react';

interface ConfigPanelProps {
  renderWidth: number;
  onRenderWidthChange: (width: number) => void;
  disabled?: boolean;
}

export default function ConfigPanel({
  renderWidth,
  onRenderWidthChange,
  disabled = false,
}: ConfigPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Configuration
      </h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="render-width" className="block text-sm font-medium text-slate-700 mb-2">
            Render Width (px)
          </label>
          <input
            id="render-width"
            type="number"
            value={renderWidth}
            onChange={(e) => onRenderWidthChange(Number(e.target.value))}
            disabled={disabled}
            min={100}
            max={10000}
            step={100}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-500">
            Width for high-resolution PNG rendering
          </p>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Workflow Steps</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>1. Extract first page from each PDF</li>
            <li>2. Apply SVG template to each image</li>
            <li>3. Render to high-resolution PNGs</li>
            <li>4. Merge into final PDF bundle</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
