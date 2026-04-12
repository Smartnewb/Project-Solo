'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, FlaskConical, School, Shield, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/utils';

interface ExperimentGuideDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const STEPS = [
	{
		id: 'concept',
		title: '실험 그룹이란?',
		subtitle: 'A/B 테스트로 효과를 검증합니다',
	},
	{
		id: 'flow',
		title: '동작 방식',
		subtitle: '학교 배정부터 결과 측정까지',
	},
	{
		id: 'result',
		title: '기대 결과',
		subtitle: '실험군과 대조군 비교',
	},
] as const;

function StepConcept() {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.1 }}
					className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4"
				>
					<div className="mb-3 flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
							<FlaskConical className="h-4 w-4" />
						</div>
						<span className="font-semibold text-emerald-800">실험군</span>
					</div>
					<p className="text-sm text-emerald-700">
						가상 프로필이 <strong>노출되는</strong> 학교
					</p>
					<div className="mt-3 space-y-1.5">
						{['한양대학교', '서울대학교', '연세대학교'].map((name, i) => (
							<motion.div
								key={name}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.3 + i * 0.1 }}
								className="flex items-center gap-2 rounded-md bg-white/70 px-3 py-1.5 text-xs"
							>
								<School className="h-3 w-3 text-emerald-500" />
								<span className="text-slate-700">{name}</span>
							</motion.div>
						))}
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.2 }}
					className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4"
				>
					<div className="mb-3 flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-400 text-white">
							<Shield className="h-4 w-4" />
						</div>
						<span className="font-semibold text-slate-700">대조군</span>
					</div>
					<p className="text-sm text-slate-600">
						가상 프로필이 <strong>노출되지 않는</strong> 학교
					</p>
					<div className="mt-3 space-y-1.5">
						{['고려대학교', '성균관대학교'].map((name, i) => (
							<motion.div
								key={name}
								initial={{ opacity: 0, x: 10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.4 + i * 0.1 }}
								className="flex items-center gap-2 rounded-md bg-white/70 px-3 py-1.5 text-xs"
							>
								<School className="h-3 w-3 text-slate-400" />
								<span className="text-slate-700">{name}</span>
							</motion.div>
						))}
					</div>
				</motion.div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800"
			>
				두 그룹의 <strong>리텐션, 매칭 수락률, 결제 전환율</strong>을 비교하여 가상 매칭의 실제 효과를 측정합니다.
			</motion.div>
		</div>
	);
}

function StepFlow() {
	const flowSteps = [
		{
			icon: School,
			label: '학교 배정',
			desc: '실험군 / 대조군 지정',
			color: 'bg-violet-500',
		},
		{
			icon: Users,
			label: '가상 프로필 생성',
			desc: '프로필 유형 기반 자동 생성',
			color: 'bg-blue-500',
		},
		{
			icon: FlaskConical,
			label: '매칭 노출',
			desc: '실험군 유저에게만 노출',
			color: 'bg-emerald-500',
		},
		{
			icon: TrendingUp,
			label: '효과 측정',
			desc: '실험군 vs 대조군 비교',
			color: 'bg-amber-500',
		},
	];

	return (
		<div className="space-y-6">
			<div className="relative flex items-start justify-between px-2">
				{flowSteps.map((step, i) => (
					<motion.div
						key={step.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.15 }}
						className="relative z-10 flex w-[22%] flex-col items-center text-center"
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: i * 0.15 + 0.1, type: 'spring', stiffness: 300 }}
							className={cn(
								'flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md',
								step.color,
							)}
						>
							<step.icon className="h-5 w-5" />
						</motion.div>
						<div className="mt-2 text-xs font-semibold text-slate-800">{step.label}</div>
						<div className="mt-0.5 text-[11px] leading-tight text-slate-500">{step.desc}</div>

						{i < flowSteps.length - 1 && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: i * 0.15 + 0.3 }}
								className="absolute -right-[45%] top-5"
							>
								<ArrowRight className="h-5 w-5 text-slate-300" />
							</motion.div>
						)}
					</motion.div>
				))}
			</div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.7 }}
				className="space-y-2 rounded-lg border bg-slate-50 p-4"
			>
				<div className="text-xs font-semibold text-slate-700">매칭 게이트 체인 (실험군만 통과)</div>
				<div className="flex flex-wrap gap-1.5">
					{[
						'시스템 ON 확인',
						'실험군 학교 확인',
						'차단 학교 확인',
						'노출 상한 확인',
						'노출 간격 확인',
						'신고 이력 확인',
					].map((gate, i) => (
						<motion.span
							key={gate}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.8 + i * 0.05 }}
							className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700"
						>
							<CheckCircle2 className="h-3 w-3" />
							{gate}
						</motion.span>
					))}
				</div>
				<p className="text-[11px] text-slate-500">
					모든 게이트를 통과해야 가상 프로필이 유저에게 노출됩니다.
				</p>
			</motion.div>
		</div>
	);
}

