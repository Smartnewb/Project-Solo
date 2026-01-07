"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Button,
} from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import { format, isAfter, addDays } from "date-fns";
import AdminService from "@/app/services/admin";
import { getRegionLabel } from "@/components/admin/common/RegionFilter";

interface DailySignupTrendItem {
  date: string;
  label?: string;
  count: number;
}

interface WeeklySignupTrendItem {
  weekStart: string;
  weekEnd: string;
  label?: string;
  count: number;
}

interface MonthlySignupTrendItem {
  month: string;
  label?: string;
  count: number;
}

interface SignupStatsDashboardProps {
  region?: string;
  includeDeleted?: boolean;
}

type TabType = "daily" | "weekly" | "monthly" | "custom";

interface ChartDataItem {
  date: string;
  가입자수: number;
}

const TAB_CONFIG: { id: TabType; label: string; color: string }[] = [
  { id: "daily", label: "일별", color: "#8b5cf6" },
  { id: "weekly", label: "주별", color: "#3b82f6" },
  { id: "monthly", label: "월별", color: "#10b981" },
  { id: "custom", label: "기간별", color: "#ec4899" },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
        <p className="text-gray-900 text-lg font-bold">
          {payload[0].value?.toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-1">명</span>
        </p>
      </div>
    );
  }
  return null;
};

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, color, bgColor }: StatCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: bgColor,
        border: `1px solid ${color}20`,
        textAlign: "center",
        minWidth: 100,
        flex: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: color,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontSize: "0.65rem",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          color: "#111827",
          fontWeight: 700,
          mt: 0.5,
          fontSize: "1.1rem",
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </Typography>
    </Box>
  );
}

