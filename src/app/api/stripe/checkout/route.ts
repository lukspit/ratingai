import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const priceId = searchParams.get("priceId");

    if (!priceId) {
        return new NextResponse("Price ID is required", { status: 400 });
    }

    try {
        const supabase = await createClient();

        // Get the user's session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
            // If the user isn't logged in, redirect them to login with a parameter to return to checkout
            const url = new URL("/login", request.url);
            url.searchParams.set("returnTo", `/pricing`); // Ideally we'd remember the plan, but let's keep it simple
            return NextResponse.redirect(url.toString());
        }

        // 1. Check if the user's clinic already has a Stripe customer ID
        // We assume the user has a clinic. Let's find it.
        const { data: clinic, error: clinicError } = await supabase
            .from("clinics")
            .select("id")
            .eq("owner_id", user.id)
            .single();

        if (clinicError || !clinic) {
            console.error("Clinic not found for user", user.id, clinicError);
            return new NextResponse("Você precisa configurar sua clínica primeiro.", { status: 400 });
        }

        // 2. Fetch the subscription record for this clinic to get the customer ID if it exists
        const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("clinic_id", clinic.id)
            .single();

        let customerId = subscription?.stripe_customer_id;

        // 3. If they don't have a Stripe customer ID, create one
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabaseUUID: user.id,
                    clinicId: clinic.id,
                },
            });
            customerId = customer.id;
        }

        // 4. Create the Checkout Session
        const requestUrl = new URL(request.url);
        const origin = `${requestUrl.protocol}//${requestUrl.host}`;

        const stripeSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            payment_method_types: ["card"],
            metadata: {
                clinicId: clinic.id,
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing?canceled=true`,
            subscription_data: {
                metadata: {
                    clinicId: clinic.id,
                },
            },
        });

        if (!stripeSession.url) {
            throw new Error("Stripe checkout session creation failed");
        }

        // 5. Redirect the user to the Stripe Checkout page
        return NextResponse.redirect(stripeSession.url);

    } catch (error: any) {
        console.error("[STRIPE_CHECKOUT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
