'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play } from 'lucide-react'

const VIDEO_ID = 'JbCuAb1gh3c'
const TOTAL_MINUTES = 6

// Ilusão psicológica: início parece mais rápido, fim mais lento
function calcVisualProgress(actual: number): number {
    return Math.pow(actual, 0.55)
}

declare global {
    interface Window {
        YT: {
            Player: new (elementId: string, config: object) => any
            PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
        }
        onYouTubeIframeAPIReady: () => void
    }
}

export function VideoPlayer() {
    const playerRef = useRef<any>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [visualProgress, setVisualProgress] = useState(0)
    const [isPaused, setIsPaused] = useState(true)
    const [isReady, setIsReady] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    const startTracking = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
            if (!playerRef.current) return
            try {
                const duration = playerRef.current.getDuration() || TOTAL_MINUTES * 60
                const current = playerRef.current.getCurrentTime() || 0
                if (duration > 0) {
                    setVisualProgress(calcVisualProgress(current / duration))
                }
            } catch { /* player ainda inicializando */ }
        }, 800)
    }, [])

    const stopTracking = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
    }, [])

    useEffect(() => {
        const initPlayer = () => {
            playerRef.current = new window.YT.Player('yt-player', {
                videoId: VIDEO_ID,
                playerVars: {
                    controls: 0,
                    rel: 0,
                    modestbranding: 1,
                    iv_load_policy: 3,
                    playsinline: 1,
                },
                events: {
                    onReady: () => setIsReady(true),
                    onStateChange: (e: { data: number }) => {
                        const { PlayerState } = window.YT
                        if (e.data === PlayerState.PLAYING) {
                            setIsPaused(false)
                            setHasStarted(true)
                            startTracking()
                        } else if (e.data === PlayerState.PAUSED || e.data === PlayerState.ENDED) {
                            setIsPaused(true)
                            stopTracking()
                        }
                    },
                },
            })
        }

        if (window.YT?.Player) {
            initPlayer()
        } else {
            if (!document.getElementById('yt-api-script')) {
                const tag = document.createElement('script')
                tag.id = 'yt-api-script'
                tag.src = 'https://www.youtube.com/iframe_api'
                document.head.appendChild(tag)
            }
            window.onYouTubeIframeAPIReady = initPlayer
        }

        return () => stopTracking()
    }, [startTracking, stopTracking])

    function handleVideoClick() {
        if (!playerRef.current || !isReady) return
        isPaused ? playerRef.current.playVideo() : playerRef.current.pauseVideo()
    }

    const progressPct = Math.min(100, Math.round(visualProgress * 100))
    const minutesLeft = Math.max(0, Math.ceil((1 - visualProgress) * TOTAL_MINUTES))

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Wrapper com bloom de luz */}
            <div className="relative">
                <div className="absolute -inset-8 rounded-3xl bg-[#4A90E2]/20 blur-3xl pointer-events-none" />

                {/* Container do vídeo */}
                <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer ring-1 ring-white/10 shadow-2xl"
                    onClick={handleVideoClick}
                >
                    <div className="aspect-video bg-black">
                        <div id="yt-player" className="w-full h-full" />
                    </div>

                    {/* Overlay de pausa */}
                    {isPaused && isReady && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-5 backdrop-blur-[2px] transition-opacity">
                            <div className="w-[72px] h-[72px] rounded-full bg-white/95 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform duration-200">
                                <Play className="w-8 h-8 text-[#4A90E2] ml-1" fill="#4A90E2" />
                            </div>
                            {!hasStarted ? (
                                <div className="text-center px-6">
                                    <p className="text-white font-semibold text-xl">
                                        6 minutos que podem mudar sua clínica.
                                    </p>
                                    <p className="text-white/55 text-sm mt-1.5">
                                        Assista antes de escolher seu plano.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center px-6">
                                    <p className="text-white font-semibold text-lg">
                                        Não feche ainda.
                                    </p>
                                    <p className="text-white/55 text-sm mt-1.5">
                                        O trecho que muda a decisão da maioria das clínicas{' '}
                                        <span className="text-white/85 font-medium">está logo à frente.</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-5 px-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/45">
                        {progressPct > 0
                            ? `${progressPct}% assistido`
                            : 'Clique para assistir — 6 min que valem a pena'}
                    </span>
                    {progressPct > 0 && progressPct < 95 && (
                        <span className="text-xs text-white/35">
                            ~{minutesLeft} min restantes
                        </span>
                    )}
                    {progressPct >= 95 && (
                        <span className="text-xs text-[#6DA08D] font-medium">
                            Pronto para escolher seu plano ↓
                        </span>
                    )}
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${progressPct}%`,
                            background: 'linear-gradient(90deg, #4A90E2, #6DA08D)',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
