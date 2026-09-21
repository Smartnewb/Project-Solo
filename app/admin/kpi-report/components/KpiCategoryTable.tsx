'use client';

import { useState } from 'react';
import {
	Box,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Collapse,
	IconButton,
	Skeleton,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import {
	KpiValue,
	KpiCategory,
	CATEGORY_CONFIG,
	STATUS_CONFIG,
	formatKpiValue,
	formatChangeRate,
} from '../types';

interface KpiCategoryTableProps {
	category: KpiCategory;
	categoryLabel: string;
	kpis: KpiValue[];
	loading: boolean;
	defaultExpanded?: boolean;
}

export default function KpiCategoryTable({ category, categoryLabel, kpis, loading, defaultExpanded = false }: KpiCategoryTableProps) {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const config = CATEGORY_CONFIG[category];
	const filteredKpis = kpis.filter((k) => k.category === category);

	return (
		<Paper sx={{ overflow: 'hidden' }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					p: 2,
					cursor: 'pointer',
					bgcolor: config.bgColor,
					borderLeft: `4px solid ${config.color}`,
				}}
				onClick={() => setExpanded(!expanded)}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
						{config.icon}
					</Typography>
					<Typography variant="subtitle1" fontWeight="bold">
						{categoryLabel}
					</Typography>
					<Chip label={`${filteredKpis.length}개`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
				</Box>
				<IconButton size="small">
					{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
				</IconButton>
			</Box>

			<Collapse in={expanded}>
				{loading ? (
					<Box sx={{ p: 2 }}>
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
						))}
					</Box>
				) : (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 600 }}>KPI</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>전주</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>금주</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>변화율</TableCell>
									<TableCell align="center" sx={{ fontWeight: 600 }}>상태</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredKpis.map((kpi) => {
									const change = formatChangeRate(kpi.changeRate);
									const statusConfig = STATUS_CONFIG[kpi.status];
									return (
										<TableRow key={kpi.name} hover>
											<TableCell>
												<Typography variant="body2" fontWeight={500}>
													{kpi.label}
												</Typography>
												{kpi.description && (
													<Typography variant="caption" color="text.secondary">
														{kpi.description}
													</Typography>
												)}
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" color="text.secondary">
													{formatKpiValue(kpi.previousValue, kpi.unit)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" fontWeight={600}>
													{formatKpiValue(kpi.currentValue, kpi.unit)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" fontWeight="bold" sx={{ color: change.color }}>
													{change.text}
												</Typography>
											</TableCell>
											<TableCell align="center">
												<Chip
													label={statusConfig.arrow}
													size="small"
													color={statusConfig.color}
													sx={{ height: 22, fontSize: '0.7rem' }}
												/>
											</TableCell>
										</TableRow>
									);
								})}
								{filteredKpis.length === 0 && (
									<TableRow>
										<TableCell colSpan={5} align="center">
											<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
												데이터가 없습니다.
											</Typography>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Collapse>
		</Paper>
	);
}
