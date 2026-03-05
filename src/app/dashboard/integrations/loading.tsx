import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function IntegrationsLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-80 mt-2" />
            </div>

            <div className="grid gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col md:flex-row items-center h-[300px]">
                    <div className="flex-1 md:pr-6 md:border-r border-border/50">
                        <CardHeader>
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-full mt-4" />
                            <Skeleton className="h-4 w-3/4 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full rounded-lg" />
                        </CardContent>
                    </div>
                    <div className="flex-1 p-6 flex items-center justify-center w-full md:w-auto">
                        <Skeleton className="h-12 w-48 rounded-md" />
                    </div>
                </Card>
            </div>
        </div>
    )
}
