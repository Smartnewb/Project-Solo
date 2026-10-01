"use client";
import { Alert, Button, Input, Label, Spinner, TextField } from "@heroui/react";

import { useState, useEffect } from "react";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg px-3 py-2">
          <div className={"text-sm text-neutral-700"}>{payload[0].name}</div>
          <div
            className={"text-sm text-neutral-700"}
          >{`${payload[0].value}명 (${payload[0].payload.percentage.toFixed(1)}%)`}</div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner aria-label="불러오는 중" size="sm" />
        <div className={"text-sm text-neutral-700"}>
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error && reasonStats.length === 0) {
    return (
      <div className="py-6">
        <Alert status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      </div>
    );
  }

  const totalCount = reasonStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="overflow-hidden">
      <div className="mb-4 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
        <div className={"flex flex-wrap items-center gap-2"}>
          <TextField
            className="w-full"
            isDisabled={undefined}
            isInvalid={undefined}
          >
            <Label>{"시작일"}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ minWidth: 140 }}
              aria-label={"시작일"}
            />
          </TextField>
          <TextField
            className="w-full"
            isDisabled={undefined}
            isInvalid={undefined}
          >
            <Label>{"종료일"}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ minWidth: 140 }}
              aria-label={"종료일"}
            />
          </TextField>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Button
              onClick={handlePeriodSearch}
              style={{
                textTransform: "none",
                backgroundColor: "#6366f1",
                fontSize: "0.8125rem",
              }}
              variant={"primary"}
              isDisabled={loading}
              size={"sm"}
              className="rounded-xl"
            >
              조회
            </Button>
            <Button
              onClick={handleResetPeriod}
              style={{
                textTransform: "none",
                borderColor: "#e2e8f0",
                color: "#64748b",
                fontSize: "0.8125rem",
              }}
              variant={"secondary"}
              isDisabled={loading}
              size={"sm"}
              className="rounded-xl"
            >
              전체
            </Button>
          </div>
        </div>
        {periodError && (
          <Alert
            className="mt-2"
            style={{ paddingTop: 2, paddingBottom: 2, fontSize: "0.8125rem" }}
            status="danger"
            role="alert"
          >
            <Alert.Content>{periodError}</Alert.Content>
          </Alert>
        )}
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <div className="w-full h-[260px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formatChartData()}
                  cx="50%"
                  cy="50%"
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
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className={"text-sm text-neutral-700"}>
                {totalCount.toLocaleString()}
              </div>
              <div className={"text-sm text-neutral-700"}>총 탈퇴</div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2">
          <div style={{ maxHeight: 280 }} className={"overflow-x-auto"}>
            <table
              className={
                "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
              }
            >
              <thead>
                <tr>
                  <th
                    style={{
                      backgroundColor: "#f8fafc",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "#475569",
                      borderBottom: "1px solid #e2e8f0",
                      paddingTop: 6,
                      paddingBottom: 6,
                    }}
                  >
                    탈퇴 사유
                  </th>
                  <th
                    style={{
                      backgroundColor: "#f8fafc",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "#475569",
                      borderBottom: "1px solid #e2e8f0",
                      paddingTop: 6,
                      paddingBottom: 6,
                    }}
                  >
                    인원
                  </th>
                  <th
                    style={{
                      backgroundColor: "#f8fafc",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "#475569",
                      borderBottom: "1px solid #e2e8f0",
                      paddingTop: 6,
                      paddingBottom: 6,
                    }}
                  >
                    비율
                  </th>
                </tr>
              </thead>
              <tbody>
                {reasonStats.map((row, index) => (
                  <tr key={index} style={{}}>
                    <td
                      style={{
                        fontSize: "0.8125rem",
                        color: "#334155",
                        paddingTop: 5,
                        paddingBottom: 5,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="truncate">
                          {row.displayName || row.reason}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        fontSize: "0.8125rem",
                        color: "#475569",
                        fontWeight: 500,
                        paddingTop: 5,
                        paddingBottom: 5,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.count.toLocaleString()}
                    </td>
                    <td
                      style={{
                        fontSize: "0.8125rem",
                        color: "#64748b",
                        paddingTop: 5,
                        paddingBottom: 5,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {error && (
        <Alert
          className="mt-4"
          style={{
            fontSize: "0.8125rem",
            paddingTop: 2,
            paddingBottom: 2,
            backgroundColor: "#f0f9ff",
            borderColor: "#bae6fd",
          }}
          status={"default"}
          role="alert"
        >
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
    </div>
  );
}
