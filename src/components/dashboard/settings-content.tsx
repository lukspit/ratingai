'use client'

import { useState } from 'react'
import { OnboardingIntro } from './onboarding-intro'
import { OnboardingWizard } from './onboarding-wizard'

interface SettingsContentProps {
    initialData: any
    hasCompleted: boolean
    onSave: (data: any) => Promise<void>
}

export function SettingsContent({ initialData, hasCompleted, onSave }: SettingsContentProps) {
    // Se o onboarding não foi completado, começa na intro. Se já completou, vai direto pro wizard.
    const [showIntro, setShowIntro] = useState(!hasCompleted)

    return (
        <>
            {showIntro ? (
                <OnboardingIntro onStart={() => setShowIntro(false)} />
            ) : (
                <OnboardingWizard
                    initialData={initialData}
                    hasCompleted={hasCompleted}
                    onSave={onSave}
                />
            )}
        </>
    )
}
