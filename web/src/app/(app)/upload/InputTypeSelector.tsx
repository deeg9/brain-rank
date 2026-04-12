'use client'

import { motion } from 'framer-motion'

type TabType = 'video' | 'image' | 'text'

interface InputTypeSelectorProps {
  selected: TabType
  onChange: (type: TabType) => void
  disabled?: boolean
}

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'video', label: 'Video', icon: 'videocam' },
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'text', label: 'Text', icon: 'text_fields' },
]

export function InputTypeSelector({ selected, onChange, disabled }: InputTypeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          disabled={disabled}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${
            selected === tab.id
              ? 'text-on-surface'
              : 'text-on-surface-variant hover:text-on-surface/80'
          }`}
        >
          {selected === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white/10 rounded-lg border border-white/10"
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            />
          )}
          <span className="material-symbols-outlined text-lg relative z-10">{tab.icon}</span>
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export type { TabType }
