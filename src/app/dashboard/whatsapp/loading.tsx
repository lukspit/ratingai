import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WhatsAppLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-80 mt-2" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-[300px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="w-20 h-20 rounded-full" />
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-[300px]">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56 mt-2" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center space-y-4">
                        <Skeleton className="h-32 w-48 rounded-xl" />
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 md:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="space-y-2 flex-grow">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-3 w-80" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
