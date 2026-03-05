import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ConversationsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <div className="grid md:grid-cols-12 min-h-[600px]">
                    {/* List Sidebar Skeleton */}
                    <div className="md:col-span-4 border-r border-border/50 p-4 space-y-4">
                        <Skeleton className="h-10 w-full mb-6" />
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-3 p-3">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Area Skeleton */}
                    <div className="md:col-span-8 flex flex-col p-6 space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="flex-1 space-y-6 py-6">
                            <Skeleton className="h-20 w-3/4 rounded-xl ml-auto" />
                            <Skeleton className="h-24 w-2/3 rounded-xl ml-0" />
                            <Skeleton className="h-16 w-1/2 rounded-xl ml-auto" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-md" />
                    </div>
                </div>
            </Card>
        </div>
    )
}
