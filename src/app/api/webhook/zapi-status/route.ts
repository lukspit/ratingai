import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuração do Nodemailer com o Gmail (Google)
// Será necessário criar uma 'App Password' no Google e colocar no .env
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Ex: teste@gmail.com
        pass: process.env.EMAIL_PASS, // Ex: qbzw abcx pqqz iooo (App Password)
    },
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("[Z-API STATUS WEBHOOK] Recebido:", JSON.stringify(body, null, 2));

        const instanceId = body.instanceId;
        const status = body.status; // Z-API envia CONNECTED ou DISCONNECTED

        if (!instanceId || !status) {
            return NextResponse.json({ error: "Missing instanceId or status" }, { status: 400 });
        }

        // 1. Atualizar o status da Instância no banco
        const { data: instanceData, error: updateError } = await supabaseAdmin
            .from("instances")
            .update({ status: status })
            .eq("zapi_instance_id", instanceId)
            .select("clinic_id")
            .single();

        if (updateError || !instanceData) {
            console.error("[Z-API STATUS] Erro ao atualizar status ou instância não encontrada:", updateError);
            return NextResponse.json({ error: "Instance update failed" }, { status: 500 });
        }

        // 2. Se for uma desconexão crítica, disparar o alerta via e-mail!
        if (status === "DISCONNECTED") {
            console.log(`[Z-API STATUS] Desconexão detectada na Instância ${instanceId}. Buscando e-mail do dono...`);

            // Buscar o dono da clínica
            const { data: clinicData } = await supabaseAdmin
                .from("clinics")
                .select("owner_id, name")
                .eq("id", instanceData.clinic_id)
                .single();

            if (clinicData?.owner_id) {
                // Buscar o e-mail do dono no Auth do Supabase
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(clinicData.owner_id);

                const ownerEmail = userData?.user?.email;

                if (ownerEmail) {
                    console.log(`[Z-API STATUS] Preparando e-mail de alerta para: ${ownerEmail}`);

                    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                        try {
                            await transporter.sendMail({
                                from: `"Nexus SaaS Alertas" <${process.env.EMAIL_USER}>`,
                                to: ownerEmail,
                                subject: "⚠️ URGENTE: Seu WhatsApp foi desconectado (Nexus IA)",
                                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #d9534f;">Atenção: A inteligência artificial parou de atender</h2>
                    <p>Olá, gestor(a) da clínica <strong>${clinicData.name}</strong>.</p>
                    <p>Detectamos que o seu número de WhatsApp se desconectou agora mesmo da plataforma Nexus SaaS.</p>
                    <p>Para garantir que nenhum paciente fique sem resposta, precisamos que você acesse seu painel imediatamente e refaça a conexão:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://seusistema.com/dashboard/whatsapp" style="background-color: #0275d8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Reconectar WhatsApp
                      </a>
                    </div>
                    <p>Se tiver qualquer dúvida, estamos à disposição.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <small style="color: #999;">Equipe Nexus Clínicas SaaS</small>
                  </div>
                `
                            });
                            console.log("[Z-API STATUS] E-mail de alerta disparado com sucesso via Gmail (Nodemailer).");
                        } catch (emailError) {
                            console.error("[Z-API STATUS] Falha ao enviar e-mail via Gmail:", emailError);
                        }
                    } else {
                        console.warn(`[Z-API STATUS] Aviso: E-mail de erro NÃO ENVIADO. Defina EMAIL_USER e EMAIL_PASS no .env`);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, status: status });
    } catch (error: any) {
        console.error("[Z-API STATUS] Falha na rota de status:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
