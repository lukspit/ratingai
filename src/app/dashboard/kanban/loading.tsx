import { Skeleton } from "@/components/ui/skeleton"

export default function KanbanLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 h-[600px]">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="min-w-[300px] w-[300px] flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <div className="bg-muted/20 rounded-xl p-3 space-y-3 h-full">
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="w-4 h-4 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
