import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
    try {
        const { phoneNumber, message, instanceId } = await req.json();

        if (!phoneNumber || !message || !instanceId) {
            return NextResponse.json(
                { error: "Campos obrigatórios ausentes (phoneNumber, message, instanceId)" },
                { status: 400 }
            );
        }

        // 1. Buscar credenciais da Z-API no banco
        const { data: instance, error: instanceError } = await supabase
            .from("instances")
            .select("zapi_instance_id, zapi_token, client_token")
            .eq("id", instanceId)
            .single();

        if (instanceError || !instance) {
            console.error("Erro ao buscar instância:", instanceError);
            return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
        }

        // 2. Enviar para a Z-API
        const zapiUrl = `https://api.z-api.io/instances/${instance.zapi_instance_id}/token/${instance.zapi_token}/send-text`;

        const fetchHeaders: any = { "Content-Type": "application/json" };
        if (instance.client_token) {
            fetchHeaders["Client-Token"] = instance.client_token;
        }

        const zapiResponse = await fetch(zapiUrl, {
            method: "POST",
            headers: fetchHeaders,
            body: JSON.stringify({
                phone: phoneNumber,
                message: message,
            }),
        });

        if (!zapiResponse.ok) {
            const zapiError = await zapiResponse.text();
            console.error("Erro na Z-API:", zapiError);
            return NextResponse.json({ error: "Falha ao enviar mensagem via Z-API" }, { status: 500 });
        }

        // 3. Salvar no histórico de mensagens (tabela messages)
        const { error: dbError } = await supabase.from("messages").insert({
            instance_id: instanceId,
            phone_number: phoneNumber,
            role: "assistant", // Tratamos como assistant para uniformidade no UI
            content: message,
        });

        if (dbError) {
            console.error("Erro ao salvar mensagem no banco:", dbError);
            // Não retornamos erro aqui pois a mensagem já foi enviada ao paciente
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Erro no endpoint de envio manual:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
