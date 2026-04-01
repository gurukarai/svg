import { useRef } from 'react';
import { Upload, X, Video as LucideIcon } from 'lucide-react';

interface FileUploaderProps {
  title: string;
  icon: LucideIcon;
  accept: string;
  multiple: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileUploader({
  title,
  icon: Icon,
  accept,
  multiple,
  files,
  onFilesChange,
  disabled = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (multiple) {
      onFilesChange([...files, ...selectedFiles]);
    } else {
      onFilesChange(selectedFiles);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.name.toLowerCase().endsWith(accept.replace('.', ''))
    );

    if (multiple) {
      onFilesChange([...files, ...droppedFiles]);
    } else {
      onFilesChange(droppedFiles.slice(0, 1));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </h3>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          disabled
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-3 ${disabled ? 'text-slate-300' : 'text-slate-400'}`} />
        <p className="text-slate-600 mb-1">
          {multiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
        </p>
        <p className="text-sm text-slate-400">Accepts {accept} files</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-slate-700 truncate flex-1">
                  {file.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  disabled={disabled}
                  className="ml-2 text-slate-400 hover:text-red-500 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
