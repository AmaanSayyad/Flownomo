'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    LayoutGrid,
    Scale,
    Zap,
    ChevronDown,
    type LucideIcon,
} from 'lucide-react';

const STEPS: {
    id: string;
    phase: string;
    title: string;
    description: string;
    accent: string;
    accentSoft: string;
    icon: LucideIcon;
}[] = [
    {
        id: '01',
        phase: 'LIQUIDITY INJECTION',
        title: 'Connect & Deposit',
        description:
            'Connect your Flow wallet and deposit to the Flownomo treasury. Once confirmed, your house balance updates so you can trade instantly without on-chain bet transactions.',
        accent: '#3b82f6',
        accentSoft: 'rgba(59, 130, 246, 0.14)',
        icon: Wallet,
    },
    {
        id: '02',
        phase: 'PREDICTIVE ANALYSIS',
        title: 'Choose Your Game Mode',
        description:
            'Pick from Box, Draw, or Classic. Classic is up/down with fixed logic; Box targets a price zone with higher multipliers; Draw uses your custom drawn region as the win condition.',
        accent: '#a855f7',
        accentSoft: 'rgba(168, 85, 247, 0.14)',
        icon: LayoutGrid,
    },
    {
        id: '03',
        phase: 'MATCHING ENGINE',
        title: 'Mode-Specific Settlement',
        description:
            'At expiry, Flownomo resolves from oracle prices by mode: Classic checks direction, Box checks if close lands inside your box, and Draw checks your drawn region. Results post to your history.',
        accent: '#f59e0b',
        accentSoft: 'rgba(245, 158, 11, 0.14)',
        icon: Scale,
    },
    {
        id: '04',
        phase: 'INSTANT SETTLEMENT',
        title: 'Atomic Payouts',
        description:
            'At round completion, wins credit to your house balance immediately. When you withdraw, treasury sends FLOW on-chain and your house balance updates.',
        accent: '#10b981',
        accentSoft: 'rgba(16, 185, 129, 0.14)',
        icon: Zap,
    },
];

const ROWS: (typeof STEPS)[] = [STEPS.slice(0, 2), STEPS.slice(2, 4)];

function StepCard({
    step,
    globalIndex,
}: {
    step: (typeof STEPS)[number];
    globalIndex: number;
}) {
    const Icon = step.icon;
    return (
        <motion.li
            initial={{ opacity: 1, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.22 }}
            transition={{
                duration: 0.52,
                delay: globalIndex * 0.06,
                ease: [0.16, 1, 0.3, 1],
            }}
            className="min-w-0"
        >
            <article
                className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b12]/90 p-5 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.92)] backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 sm:p-6 lg:rounded-3xl lg:p-7 lg:hover:-translate-y-1 lg:hover:border-white/[0.12] lg:hover:shadow-[0_32px_70px_-36px_rgba(0,0,0,0.95)]"
                style={{
                    boxShadow:
                        'inset 0 1px 0 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(0,0,0,0.4)',
                }}
            >
                <div
                    className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full opacity-[0.28] blur-3xl transition-[opacity,transform] duration-500 group-hover:opacity-[0.42] group-hover:scale-105"
                    style={{ background: step.accent }}
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent"
                    aria-hidden
                />

                <div
                    className="absolute bottom-5 left-0 top-5 w-1 rounded-full sm:bottom-6 sm:top-6"
                    style={{
                        background: `linear-gradient(180deg, ${step.accent}, ${step.accent}88)`,
                        boxShadow: `0 0 28px ${step.accentSoft}`,
                    }}
                    aria-hidden
                />

                <div className="relative z-[1] flex flex-1 flex-col gap-3.5 pl-4 sm:gap-4 sm:pl-5 lg:gap-5">
                    <div className="flex items-start justify-between gap-3">
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] transition-transform duration-300 group-hover:scale-[1.06] group-hover:border-white/15 sm:h-[3.25rem] sm:w-[3.25rem]"
                            style={{
                                backgroundColor: step.accentSoft,
                                boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 10px 32px -10px ${step.accent}`,
                            }}
                        >
                            <Icon
                                className="h-6 w-6 sm:h-7 sm:w-7"
                                style={{ color: step.accent }}
                                strokeWidth={1.65}
                                aria-hidden
                            />
                        </div>
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-black tabular-nums text-white sm:h-11 sm:w-11 sm:text-sm"
                            style={{
                                borderColor: `${step.accent}50`,
                                background: `linear-gradient(160deg, ${step.accentSoft}, rgba(0,0,0,0.15))`,
                                boxShadow: `0 0 24px ${step.accentSoft}`,
                            }}
                            aria-label={`Step ${step.id}`}
                        >
                            {step.id}
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <span
                            className="inline-flex max-w-full rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/90 ring-1 ring-inset ring-white/[0.08] sm:tracking-[0.2em]"
                            style={{
                                backgroundColor: step.accentSoft,
                                color: step.accent,
                                textShadow: '0 0 24px rgba(255,255,255,0.15)',
                            }}
                        >
                            {step.phase}
                        </span>
                        <h3
                            className="text-lg font-black leading-snug tracking-tight text-white sm:text-xl lg:text-2xl lg:leading-tight"
                            style={{
                                fontFamily: 'var(--font-orbitron), system-ui, sans-serif',
                            }}
                        >
                            {step.title}
                        </h3>
                    </div>

                    <p className="text-[13px] leading-[1.68] text-white/60 sm:text-[0.9375rem] lg:leading-relaxed">
                        {step.description}
                    </p>
                </div>

                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                />
            </article>
        </motion.li>
    );
}

function RowFlowDivider() {
    return (
        <div
            className="my-2 flex items-center justify-center gap-3 sm:my-3 lg:my-5"
            aria-hidden
        >
            <div className="h-px max-w-[min(8rem,28vw)] flex-1 bg-gradient-to-r from-transparent via-purple-500/35 to-purple-500/25" />
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-purple-500/25 bg-purple-500/[0.08] shadow-[0_0_24px_rgba(168,85,247,0.15)]">
                <ChevronDown className="h-4 w-4 text-purple-300/90" strokeWidth={2.5} />
            </div>
            <div className="h-px max-w-[min(8rem,28vw)] flex-1 bg-gradient-to-l from-transparent via-purple-500/35 to-purple-500/25" />
        </div>
    );
}

export default function HowItWorksSteps() {
    return (
        <div className="relative w-full py-0">
            <div className="flex flex-col gap-0">
                {ROWS.map((row, rowIndex) => (
                    <React.Fragment key={row.map((s) => s.id).join('-')}>
                        {rowIndex > 0 && <RowFlowDivider />}
                        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 sm:gap-6 lg:gap-7">
                            {row.map((step, colIndex) => (
                                <StepCard
                                    key={step.id}
                                    step={step}
                                    globalIndex={rowIndex * 2 + colIndex}
                                />
                            ))}
                        </ul>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
