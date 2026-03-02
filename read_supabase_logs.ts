import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltam variáveis do Supabase no .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Erro ao buscar logs:", error);
        return;
    }

    console.log("=== ÚLTIMAS 10 MENSAGENS NO BANCO ===");
    data.forEach((msg, i) => {
        console.log(`\n--- Mensagem ${10 - i} ---`);
        console.log(`Role: ${msg.role}`);
        console.log(`Criado em: ${msg.created_at}`);
        console.log(`Conteúdo original:`);
        console.log(msg.content);
    });
}

checkLogs();
