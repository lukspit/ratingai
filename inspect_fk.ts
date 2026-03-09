import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFk() {
    const { data, error } = await supabase.rpc('get_foreign_keys');
    if (error) {
        console.error('Cant use rpc get_foreign_keys, querying raw...', error);
        // try another way if rpc doesn't exist.
    } else {
        console.log(data);
    }
}

inspectFk();
