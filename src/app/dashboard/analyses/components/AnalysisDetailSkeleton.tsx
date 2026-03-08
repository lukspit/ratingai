import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AnalysisDetailSkeleton() {
    return (
        <div className="space-y-8 pb-16 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                </div>
                <Skeleton className="h-10 w-44 rounded-md" />
            </div>

            {/* Ratings Skeleton */}
            <Card className="border-border/50 shadow-lg">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Skeleton className="h-32 w-40 rounded-2xl" />
                        <div className="flex flex-col items-center gap-1">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-32 w-40 rounded-2xl" />
                        <Skeleton className="sm:ml-auto h-32 w-40 rounded-2xl" />
                    </div>
                    <Skeleton className="h-16 w-full mt-4 rounded-lg" />
                </CardContent>
            </Card>

            {/* KPIs Skeleton */}
            <Card className="border-border/50 shadow-lg">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-56" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Documents/Markdown Skeleton */}
            <Card className="border-border/50 shadow-lg">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
        </div>
    )
}
