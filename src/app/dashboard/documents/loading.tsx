import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DocumentsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-1 w-8 bg-indigo-500/50" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-72" />
                    <Skeleton className="h-5 w-80" />
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <Skeleton className="h-10 w-full max-w-sm" />
                    <Skeleton className="h-10 w-36" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50">
                                <div className="flex items-center gap-4 flex-1">
                                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-64" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </div>
                                </div>
                                <Skeleton className="h-9 w-24 rounded-md" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
