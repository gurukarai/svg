import { useState } from 'react';
import { FileText, Image, Settings, Download, CheckCircle, Loader2, LogOut } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ConfigPanel from './components/ConfigPanel';
import ProcessingStatus from './components/ProcessingStatus';
import { supabase } from './lib/supabase';
import { useAuth } from './components/AuthProvider';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message?: string;
}

function App() {
  const { session } = useAuth();
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [svgTemplate, setSvgTemplate] = useState<File | null>(null);
  const [renderWidth, setRenderWidth] = useState(5700);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleProcess = async () => {
    if (pdfFiles.length === 0 || !svgTemplate) {
      alert('Please upload PDF files and an SVG template');
      return;
    }

    setIsProcessing(true);
    setDownloadUrl(null);

    const processingSteps: ProcessingStep[] = [
      { name: 'Uploading files', status: 'pending' },
      { name: 'Extracting pages from PDFs', status: 'pending' },
      { name: 'Generating SVG files', status: 'pending' },
      { name: 'Rendering high-resolution PNGs', status: 'pending' },
      { name: 'Creating final PDF bundle', status: 'pending' },
    ];

    setSteps(processingSteps);

    try {
      setSteps(prev => prev.map((step, idx) =>
        idx === 0 ? { ...step, status: 'processing' } : step
      ));

      const { data: jobData, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          render_width: renderWidth,
          pdf_count: pdfFiles.length,
          status: 'pending',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      setSteps(prev => prev.map((step, idx) =>
        idx === 0 ? { ...step, status: 'complete' } : step
      ));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to process files');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-pdf-workflow`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobData.id,
          renderWidth,
        }),
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const pollJob = async () => {
        const { data: job } = await supabase
          .from('processing_jobs')
          .select('*')
          .eq('id', jobData.id)
          .single();

        if (!job) return;

        const stepMap: { [key: string]: number } = {
          'Extracting pages from PDFs': 1,
          'Generating SVG files': 2,
          'Rendering high-resolution PNGs': 3,
          'Creating final PDF bundle': 4,
        };

        if (job.current_step && stepMap[job.current_step] !== undefined) {
          const stepIndex = stepMap[job.current_step];
          setSteps(prev => prev.map((step, idx) =>
            idx <= stepIndex ? { ...step, status: idx === stepIndex ? 'processing' : 'complete' } : step
          ));
        }

        if (job.status === 'complete') {
          setSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
          setDownloadUrl(job.result_url || null);
          return true;
        }

        if (job.status === 'error') {
          setSteps(prev => prev.map(step =>
            step.status === 'processing' ? { ...step, status: 'error', message: job.error_message || 'Processing failed' } : step
          ));
          return true;
        }

        return false;
      };

      const maxAttempts = 30;
      let attempts = 0;

      while (attempts < maxAttempts) {
        const isDone = await pollJob();
        if (isDone) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

    } catch (error) {
      console.error('Processing error:', error);
      setSteps(prev => prev.map(step =>
        step.status === 'processing' ? { ...step, status: 'error', message: error instanceof Error ? error.message : 'Processing failed' } : step
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFiles([]);
    setSvgTemplate(null);
    setSteps([]);
    setDownloadUrl(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{session?.user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

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
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
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
          <p>Automated workflow for PDF extraction, SVG templating, and high-resolution rendering</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