function StepResult() {
	const metrics = [
		{ label: '주간 매칭 수락률', treatment: 34, control: 22, unit: '%' },
		{ label: '7일 리텐션', treatment: 48, control: 31, unit: '%' },
		{ label: '첫 결제 전환', treatment: 8.2, control: 5.1, unit: '%' },
	];

	return (
		<div className="space-y-5">
			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="text-sm text-slate-600"
			>
				실험군과 대조군의 핵심 지표를 비교하여 가상 매칭의 효과를 판단합니다.
			</motion.p>

			<div className="space-y-3">
				{metrics.map((m, i) => {
					const diff = m.treatment - m.control;
					return (
						<motion.div
							key={m.label}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: i * 0.15 }}
							className="rounded-lg border bg-white p-4"
						>
							<div className="mb-2 flex items-center justify-between">
								<span className="text-sm font-medium text-slate-800">{m.label}</span>
								<motion.span
									initial={{ opacity: 0, scale: 0.5 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: i * 0.15 + 0.3 }}
									className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
								>
									+{diff.toFixed(1)}{m.unit}
								</motion.span>
							</div>
							<div className="flex items-end gap-3">
								<div className="flex-1">
									<div className="mb-1 text-[11px] text-slate-500">실험군</div>
									<div className="relative h-7 overflow-hidden rounded-md bg-slate-100">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${m.treatment}%` }}
											transition={{ delay: i * 0.15 + 0.2, duration: 0.6, ease: 'easeOut' }}
											className="absolute inset-y-0 left-0 rounded-md bg-emerald-500"
										/>
										<span className="relative z-10 flex h-full items-center px-2 text-xs font-semibold text-slate-800">
											{m.treatment}{m.unit}
										</span>
									</div>
								</div>
								<div className="flex-1">
									<div className="mb-1 text-[11px] text-slate-500">대조군</div>
									<div className="relative h-7 overflow-hidden rounded-md bg-slate-100">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${m.control}%` }}
											transition={{ delay: i * 0.15 + 0.2, duration: 0.6, ease: 'easeOut' }}
											className="absolute inset-y-0 left-0 rounded-md bg-slate-400"
										/>
										<span className="relative z-10 flex h-full items-center px-2 text-xs font-semibold text-slate-800">
											{m.control}{m.unit}
										</span>
									</div>
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
			>
				위 수치는 <strong>예시</strong>입니다. 실제 결과는 대시보드에서 실시간으로 확인하세요.
			</motion.div>
		</div>
	);
}

const STEP_COMPONENTS = [StepConcept, StepFlow, StepResult] as const;

export function ExperimentGuideDialog({ open, onOpenChange }: ExperimentGuideDialogProps) {
	const [step, setStep] = useState(0);

	const handleOpenChange = (value: boolean) => {
		if (!value) setStep(0);
		onOpenChange(value);
	};

	const StepContent = STEP_COMPONENTS[step];

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{STEPS[step].title}</DialogTitle>
					<p className="text-sm text-slate-500">{STEPS[step].subtitle}</p>
				</DialogHeader>

				{/* Step indicators */}
				<div className="flex items-center justify-center gap-2">
					{STEPS.map((s, i) => (
						<button
							key={s.id}
							type="button"
							onClick={() => setStep(i)}
							className={cn(
								'h-1.5 rounded-full transition-all duration-300',
								i === step ? 'w-8 bg-primary' : 'w-3 bg-slate-200 hover:bg-slate-300',
							)}
						/>
					))}
				</div>

				{/* Animated content */}
				<div className="min-h-[320px]">
					<AnimatePresence mode="wait">
						<motion.div
							key={step}
							initial={{ opacity: 0, x: 30 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -30 }}
							transition={{ duration: 0.25 }}
						>
							<StepContent />
						</motion.div>
					</AnimatePresence>
				</div>

				{/* Navigation */}
				<div className="flex items-center justify-between pt-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setStep((prev) => prev - 1)}
						disabled={step === 0}
					>
						<ChevronLeft className="mr-1 h-4 w-4" /> 이전
					</Button>

					{step < STEPS.length - 1 ? (
						<Button size="sm" onClick={() => setStep((prev) => prev + 1)}>
							다음 <ChevronRight className="ml-1 h-4 w-4" />
						</Button>
					) : (
						<Button size="sm" onClick={() => handleOpenChange(false)}>
							확인
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
