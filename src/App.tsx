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

    const img = new Image();
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
      }, 'image/png');
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

  const dataUrls: string[] = await Promise.all(
    pngBlobs.map(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }))
  );

  const pages = dataUrls.map((dataUrl, i) => {
    const base64 = dataUrl.split(',')[1];
    const streamData = `/Page${i + 1}Img Do`;

    return {
      base64,
      streamData,
    };
  });

  const objectLines: string[] = [];
  const offsets: number[] = [];
  let byteOffset = 0;

  const addObject = (content: string): number => {
    const objNum = objectLines.length + 1;
    const line = `${objNum} 0 obj\n${content}\nendobj\n`;
    offsets.push(byteOffset);
    byteOffset += new TextEncoder().encode(line).length;
    objectLines.push(line);
    return objNum;
  };

  const catalogObj = addObject(`<< /Type /Catalog /Pages 2 0 R >>`);
  const pagesObj = addObject(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${pages.length} >>`);

  for (let i = 0; i < pages.length; i++) {
    const imgObjNum = 3 + i * 3 + 1;
    const contentsObjNum = 3 + i * 3 + 2;

    addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /Page${i + 1}Img ${imgObjNum} 0 R >> >> /Contents ${contentsObjNum} 0 R >>`
    );

    const imgBytes = Uint8Array.from(atob(pages[i].base64), c => c.charCodeAt(0));
    addObject(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n${pages[i].base64}\nendstream`
    );

    const streamContent = `q ${pdfWidth} 0 0 ${pdfHeight} 0 0 cm /Page${i + 1}Img Do Q`;
    const streamBytes = new TextEncoder().encode(streamContent);
    addObject(
      `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream`
    );
  }

  const xrefOffset = byteOffset;
  const header = `%PDF-1.4\n`;
  const body = objectLines.join('');
  const xref = `xref\n0 ${objectLines.length + 1}\n0000000000 65535 f \n${offsets.map(o => (o + header.length).toString().padStart(10, '0') + ' 00000 n ').join('\n')}\n`;
  const trailer = `trailer\n<< /Size ${objectLines.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset + header.length + body.length}\n%%EOF`;

  const pdfText = header + body + xref + trailer;
  return new Blob([pdfText], { type: 'application/pdf' });
}

export default App;
