'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Redireciona para o dashboard após um tempo adequado para o webhook rodar
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-card border border-border/40 rounded-xl p-8 shadow-2xl">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500" />
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Pagamento Confirmado!
                </h1>

                <p className="text-muted-foreground text-lg">
                    Sua assinatura foi processada com sucesso. Estamos preparando tudo para você.
                </p>

                <div className="pt-8 pb-4">
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <p>Redirecionando para o seu Dashboard em {countdown} segundo{countdown !== 1 ? 's' : ''}...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
