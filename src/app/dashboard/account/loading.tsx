import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AccountLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-80" />
            </div>

            <div className="grid gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardHeader>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <Skeleton className="h-10 w-32 mt-4" />
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg border-destructive/20">
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-40" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
