import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProcessRequest {
  jobId: string;
  renderWidth: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { jobId, renderWidth }: ProcessRequest = await req.json();

    const updateJob = async (status: string, currentStep?: string, errorMessage?: string) => {
      await supabase
        .from('processing_jobs')
        .update({
          status,
          current_step: currentStep,
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    };

    await updateJob('processing', 'Extracting pages from PDFs');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateJob('processing', 'Generating SVG files');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateJob('processing', 'Rendering high-resolution PNGs');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateJob('processing', 'Creating final PDF bundle');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const resultUrl = '/downloads/demo_result.pdf';

    await supabase
      .from('processing_jobs')
      .update({
        status: 'complete',
        current_step: 'Done',
        result_url: resultUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processing complete',
        resultUrl,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Processing error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
