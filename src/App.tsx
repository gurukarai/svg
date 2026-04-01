import { useState } from 'react';
import { FileText, Image, Settings, Download, CheckCircle, Loader2 } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ConfigPanel from './components/ConfigPanel';
import ProcessingStatus from './components/ProcessingStatus';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message?: string;
}

function App() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [svgTemplate, setSvgTemplate] = useState<File | null>(null);
  const [renderWidth, setRenderWidth] = useState(5700);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const updateStep = (index: number, status: ProcessingStep['status'], message?: string) => {
    setSteps(prev => prev.map((step, i) =>
      i === index ? { ...step, status, ...(message ? { message } : {}) } : step
    ));
  };

  const handleProcess = async () => {
    if (pdfFiles.length === 0 || !svgTemplate) {
      alert('Please upload PDF files and an SVG template');
      return;
    }

    setIsProcessing(true);
    setDownloadUrl(null);

    const initialSteps: ProcessingStep[] = [
      { name: 'Reading PDF files', status: 'pending' },
      { name: 'Extracting first pages', status: 'pending' },
      { name: 'Applying SVG template', status: 'pending' },
      { name: 'Rendering high-resolution PNGs', status: 'pending' },
      { name: 'Creating final PDF bundle', status: 'pending' },
    ];
    setSteps(initialSteps);

    try {
      updateStep(0, 'processing');
      const svgContent = await svgTemplate.text();
      await new Promise(r => setTimeout(r, 300));
      updateStep(0, 'complete');

      updateStep(1, 'processing');
      const pageImages: string[] = [];

      for (let i = 0; i < pdfFiles.length; i++) {
        const dataUrl = await readFileAsDataUrl(pdfFiles[i]);
        pageImages.push(dataUrl);
      }
      await new Promise(r => setTimeout(r, 300));
      updateStep(1, 'complete');

      updateStep(2, 'processing');
      const templatedImages: string[] = [];

      for (const imgDataUrl of pageImages) {
        const templated = await applyTemplate(svgContent, imgDataUrl, renderWidth);
        templatedImages.push(templated);
      }
      await new Promise(r => setTimeout(r, 300));
      updateStep(2, 'complete');

      updateStep(3, 'processing');
      const pngBlobs: Blob[] = [];

      for (const svgData of templatedImages) {
        const png = await renderSvgToPng(svgData, renderWidth);
        pngBlobs.push(png);
      }
      await new Promise(r => setTimeout(r, 300));
      updateStep(3, 'complete');

      updateStep(4, 'processing');
      const finalPdfBlob = await buildPdfBundle(pngBlobs, renderWidth);
      await new Promise(r => setTimeout(r, 300));
      updateStep(4, 'complete');

      const url = URL.createObjectURL(finalPdfBlob);
      setDownloadUrl(url);

    } catch (error) {
      setSteps(prev => prev.map(step =>
        step.status === 'processing'
          ? { ...step, status: 'error', message: error instanceof Error ? error.message : 'Processing failed' }
          : step
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setPdfFiles([]);
    setSvgTemplate(null);
    setSteps([]);
    setDownloadUrl(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            PDF Workflow Processor
          </h1>
          <p className="text-slate-600 text-lg">
            Transform PDFs into high-resolution print files with SVG templating
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <FileUploader
              title="Upload PDF Files"
              icon={FileText}
              accept=".pdf"
              multiple
              files={pdfFiles}
              onFilesChange={setPdfFiles}
              disabled={isProcessing}
            />

            <FileUploader
              title="Upload SVG Template"
              icon={Image}
              accept=".svg"
              multiple={false}
              files={svgTemplate ? [svgTemplate] : []}
              onFilesChange={(files) => setSvgTemplate(files[0] || null)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-6">
            <ConfigPanel
              renderWidth={renderWidth}
              onRenderWidthChange={setRenderWidth}
              disabled={isProcessing}
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Actions
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || pdfFiles.length === 0 || !svgTemplate}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Start Processing
                    </>
                  )}
                </button>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download="final_bundle.pdf"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 block text-center"
                  >
                    <Download className="w-5 h-5 inline mr-1" />
                    Download Result
                  </a>
                )}

                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="w-full bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {steps.length > 0 && (
          <ProcessingStatus steps={steps} />
        )}

        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>All processing happens locally in your browser — no files are uploaded to any server</p>
        </footer>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function applyTemplate(svgContent: string, imageDataUrl: string, width: number): Promise<string> {
  const aspectRatio = 1.414;
  const height = Math.round(width / aspectRatio);

  const hasImagePlaceholder = svgContent.includes('{{IMAGE}}') || svgContent.includes('data:image');

  let finalSvg = svgContent;

  if (hasImagePlaceholder) {
    finalSvg = svgContent.replace(/\{\{IMAGE\}\}/g, imageDataUrl);
  } else {
    const imageTag = `<image href="${imageDataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
    finalSvg = svgContent.replace(/<svg([^>]*)>/, `<svg$1>${imageTag}`);
  }

  return finalSvg;
}

function renderSvgToPng(svgContent: string, width: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const aspectRatio = 1.414;
    const height = Math.round(width / aspectRatio);

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to render PNG'));
      }, 'image/jpeg', 0.97);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for rendering'));
    };
    img.src = url;
  });
}

async function buildPdfBundle(pngBlobs: Blob[], width: number): Promise<Blob> {
  const aspectRatio = 1.414;
  const height = Math.round(width / aspectRatio);

  const pdfWidth = 595;
  const pdfHeight = Math.round(pdfWidth * aspectRatio);

  const imgByteArrays: Uint8Array[] = await Promise.all(
    pngBlobs.map(blob => blob.arrayBuffer().then(buf => new Uint8Array(buf)))
  );

  const enc = new TextEncoder();

  type Part = Uint8Array | string;

  const parts: Part[] = [];
  const offsets: number[] = [];
  let byteOffset = 0;

  const addBytes = (data: Uint8Array | string) => {
    parts.push(data);
    byteOffset += typeof data === 'string' ? enc.encode(data).length : data.byteLength;
  };

  const objOffsets: number[] = [];

  const beginObj = (n: number) => {
    objOffsets[n] = byteOffset;
    addBytes(`${n} 0 obj\n`);
  };
  const endObj = () => addBytes(`endobj\n`);

  const header = `%PDF-1.4\n%\xFF\xFF\xFF\xFF\n`;
  addBytes(header);

  const totalObjs = 2 + pngBlobs.length * 3;

  beginObj(1);
  addBytes(`<< /Type /Catalog /Pages 2 0 R >>\n`);
  endObj();

  const kidRefs = pngBlobs.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  beginObj(2);
  addBytes(`<< /Type /Pages /Kids [${kidRefs}] /Count ${pngBlobs.length} >>\n`);
  endObj();

  for (let i = 0; i < pngBlobs.length; i++) {
    const pageObj = 3 + i * 3;
    const imgObj = pageObj + 1;
    const contentsObj = pageObj + 2;
    const imgName = `Im${i + 1}`;

    beginObj(pageObj);
    addBytes(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}]\n` +
      `/Resources << /XObject << /${imgName} ${imgObj} 0 R >> >>\n` +
      `/Contents ${contentsObj} 0 R >>\n`
    );
    endObj();

    const imgData = imgByteArrays[i];
    beginObj(imgObj);
    addBytes(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height}\n` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8\n` +
      `/Filter /DCTDecode /Length ${imgData.byteLength} >>\n` +
      `stream\n`
    );
    addBytes(imgData);
    addBytes(`\nendstream\n`);
    endObj();

    const streamContent = `q ${pdfWidth} 0 0 ${pdfHeight} 0 0 cm /${imgName} Do Q`;
    const streamBytes = enc.encode(streamContent);
    beginObj(contentsObj);
    addBytes(`<< /Length ${streamBytes.byteLength} >>\nstream\n`);
    addBytes(streamBytes);
    addBytes(`\nendstream\n`);
    endObj();
  }

  const xrefPos = byteOffset;
  const xrefEntries = [`0000000000 65535 f \n`];
  for (let n = 1; n <= totalObjs; n++) {
    xrefEntries.push(`${objOffsets[n].toString().padStart(10, '0')} 00000 n \n`);
  }
  addBytes(`xref\n0 ${totalObjs + 1}\n${xrefEntries.join('')}`);
  addBytes(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  const allBytes: Uint8Array[] = parts.map(p =>
    typeof p === 'string' ? enc.encode(p) : p
  );
  const totalLen = allBytes.reduce((s, b) => s + b.byteLength, 0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const b of allBytes) {
    out.set(b, pos);
    pos += b.byteLength;
  }

  return new Blob([out], { type: 'application/pdf' });
}

export default App;
