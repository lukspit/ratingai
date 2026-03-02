import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// We need a service role client to bypass RLS when updating from a webhook
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;

    if (event.type === "checkout.session.completed") {
        // Retrieve the subscription details from Stripe
        const subscription: any = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        const customerId = session.customer as string;
        const clinicId = session.subscription_data?.metadata?.clinicId || session.metadata?.clinicId;

        if (!clinicId) {
            console.error("No clinicId found in session metadata");
            return new NextResponse("Webhook Error: Missing clinicId in metadata", { status: 400 });
        }

        const currentPeriodEnd = subscription.current_period_end;

        const { error } = await supabaseAdmin
            .from("subscriptions")
            .upsert({
                clinic_id: clinicId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                price_id: subscription.items.data[0].price.id,
                current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
            });

        if (error) {
            console.error("Error inserting subscription into Supabase", error);
            return new NextResponse("Webhook Error: Database insert failed", { status: 500 });
        }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as any;

        const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({
                status: subscription.status,
                price_id: subscription.items.data[0].price.id,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

        if (error) {
            console.error("Error updating subscription in Supabase", error);
            return new NextResponse("Webhook Error: Database update failed", { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}
