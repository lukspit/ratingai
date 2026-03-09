import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Buscando análises...");
  const { data: analyses } = await supabase.from('tributario_analyses').select('id, report_markdown').not('report_markdown', 'is', null);

  for (const a of analyses || []) {
    if (a.report_markdown && a.report_markdown.includes('```markdown')) {
      let clean = a.report_markdown.trim();
      if (clean.startsWith('```markdown')) clean = clean.replace(/^```markdown\n?/i, '');
      if (clean.endsWith('```')) clean = clean.replace(/```$/i, '');
      clean = clean.trim();

      await supabase.from('tributario_analyses').update({ report_markdown: clean }).eq('id', a.id);
      console.log(`Análise ${a.id} corrigida.`);
    }
  }
  console.log("Concluído.");
}
run();