export default function SignupStatsDashboard({
  region,
  includeDeleted = false,
}: SignupStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [dailyData, setDailyData] = useState<DailySignupTrendItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklySignupTrendItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySignupTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const regionLabel = region ? getRegionLabel(region as any) : "전체 지역";

  const [startDate, setStartDate] = useState<Date | null>(
    addDays(new Date(), -30),
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [signupCount, setSignupCount] = useState<number>(0);
  const [trendData, setTrendData] = useState<ChartDataItem[]>([]);

  const generateEmptyDailyData = () => {
    const data: DailySignupTrendItem[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      data.push({ date: dateStr, count: 0 });
    }
    return data;
  };

  const generateEmptyWeeklyData = () => {
    const data: WeeklySignupTrendItem[] = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const end = new Date();
      end.setDate(today.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      data.push({
        weekStart: start.toISOString().split("T")[0],
        weekEnd: end.toISOString().split("T")[0],
        count: 0,
      });
    }
    return data;
  };

  const generateEmptyMonthlyData = () => {
    const data: MonthlySignupTrendItem[] = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      data.push({ month, count: 0 });
    }
    return data;
  };

  const formatDailyData = (data: DailySignupTrendItem[]): ChartDataItem[] => {
    if (!data || data.length === 0) data = generateEmptyDailyData();
    return data.map((item) => {
      let formattedDate = item.label || item.date;
      if (!item.label && item.date) {
        try {
          const date = new Date(item.date);
          if (!isNaN(date.getTime())) {
            const month = date.getMonth() + 1;
            const day = date.getDate();
            formattedDate = `${month}/${day}`;
          }
        } catch (e) {}
      }
      return { date: formattedDate, 가입자수: item.count };
    });
  };

  const formatWeeklyData = (data: WeeklySignupTrendItem[]): ChartDataItem[] => {
    if (!data || data.length === 0) data = generateEmptyWeeklyData();
    return data.map((item) => {
      let formattedDate = item.label;
      if (!formattedDate) {
        try {
          const startDate = new Date(item.weekStart);
          const endDate = new Date(item.weekEnd);
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const startMonth = startDate.getMonth() + 1;
            const startDay = startDate.getDate();
            const endMonth = endDate.getMonth() + 1;
            const endDay = endDate.getDate();
            formattedDate = `${startMonth}/${startDay}~${endMonth}/${endDay}`;
          }
        } catch (e) {}
      }
      return { date: formattedDate || "", 가입자수: item.count };
    });
  };

  const formatMonthlyData = (
    data: MonthlySignupTrendItem[],
  ): ChartDataItem[] => {
    if (!data || data.length === 0) data = generateEmptyMonthlyData();
    return data.map((item) => {
      let formattedDate = item.label;
      if (!formattedDate) {
        try {
          if (/^\d{4}-\d{2}$/.test(item.month)) {
            const date = new Date(`${item.month}-01T00:00:00`);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              formattedDate = `${year}/${month}`;
            }
          }
        } catch (e) {}
      }
      return { date: formattedDate || "", 가입자수: item.count };
    });
  };

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const dailyResponse = await AdminService.stats.getDailySignupTrend(
            region,
            includeDeleted,
          );
          if (dailyResponse?.data?.length > 0) {
            setDailyData(dailyResponse.data);
          } else {
            setDailyData(generateEmptyDailyData());
          }
        } catch (err) {
          setDailyData(generateEmptyDailyData());
        }

        try {
          const weeklyResponse = await AdminService.stats.getWeeklySignupTrend(
            region,
            includeDeleted,
          );
          if (weeklyResponse?.data?.length > 0) {
            setWeeklyData(weeklyResponse.data);
          } else {
            setWeeklyData(generateEmptyWeeklyData());
          }
        } catch (err) {
          setWeeklyData(generateEmptyWeeklyData());
        }

        try {
          const monthlyResponse =
            await AdminService.stats.getMonthlySignupTrend(
              region,
              includeDeleted,
            );
          if (monthlyResponse?.data?.length > 0) {
            setMonthlyData(monthlyResponse.data);
          } else {
            setMonthlyData(generateEmptyMonthlyData());
          }
        } catch (err) {
          setMonthlyData(generateEmptyMonthlyData());
        }
      } catch (err) {
        setDailyData(generateEmptyDailyData());
        setWeeklyData(generateEmptyWeeklyData());
        setMonthlyData(generateEmptyMonthlyData());
        setError("데이터를 불러오는데 실패했습니다. 임시 데이터를 표시합니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
    const interval = setInterval(fetchTrendData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [region, includeDeleted]);

  const isDateRangeValid = () => {
    if (!startDate || !endDate) return false;
    if (isAfter(startDate, endDate)) return false;
    return true;
  };

  const fetchCustomPeriodData = async () => {
    if (!isDateRangeValid()) {
      setCustomError("유효한 날짜 범위를 선택해주세요.");
      return;
    }

    if (!checkAuthStatus()) return;

    setCustomLoading(true);
    setCustomError(null);

    try {
      const formattedStartDate = format(startDate as Date, "yyyy-MM-dd");
      const formattedEndDate = format(endDate as Date, "yyyy-MM-dd");

      const countResponse = await AdminService.stats.getCustomPeriodSignupCount(
        formattedStartDate,
        formattedEndDate,
        region,
      );

      let count = 0;
      if (typeof countResponse === "number") {
        count = countResponse;
      } else if (typeof countResponse === "object" && countResponse !== null) {
        if ("totalSignups" in countResponse) {
          count = countResponse.totalSignups;
        } else if ("count" in countResponse) {
          count = countResponse.count;
        } else if (
          "data" in countResponse &&
          countResponse.data &&
          typeof countResponse.data === "object"
        ) {
          if ("totalSignups" in countResponse.data) {
            count = countResponse.data.totalSignups;
          } else if ("count" in countResponse.data) {
            count = countResponse.data.count;
          } else if (
            Array.isArray(countResponse.data) &&
            countResponse.data.length > 0
          ) {
            count = countResponse.data.reduce(
              (sum: number, item: any) => sum + (item.count || 0),
              0,
            );
          }
        }
      }

      setSignupCount(count);

      const trendResponse = await AdminService.stats.getCustomPeriodSignupTrend(
        formattedStartDate,
        formattedEndDate,
        region,
        includeDeleted,
      );

      let trendDataArray: any[] = [];
      if (Array.isArray(trendResponse)) {
        trendDataArray = trendResponse;
      } else if (typeof trendResponse === "object" && trendResponse !== null) {
        if ("data" in trendResponse && Array.isArray(trendResponse.data)) {
          trendDataArray = trendResponse.data;
        } else if (Array.isArray((trendResponse as any).items)) {
          trendDataArray = (trendResponse as any).items;
        }
      }

      const formattedData = trendDataArray.map((item: any) => {
        try {
          if (item.label) {
            return { date: item.label, 가입자수: item.count || 0 };
          }
          if (!item.date) return { date: "-", 가입자수: item.count || 0 };
          const date = new Date(item.date);
          if (isNaN(date.getTime())) {
            return { date: item.date, 가입자수: item.count || 0 };
          }
          return { date: format(date, "MM/dd"), 가입자수: item.count || 0 };
        } catch (e) {
          return {
            date: item.date || item.label || "-",
            가입자수: item.count || 0,
          };
        }
      });

      setTrendData(formattedData);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setCustomError("인증이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        setCustomError(
          error.response?.data?.message ||
            error.message ||
            "데이터를 불러오는데 실패했습니다.",
        );
      }
    } finally {
      setCustomLoading(false);
    }
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem("accessToken");
    const isAdmin = localStorage.getItem("isAdmin");
    if (!token || isAdmin !== "true") {
      setCustomError("관리자 권한이 필요합니다. 다시 로그인해주세요.");
      return false;
    }
    return true;
  };

  const handleAllPeriod = () => {
    setStartDate(new Date("2024-01-01"));
    setEndDate(new Date());
  };

  useEffect(() => {
    if (!checkAuthStatus()) return;
    if (startDate && endDate && isDateRangeValid()) {
      fetchCustomPeriodData();
    }
  }, []);

  const currentChartData = useMemo((): ChartDataItem[] => {
    switch (activeTab) {
      case "daily":
        return formatDailyData(dailyData);
      case "weekly":
        return formatWeeklyData(weeklyData);
      case "monthly":
        return formatMonthlyData(monthlyData);
      case "custom":
        return trendData;
      default:
        return [];
    }
  }, [activeTab, dailyData, weeklyData, monthlyData, trendData]);

  const stats = useMemo(() => {
    const values = currentChartData.map((d) => d.가입자수);
    if (values.length === 0) return { total: 0, avg: 0, max: 0, min: 0 };
    const total = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);
    return { total, avg, max, min };
  }, [currentChartData]);

  const currentColor =
    TAB_CONFIG.find((t) => t.id === activeTab)?.color || "#8b5cf6";

  const getXAxisInterval = () => {
    const len = currentChartData.length;
    if (len <= 7) return 0;
    if (len <= 14) return 1;
    if (len <= 30) return 2;
    return Math.floor(len / 10);
  };

  const getPeriodDescription = () => {
    switch (activeTab) {
      case "daily":
        return "최근 30일간 일별 회원가입 추이";
      case "weekly":
        return "최근 12주간 주별 회원가입 추이";
      case "monthly":
        return "최근 12개월간 월별 회원가입 추이";
      case "custom":
        if (startDate && endDate) {
          return `${format(startDate, "yyyy.MM.dd")} ~ ${format(endDate, "yyyy.MM.dd")}`;
        }
        return "사용자 지정 기간";
      default:
        return "";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Box className="flex items-center gap-2 flex-wrap">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
              style={{
                backgroundColor: activeTab === tab.id ? tab.color : undefined,
                boxShadow:
                  activeTab === tab.id
                    ? `0 4px 14px ${tab.color}40`
                    : undefined,
              }}
            >
              {tab.label}
            </button>
          ))}
        </Box>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 1,
            borderRadius: 2,
            backgroundColor: "#f3f4f6",
            color: "#6b7280",
            fontWeight: 500,
          }}
        >
          {regionLabel}
        </Typography>
      </Box>

      {loading && activeTab !== "custom" ? (
        <Box className="flex items-center justify-center py-20">
          <CircularProgress sx={{ color: currentColor }} size={40} />
        </Box>
      ) : (
        <>
          {error && activeTab !== "custom" && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {activeTab === "custom" && (
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={ko}
            >
              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#fdf2f8",
                  border: "1px solid #fbcfe8",
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="시작일"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          sx: {
                            backgroundColor: "white",
                            borderRadius: 1,
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1.5,
                            },
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="종료일"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          sx: {
                            backgroundColor: "white",
                            borderRadius: 1,
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1.5,
                            },
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Button
                      variant="outlined"
                      onClick={handleAllPeriod}
                      fullWidth
                      sx={{
                        height: 40,
                        borderRadius: 1.5,
                        borderColor: "#ec4899",
                        color: "#ec4899",
                        fontWeight: 600,
                        "&:hover": {
                          borderColor: "#db2777",
                          backgroundColor: "#fdf2f8",
                        },
                      }}
                    >
                      전체 기간
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Button
                      variant="contained"
                      onClick={fetchCustomPeriodData}
                      disabled={customLoading || !isDateRangeValid()}
                      fullWidth
                      sx={{
                        height: 40,
                        borderRadius: 1.5,
                        backgroundColor: "#ec4899",
                        fontWeight: 600,
                        boxShadow: "0 4px 14px rgba(236, 72, 153, 0.3)",
                        "&:hover": {
                          backgroundColor: "#db2777",
                        },
                        "&:disabled": {
                          backgroundColor: "#f9a8d4",
                        },
                      }}
                    >
                      {customLoading ? (
                        <CircularProgress size={20} sx={{ color: "white" }} />
                      ) : (
                        "조회"
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </LocalizationProvider>
          )}

          {customError && activeTab === "custom" && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {customError}
            </Alert>
          )}

          <Box className="flex gap-3 mb-6 flex-wrap">
            <StatCard
              label="총 가입"
              value={activeTab === "custom" ? signupCount : stats.total}
              color={currentColor}
              bgColor={`${currentColor}10`}
            />
            <StatCard
              label="평균"
              value={stats.avg}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
            <StatCard
              label="최대"
              value={stats.max}
              color="#10b981"
              bgColor="#ecfdf5"
            />
            <StatCard
              label="최소"
              value={stats.min}
              color="#f59e0b"
              bgColor="#fffbeb"
            />
          </Box>

          {(activeTab !== "custom" || !customLoading) && (
            <Box
              sx={{
                height: 360,
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(180deg, ${currentColor}05 0%, transparent 100%)`,
                  borderRadius: 3,
                  pointerEvents: "none",
                },
              }}
            >
              {currentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={currentChartData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient
                        id={`gradient-${activeTab}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={currentColor}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={currentColor}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      interval={getXAxisInterval()}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="가입자수"
                      stroke={currentColor}
                      strokeWidth={2.5}
                      fill={`url(#gradient-${activeTab})`}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: currentColor,
                        stroke: "white",
                        strokeWidth: 3,
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box className="flex items-center justify-center h-full">
                  <Typography color="textSecondary" sx={{ fontSize: 14 }}>
                    {activeTab === "custom"
                      ? "기간을 선택하고 조회해주세요."
                      : "데이터가 없습니다."}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
            }}
          >
            {getPeriodDescription()}
          </Typography>
        </>
      )}
    </Box>
  );
}
