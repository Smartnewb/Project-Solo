"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AdminService from "@/app/services/admin";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export default function WithdrawalReasonStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonStats, setReasonStats] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [periodError, setPeriodError] = useState<string | null>(null);

  const getDefaultReasonStats = () => [
    {
      reason: "FOUND_PARTNER",
      displayName: "파트너를 찾아서",
      count: 0,
      percentage: 0,
    },
    {
      reason: "POOR_MATCHING",
      displayName: "매칭 품질이 좋지 않아서",
      count: 0,
      percentage: 0,
    },
    {
      reason: "PRIVACY_CONCERN",
      displayName: "개인정보 보호 우려",
      count: 0,
      percentage: 0,
    },
    {
      reason: "SAFETY_CONCERN",
      displayName: "안전 우려",
      count: 0,
      percentage: 0,
    },
    {
      reason: "TECHNICAL_ISSUES",
      displayName: "기술적 문제",
      count: 0,
      percentage: 0,
    },
    {
      reason: "INACTIVE_USAGE",
      displayName: "서비스를 잘 사용하지 않아서",
      count: 0,
      percentage: 0,
    },
    {
      reason: "DISSATISFIED_SERVICE",
      displayName: "서비스에 불만족",
      count: 0,
      percentage: 0,
    },
    { reason: "OTHER", displayName: "기타 사유", count: 0, percentage: 0 },
  ];

  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    setPeriodError(null);

    try {
      const response = await AdminService.stats.getWithdrawalReasonStats(
        start,
        end,
      );
      console.log("탈퇴 사유 통계 응답:", response);

      if (
        response?.reasons &&
        Array.isArray(response.reasons) &&
        response.reasons.length > 0
      ) {
        setReasonStats(response.reasons);
      } else {
        console.warn("탈퇴 사유 데이터가 없습니다. 기본 데이터를 사용합니다.");
        setReasonStats(getDefaultReasonStats());
        setError("탈퇴 사유 데이터가 없습니다. 샘플 데이터를 표시합니다.");
      }
    } catch (error) {
      console.error("탈퇴 사유 통계 API 호출 실패:", error);
      console.error(
        "오류 상세:",
        error instanceof Error ? error.message : "알 수 없는 오류",
      );

      setReasonStats(getDefaultReasonStats());
      setError("데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSearch = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        setPeriodError("시작일은 종료일보다 이전이어야 합니다.");
        return;
      }
      fetchData(startDate, endDate);
    } else if (startDate || endDate) {
      setPeriodError("시작일과 종료일을 모두 입력해주세요.");
    } else {
      fetchData();
    }
  };

  const handleResetPeriod = () => {
    setStartDate("");
    setEndDate("");
    setPeriodError(null);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatChartData = () => {
    return reasonStats.map((item) => ({
      name: item.displayName || item.reason,
      value: item.count,
      percentage: item.percentage,
    }));
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg px-3 py-2">
          <Typography className="text-sm font-medium text-slate-800">
            {payload[0].name}
          </Typography>
          <Typography className="text-sm text-slate-600">
            {`${payload[0].value}명 (${payload[0].payload.percentage.toFixed(1)}%)`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <Box className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 px-2">
        {payload.map((entry: any, index: number) => (
          <Box key={`legend-${index}`} className="flex items-center gap-1.5">
            <Box
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <Typography className="text-xs text-slate-600 whitespace-nowrap">
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center py-12">
        <CircularProgress size={28} className="text-indigo-500" />
        <Typography className="ml-3 text-sm text-slate-500">
          데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (error && reasonStats.length === 0) {
    return (
      <Box className="py-6">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const totalCount = reasonStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <Box className="overflow-hidden">
      <Box className="mb-4 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          flexWrap="wrap"
        >
          <TextField
            label="시작일"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              minWidth: 140,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
                fontSize: "0.875rem",
              },
            }}
          />
          <TextField
            label="종료일"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              minWidth: 140,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
                fontSize: "0.875rem",
              },
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={handlePeriodSearch}
              disabled={loading}
              size="small"
              sx={{
                textTransform: "none",
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
                boxShadow: "none",
                fontSize: "0.8125rem",
              }}
            >
              조회
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetPeriod}
              disabled={loading}
              size="small"
              sx={{
                textTransform: "none",
                borderColor: "#e2e8f0",
                color: "#64748b",
                "&:hover": {
                  borderColor: "#cbd5e1",
                  backgroundColor: "white",
                },
                fontSize: "0.8125rem",
              }}
            >
              전체
            </Button>
          </Stack>
        </Stack>
        {periodError && (
          <Alert
            severity="error"
            className="mt-2"
            sx={{ py: 0.5, fontSize: "0.8125rem" }}
          >
            {periodError}
          </Alert>
        )}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        <Box className="w-full lg:w-1/2 flex flex-col items-center">
          <Box className="w-full h-[260px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formatChartData()}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {formatChartData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={renderCustomLegend}
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <Typography className="text-2xl font-bold text-slate-800">
                {totalCount.toLocaleString()}
              </Typography>
              <Typography className="text-xs text-slate-500">
                총 탈퇴
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className="w-full lg:w-1/2">
          <TableContainer
            component={Paper}
            elevation={0}
            className="border border-slate-200 rounded-lg overflow-hidden"
            sx={{ maxHeight: 280 }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: "#f8fafc",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "#475569",
                      borderBottom: "1px solid #e2e8f0",
                      py: 1.5,
                    }}
                  >
                    탈퇴 사유
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: "#f8fafc",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "#475569",
                      borderBottom: "1px solid #e2e8f0",
                      py: 1.5,
                    }}
                  >
                    인원
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: "#f8fafc",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "#475569",
                      borderBottom: "1px solid #e2e8f0",
                      py: 1.5,
                    }}
                  >
                    비율
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reasonStats.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:hover": { backgroundColor: "#f8fafc" },
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontSize: "0.8125rem",
                        color: "#334155",
                        py: 1.25,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <Box className="flex items-center gap-2">
                        <Box
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="truncate">
                          {row.displayName || row.reason}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontSize: "0.8125rem",
                        color: "#475569",
                        fontWeight: 500,
                        py: 1.25,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.count.toLocaleString()}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontSize: "0.8125rem",
                        color: "#64748b",
                        py: 1.25,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="info"
          className="mt-4"
          sx={{
            fontSize: "0.8125rem",
            py: 0.5,
            backgroundColor: "#f0f9ff",
            borderColor: "#bae6fd",
            "& .MuiAlert-icon": { color: "#0ea5e9" },
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}
