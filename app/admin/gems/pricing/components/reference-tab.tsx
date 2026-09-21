'use client';

import { useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Chip,
	Collapse,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { AdminLoading } from '@/shared/ui/admin/loading';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import AdminService from '@/app/services/admin';

interface PricingException {
	condition: string;
	cost?: number;
	description: string;
}

interface PricingEntry {
	key: string;
	label: string;
	amount?: { kr: number; jp: number } | 'variable';
	cost?: { kr: number; jp: number } | 'variable';
	exceptions: PricingException[];
}

type Category = 'reward' | 'refund' | 'admin';

const CATEGORY_LABEL: Record<Category, string> = {
	reward: '보상 (지급)',
	refund: '환급 (되돌려줌)',
	admin: '관리자 조작',
};

function EntryRow({ entry }: { entry: PricingEntry }) {
	const [open, setOpen] = useState(false);
	const val = entry.amount ?? entry.cost;
	const isVariable = val === 'variable' || val === undefined;

	return (
		<>
			<TableRow hover>
				<TableCell sx={{ fontWeight: 500 }}>{entry.label}</TableCell>
				<TableCell>
					<code>{entry.key}</code>
				</TableCell>
				<TableCell align="center">{isVariable ? '가변' : `${(val as any).kr}`}</TableCell>
				<TableCell align="center">{isVariable ? '가변' : `${(val as any).jp}`}</TableCell>
				<TableCell>
					{entry.exceptions.length > 0 && (
						<Chip
							size="small"
							variant="outlined"
							icon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
							label={`${entry.exceptions.length}개 규칙`}
							onClick={() => setOpen(!open)}
							sx={{ cursor: 'pointer' }}
						/>
					)}
				</TableCell>
			</TableRow>
			{entry.exceptions.length > 0 && (
				<TableRow>
					<TableCell colSpan={5} sx={{ py: 0 }}>
						<Collapse in={open} unmountOnExit>
							<Box sx={{ my: 1.5, px: 2, py: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
								{entry.exceptions.map((ex) => (
									<Typography key={ex.condition} variant="body2" sx={{ mb: 0.5 }}>
										<code>{ex.condition}</code>
										{ex.cost !== undefined && ` (${ex.cost})`} — {ex.description}
									</Typography>
								))}
							</Box>
						</Collapse>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}

export default function ReferenceTab() {
	const [data, setData] = useState<Record<Category, PricingEntry[]> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [category, setCategory] = useState<Category | 'all'>('all');

	useEffect(() => {
		AdminService.gemPricing
			.getAll()
			.then((res: any) =>
				setData({ reward: res.reward ?? [], refund: res.refund ?? [], admin: res.admin ?? [] }),
			)
			.catch((e) => setError(getAdminErrorMessage(e, '가격표를 불러오지 못했습니다')))
			.finally(() => setLoading(false));
	}, []);

	const sections: Category[] = category === 'all' ? ['reward', 'refund', 'admin'] : [category];

	if (loading) {
		return <AdminLoading />;
	}

	if (error) return <Alert severity="error">{error}</Alert>;
	if (!data) return null;

	return (
		<Box>
			<Alert severity="info" sx={{ mb: 2 }}>
				보상·환급·관리자 항목은 아직 DB화되지 않아 <b>읽기 전용</b>입니다. 값 변경은 코드 수정 +
				배포가 필요합니다. 소모 가격만 정가 탭에서 즉시 바꿀 수 있습니다.
			</Alert>

			<Paper sx={{ p: 2, mb: 2 }}>
				<FormControl size="small" sx={{ minWidth: 200 }}>
					<InputLabel>분류</InputLabel>
					<Select
						label="분류"
						value={category}
						onChange={(e) => setCategory(e.target.value as Category | 'all')}
					>
						<MenuItem value="all">전체</MenuItem>
						{(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
							<MenuItem key={c} value={c}>
								{CATEGORY_LABEL[c]}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Paper>

			{sections.map((cat) => (
				<Box key={cat} sx={{ mb: 3 }}>
					<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
						{CATEGORY_LABEL[cat]} · {data[cat].length}개
					</Typography>
					<TableContainer component={Paper}>
						<Table size="small">
							<TableHead>
								<TableRow sx={{ bgcolor: 'grey.100' }}>
									<TableCell sx={{ fontWeight: 700 }}>기능</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>key</TableCell>
									<TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>
										KR
									</TableCell>
									<TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>
										JP
									</TableCell>
									<TableCell sx={{ fontWeight: 700, width: 150 }}>예외 규칙</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{data[cat].map((entry) => (
									<EntryRow key={entry.key} entry={entry} />
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			))}
		</Box>
	);
}
