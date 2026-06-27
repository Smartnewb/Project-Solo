import { Box, FormControl, InputLabel, MenuItem, Paper, Select, TextField } from '@mui/material';
import type { ReactNode } from 'react';
import type { RegistryFilters } from './push-registry-model';

type Props = {
	categories: string[];
	filters: RegistryFilters;
	onChange: (filters: RegistryFilters) => void;
};

export function PushRegistryFilters({ categories, filters, onChange }: Props) {
	const setFilter = (key: keyof RegistryFilters, value: string) => onChange({ ...filters, [key]: value });

	return (
		<Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1 }}>
			<Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
				<TextField
					label="검색"
					value={filters.search}
					onChange={(event) => setFilter('search', event.target.value)}
					size="small"
				/>
				<RegistrySelect label="카테고리" id="category" value={filters.category} onChange={(value) => setFilter('category', value)}>
					<MenuItem value="all">전체</MenuItem>
					{categories.map((category) => (
						<MenuItem key={category} value={category}>
							{category}
						</MenuItem>
					))}
				</RegistrySelect>
				<RegistrySelect label="트리거" id="trigger" value={filters.trigger} onChange={(value) => setFilter('trigger', value)}>
					<MenuItem value="all">전체</MenuItem>
					<MenuItem value="event">event</MenuItem>
					<MenuItem value="cron">cron</MenuItem>
				</RegistrySelect>
				<RegistrySelect label="소스" id="direct" value={filters.direct} onChange={(value) => setFilter('direct', value)}>
					<MenuItem value="all">전체</MenuItem>
					<MenuItem value="registry-only">registry만</MenuItem>
					<MenuItem value="direct-only">직접발송만</MenuItem>
				</RegistrySelect>
				<RegistrySelect label="대상" id="audience" value={filters.audience} onChange={(value) => setFilter('audience', value)}>
					<MenuItem value="all">전체</MenuItem>
					<MenuItem value="single">single</MenuItem>
					<MenuItem value="query">query</MenuItem>
				</RegistrySelect>
				<RegistrySelect label="저장" id="persistence" value={filters.persistence} onChange={(value) => setFilter('persistence', value)}>
					<MenuItem value="all">전체</MenuItem>
					<MenuItem value="persisted">저장됨</MenuItem>
					<MenuItem value="none">저장 안 함</MenuItem>
				</RegistrySelect>
				<RegistrySelect label="Throttle" id="throttle" value={filters.throttle} onChange={(value) => setFilter('throttle', value)}>
					<MenuItem value="all">전체</MenuItem>
					<MenuItem value="enabled">있음</MenuItem>
					<MenuItem value="disabled">없음</MenuItem>
				</RegistrySelect>
				<RegistrySelect label="채팅방 억제" id="suppress" value={filters.suppressInRoom} onChange={(value) => setFilter('suppressInRoom', value)}>
					<MenuItem value="all">전체</MenuItem>
					<MenuItem value="true">true</MenuItem>
					<MenuItem value="false">false</MenuItem>
				</RegistrySelect>
			</Box>
		</Paper>
	);
}

function RegistrySelect({
	id,
	label,
	value,
	onChange,
	children,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	children: ReactNode;
}) {
	const labelId = `push-registry-${id}-label`;
	return (
		<FormControl size="small">
			<InputLabel id={labelId}>{label}</InputLabel>
			<Select labelId={labelId} label={label} value={value} onChange={(event) => onChange(event.target.value)}>
				{children}
			</Select>
		</FormControl>
	);
}
