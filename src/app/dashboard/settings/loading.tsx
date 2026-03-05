import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SettingsLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-80 mt-2" />
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="border-b border-border/50">
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-32" />
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="flex justify-end gap-4">
                        <Skeleton className="h-11 w-32" />
                        <Skeleton className="h-11 w-48" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
