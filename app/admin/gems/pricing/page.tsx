'use client';

import { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	Card,
	CardActionArea,
	CardContent,
	Grid,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	Paper,
	Chip,
	IconButton,
	Collapse,
	CircularProgress,
	Alert,
	InputAdornment,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import AdminService from '@/app/services/admin';

// ─── Types ─────────────────────────────────────────────

interface GemPricingException {
	condition: string;
	cost?: number;
	description: string;
}

interface GemPricingEntry {
	key: string;
	label: string;
	cost?: { kr: number; jp: number } | 'variable';
	amount?: { kr: number; jp: number } | 'variable';
	exceptions: GemPricingException[];
}

interface GemPricingResponse {
	consume: GemPricingEntry[];
	reward: GemPricingEntry[];
	refund: GemPricingEntry[];
	admin: GemPricingEntry[];
}

type Category = 'consume' | 'reward' | 'refund' | 'admin';
type SortField = 'kr' | 'jp';
type SortDirection = 'asc' | 'desc';

// ─── Helpers ───────────────────────────────────────────

const CATEGORY_CONFIG: Record<
	Category,
	{ label: string; icon: string; color: string; chipColor: 'error' | 'success' | 'info' | 'default' }
> = {
	consume: { label: '소모', icon: '🔴', color: 'error.light', chipColor: 'error' },
	reward: { label: '보상', icon: '🟢', color: 'success.light', chipColor: 'success' },
	refund: { label: '환불', icon: '🔵', color: 'info.light', chipColor: 'info' },
	admin: { label: '관리자', icon: '⚙️', color: 'grey.300', chipColor: 'default' },
};

function getGemValue(entry: GemPricingEntry): { kr: number | null; jp: number | null } {
	const val = entry.cost ?? entry.amount;
	if (!val || val === 'variable') return { kr: null, jp: null };
	return val;
}

function getGemRange(entries: GemPricingEntry[]): string {
	const values = entries
		.map((e) => getGemValue(e))
		.flatMap((v) => [v.kr, v.jp])
		.filter((v): v is number => v !== null && v > 0);
	if (values.length === 0) return '가변';
	const min = Math.min(...values);
	const max = Math.max(...values);
	return min === max ? `${min} 구슬` : `${min}~${max} 구슬`;
}

function countExceptionsByCondition(entries: GemPricingEntry[], match: string): number {
	return entries.filter((e) => e.exceptions.some((ex) => ex.condition.includes(match))).length;
}

function countDiffKrJp(entries: GemPricingEntry[]): number {
	return entries.filter((e) => {
		const v = getGemValue(e);
		return v.kr !== null && v.jp !== null && v.kr !== v.jp;
	}).length;
}

// ─── Summary Card ──────────────────────────────────────

function SummaryCard({
	category,
	entries,
	selected,
	onClick,
}: {
	category: Category;
	entries: GemPricingEntry[];
	selected: boolean;
	onClick: () => void;
}) {
	const config = CATEGORY_CONFIG[category];
	const range = getGemRange(entries);

	const highlights: string[] = [];
	if (category === 'consume') {
		const femFree = countExceptionsByCondition(entries, 'female');
		const diff = countDiffKrJp(entries);
		if (femFree > 0) highlights.push(`여성무료: ${femFree}`);
		if (diff > 0) highlights.push(`KR≠JP: ${diff}`);
	} else if (category === 'reward') {
		const once = countExceptionsByCondition(entries, 'once_per');
		const dbVar = countExceptionsByCondition(entries, 'db_configurable');
		if (once > 0) highlights.push(`1회제한: ${once}`);
		if (dbVar > 0) highlights.push(`DB가변: ${dbVar}`);
	} else if (category === 'refund') {
		const auto = countExceptionsByCondition(entries, 'auto');
		const manual = entries.length - auto;
		if (auto > 0) highlights.push(`자동: ${auto}`);
		if (manual > 0) highlights.push(`수동: ${manual}`);
	}

	return (
		<Card
			variant={selected ? 'outlined' : 'elevation'}
			elevation={selected ? 3 : 0}
			sx={{
				borderTop: selected ? `4px solid` : 'none',
				borderTopColor: selected ? config.color : 'transparent',
				cursor: 'pointer',
				transition: 'all 0.2s',
				'&:hover': { elevation: 2, transform: 'translateY(-2px)' },
			}}
		>
			<CardActionArea onClick={onClick}>
				<CardContent>
					<Typography variant="subtitle2" color="text.secondary" gutterBottom>
						{config.icon} {config.label}
					</Typography>
					<Typography variant="h5" fontWeight={700}>
						{entries.length}개 기능
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						{range}
					</Typography>
					{highlights.length > 0 && (
						<Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
							{highlights.map((h) => (
								<Chip key={h} label={h} size="small" variant="outlined" />
							))}
						</Box>
					)}
				</CardContent>
			</CardActionArea>
		</Card>
	);
}

// ─── Detail Row ────────────────────────────────────────

function PricingRow({
	index,
	entry,
	category,
}: {
	index: number;
	entry: GemPricingEntry;
	category: Category;
}) {
	const [open, setOpen] = useState(false);
	const config = CATEGORY_CONFIG[category];
	const val = getGemValue(entry);
	const isVariable = (entry.cost ?? entry.amount) === 'variable';
	const isRewardOrRefund = category === 'reward' || category === 'refund' || category === 'admin';
	const isDiff = val.kr !== null && val.jp !== null && val.kr !== val.jp;

	const formatValue = (v: number | null) => {
		if (isVariable) return '--';
		if (v === null) return '--';
		return isRewardOrRefund ? `+${v}` : `${v}`;
	};

	return (
		<>
			<TableRow hover sx={{ '& > *': { borderBottom: open ? 'unset' : undefined } }}>
				<TableCell align="center" sx={{ width: 50 }}>
					{index}
				</TableCell>
				<TableCell sx={{ width: 100 }}>
					<Chip label={`${config.icon} ${config.label}`} size="small" color={config.chipColor} variant="outlined" />
				</TableCell>
				<TableCell sx={{ fontWeight: 500 }}>{entry.label}</TableCell>
				<TableCell align="center">{formatValue(val.kr)}</TableCell>
				<TableCell
					align="center"
					sx={isDiff ? { bgcolor: 'warning.light', fontWeight: 700 } : undefined}
				>
					{formatValue(val.jp)}
				</TableCell>
				<TableCell>
					{entry.exceptions.length > 0 ? (
						<Chip
							icon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
							label={`📋 ${entry.exceptions.length}개 규칙`}
							size="small"
							variant="outlined"
							onClick={() => setOpen(!open)}
							sx={{ cursor: 'pointer' }}
						/>
					) : null}
				</TableCell>
			</TableRow>
			{entry.exceptions.length > 0 && (
				<TableRow>
					<TableCell colSpan={6} sx={{ py: 0, px: 2 }}>
						<Collapse in={open} timeout="auto" unmountOnExit>
							<Box sx={{ my: 1.5, px: 2, py: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>조건</TableCell>
											<TableCell align="center" sx={{ fontWeight: 600 }}>
												적용 비용
											</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{entry.exceptions.map((ex) => (
											<TableRow key={ex.condition}>
												<TableCell>
													<code>{ex.condition}</code>
												</TableCell>
												<TableCell align="center">
													{ex.cost !== undefined ? ex.cost : '-'}
												</TableCell>
												<TableCell>{ex.description}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Box>
						</Collapse>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}

// ─── Main Page ─────────────────────────────────────────

function GemPricingPageContent() {
	const [data, setData] = useState<GemPricingResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filters
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
	const [searchText, setSearchText] = useState('');
	const [countryFilter, setCountryFilter] = useState<'all' | 'diff'>('all');
	const [exceptionFilter, setExceptionFilter] = useState<'all' | 'has' | 'none'>('all');

	// Sort
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

	useEffect(() => {
		AdminService.gemPricing
			.getAll()
			.then((res: GemPricingResponse) => setData(res))
			.catch((err: any) => setError(err.message || 'API 호출 실패'))
			.finally(() => setLoading(false));
	}, []);

	// Build flat list with category tag
	const allEntries = useMemo(() => {
		if (!data) return [];
		const categories: Category[] = ['consume', 'reward', 'refund', 'admin'];
		return categories.flatMap((cat) =>
			(data[cat] || []).map((entry) => ({ ...entry, category: cat }))
		);
	}, [data]);

	// Apply filters
	const filteredEntries = useMemo(() => {
		let list = allEntries;

		if (selectedCategory) {
			list = list.filter((e) => e.category === selectedCategory);
		}

		if (searchText.trim()) {
			const q = searchText.toLowerCase();
			list = list.filter(
				(e) => e.label.toLowerCase().includes(q) || e.key.toLowerCase().includes(q)
			);
		}

		if (countryFilter === 'diff') {
			list = list.filter((e) => {
				const v = getGemValue(e);
				return v.kr !== null && v.jp !== null && v.kr !== v.jp;
			});
		}

		if (exceptionFilter === 'has') {
			list = list.filter((e) => e.exceptions.length > 0);
		} else if (exceptionFilter === 'none') {
			list = list.filter((e) => e.exceptions.length === 0);
		}

		return list;
	}, [allEntries, selectedCategory, searchText, countryFilter, exceptionFilter]);

	// Apply sort
	const sortedEntries = useMemo(() => {
		if (!sortField) return filteredEntries;

		return [...filteredEntries].sort((a, b) => {
			const va = getGemValue(a);
			const vb = getGemValue(b);
			const aVal = sortField === 'kr' ? va.kr : va.jp;
			const bVal = sortField === 'kr' ? vb.kr : vb.jp;

			// variable (null) always goes to bottom
			if (aVal === null && bVal === null) return 0;
			if (aVal === null) return 1;
			if (bVal === null) return -1;

			return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
		});
	}, [filteredEntries, sortField, sortDirection]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortField(field);
			setSortDirection('desc');
		}
	};

	const handleCategoryClick = (cat: Category) => {
		setSelectedCategory((prev) => (prev === cat ? null : cat));
	};

	const totalCount = allEntries.length;

	// ─── Render ────────────────────────────────────────

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box p={3}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

	if (!data) return null;

	return (
		<Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
			{/* Header */}
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Typography variant="h5" fontWeight={700}>
					💎 구슬 가격표
				</Typography>
				<Typography variant="body2" color="text.secondary">
					총 {totalCount}개 기능
				</Typography>
			</Box>

			{/* 영역 1: Summary Cards */}
			<Grid container spacing={2} sx={{ mb: 3 }}>
				{(['consume', 'reward', 'refund', 'admin'] as Category[]).map((cat) => (
					<Grid item xs={6} md={3} key={cat}>
						<SummaryCard
							category={cat}
							entries={data[cat] || []}
							selected={selectedCategory === cat}
							onClick={() => handleCategoryClick(cat)}
						/>
					</Grid>
				))}
			</Grid>

			{/* 영역 2: Filter Bar */}
			<Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
				<TextField
					size="small"
					placeholder="기능명 또는 key 검색..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					sx={{ minWidth: 250, flex: 1 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
					}}
				/>
				<FormControl size="small" sx={{ minWidth: 140 }}>
					<InputLabel>국가</InputLabel>
					<Select
						label="국가"
						value={countryFilter}
						onChange={(e) => setCountryFilter(e.target.value as 'all' | 'diff')}
					>
						<MenuItem value="all">전체</MenuItem>
						<MenuItem value="diff">KR≠JP만</MenuItem>
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ minWidth: 140 }}>
					<InputLabel>예외규칙</InputLabel>
					<Select
						label="예외규칙"
						value={exceptionFilter}
						onChange={(e) => setExceptionFilter(e.target.value as 'all' | 'has' | 'none')}
					>
						<MenuItem value="all">전체</MenuItem>
						<MenuItem value="has">예외 있음</MenuItem>
						<MenuItem value="none">예외 없음</MenuItem>
					</Select>
				</FormControl>
			</Paper>

			{/* 영역 3: Detail Table */}
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow sx={{ bgcolor: 'grey.100' }}>
							<TableCell align="center" sx={{ fontWeight: 700, width: 50 }}>
								#
							</TableCell>
							<TableCell sx={{ fontWeight: 700, width: 100 }}>카테고리</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>기능</TableCell>
							<TableCell align="center" sx={{ fontWeight: 700 }}>
								<TableSortLabel
									active={sortField === 'kr'}
									direction={sortField === 'kr' ? sortDirection : 'desc'}
									onClick={() => handleSort('kr')}
								>
									KR
								</TableSortLabel>
							</TableCell>
							<TableCell align="center" sx={{ fontWeight: 700 }}>
								<TableSortLabel
									active={sortField === 'jp'}
									direction={sortField === 'jp' ? sortDirection : 'desc'}
									onClick={() => handleSort('jp')}
								>
									JP
								</TableSortLabel>
							</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>예외 규칙</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedEntries.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} align="center" sx={{ py: 6 }}>
									<Typography color="text.secondary">
										조건에 맞는 기능이 없습니다
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							sortedEntries.map((entry, idx) => (
								<PricingRow
									key={entry.key}
									index={idx + 1}
									entry={entry}
									category={entry.category}
								/>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}

export default function GemPricingPage() {
  return (
    <GemPricingPageContent />
  );
}
