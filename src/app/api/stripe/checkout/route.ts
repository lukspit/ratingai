import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const priceId = searchParams.get("priceId");

    if (!priceId) {
        return new NextResponse("Price ID is required", { status: 400 });
    }

    try {
        // Create the Checkout Session
        const requestUrl = new URL(request.url);
        const origin = `${requestUrl.protocol}//${requestUrl.host}`;

        const stripeSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            allow_promotion_codes: true,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/beta?canceled=true`,
        });

        if (!stripeSession.url) {
            throw new Error("Stripe checkout session creation failed");
        }

        // Redirect the user to the Stripe Checkout page
        return NextResponse.redirect(stripeSession.url);

    } catch (error: any) {
        console.error("[STRIPE_CHECKOUT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
