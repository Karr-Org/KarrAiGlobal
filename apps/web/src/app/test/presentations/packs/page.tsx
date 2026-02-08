'use client';

import PresetPackSelector from '@/components/gamma/PresetPackSelector';
import { PresetPack } from '@/lib/gamma/preset-packs';

export default function PresetPacksPage() {
    const handleSelectPack = (pack: PresetPack) => {
        console.log('Selected pack:', pack);
        // Navigate to presentation editor with pack template
    };

    return <PresetPackSelector onSelectPack={handleSelectPack} mode="page" />;
}
