import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    // We need a service role client to bypass RLS when updating from a webhook
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;

    console.log("Webhook received. Signature length:", signature?.length);

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log("Webhook event constructed:", event.type);
    } catch (error: any) {
        console.error("Webhook Signature Verification Failed:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;

    if (event.type === "checkout.session.completed") {
        console.log("Processing checkout.session.completed...");
        // Retrieve the subscription details from Stripe
        const subscription: any = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email;

        console.log("Customer Email:", customerEmail);

        if (!customerEmail) {
            console.error("No customer email found in session");
            return new NextResponse("Webhook Error: Missing customer email", { status: 400 });
        }

        const currentPeriodEnd = subscription.current_period_end;

        const { error } = await supabaseAdmin
            .from("subscriptions")
            .upsert({
                customer_email: customerEmail,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                price_id: subscription.items.data[0].price.id,
                current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
            }, { onConflict: 'stripe_subscription_id' });

        if (error) {
            console.error("Error inserting subscription into Supabase:", error);
            return new NextResponse("Webhook Error: Database insert failed", { status: 500 });
        }
        console.log("Subscription inserted/updated successfully!");
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
