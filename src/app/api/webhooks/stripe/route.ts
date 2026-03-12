import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;
    const supabaseAdmin = createAdminClient();

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await supabaseAdmin.from("subscriptions").upsert({
            customer_email: session.customer_details?.email,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' });
    }

    return new NextResponse(null, { status: 200 });
}
