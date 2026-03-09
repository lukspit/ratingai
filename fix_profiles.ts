import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfiles() {
    console.log('Buscando usuários autenticados...');
    const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();

    if (authErr) {
        console.error('Erro ao buscar usuários:', authErr);
        return;
    }

    console.log(`Encontrados ${users.length} usuários.`);

    for (const user of users) {
        const { data: profile, error: profErr } = await supabase
            .from('tributario_profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            console.log(`Criando perfil para o usuário ${user.email} (${user.id})...`);
            const { error: insErr } = await supabase
                .from('tributario_profiles')
                .insert([{ id: user.id, full_name: user.email }]);

            if (insErr) {
                console.error(`Erro ao criar perfil para ${user.email}:`, insErr);
            } else {
                console.log(`Perfil criado com sucesso.`);
            }
        } else {
            console.log(`Usuário ${user.email} já possui perfil.`);
        }
    }
    console.log('Finalizado.');
}

fixProfiles();
