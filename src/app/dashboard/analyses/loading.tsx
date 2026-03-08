import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AnalysesLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-1 w-8" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-10 w-44 rounded-md" />
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader className="pb-4">
                    <Skeleton className="h-10 w-full max-w-sm" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                                <div className="flex items-center gap-4 flex-1">
                                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4" />
                                            <Skeleton className="h-5 w-48" />
                                        </div>
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-7 w-12 rounded-md" />
                                    <Skeleton className="h-7 w-24 rounded-md hidden sm:block" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
