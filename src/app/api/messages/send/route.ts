import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    console.log("[API/messages/send] Recebendo solicitação de envio");
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("[API/messages/send] Usuário não autorizado");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { instanceId, phoneNumber, message } = body;

        console.log("[API/messages/send] Payload recebido:", {
            instanceId,
            phoneNumber,
            messageLength: message?.length
        });

        if (!instanceId || !phoneNumber || !message) {
            console.error("[API/messages/send] Campos obrigatórios ausentes:", { instanceId, phoneNumber, hasMessage: !!message });
            return NextResponse.json({ error: "Campos obrigatórios ausentes (instanceId, phoneNumber, message)" }, { status: 400 });
        }

        // 1. Buscar credenciais da Z-API
        console.log("[API/messages/send] Buscando instância:", instanceId);
        const { data: instance, error: instanceError } = await supabase
            .from("instances")
            .select("zapi_instance_id, zapi_token, client_token")
            .eq("id", instanceId)
            .single();

        if (instanceError || !instance) {
            console.error("[API/messages/send] Erro ao buscar instância:", instanceError);
            return NextResponse.json({ error: "Instance not found" }, { status: 404 });
        }

        console.log("[API/messages/send] Instância encontrada. Enviando para Z-API...");

        // 2. Enviar mensagem via Z-API
        const zapiUrl = `https://api.z-api.io/instances/${instance.zapi_instance_id}/token/${instance.zapi_token}/send-text`;

        const zapiResponse = await fetch(zapiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Client-Token": instance.client_token || "",
            },
            body: JSON.stringify({
                phone: phoneNumber,
                message: message,
            }),
        });

        const zapiData = await zapiResponse.json();
        console.log("[API/messages/send] Resposta Z-API:", zapiData);

        if (!zapiResponse.ok) {
            console.error("[API/messages/send] Erro na Z-API:", zapiData);
            throw new Error(zapiData.message || "Failed to send message via Z-API");
        }

        // 3. Salvar no histórico de mensagens (opcional, mas recomendado para o dashboard atualizar)
        console.log("[API/messages/send] Salvando no banco de dados...");
        const { error: dbError } = await supabase.from("messages").insert({
            instance_id: instanceId,
            phone_number: phoneNumber,
            role: "assistant",
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
