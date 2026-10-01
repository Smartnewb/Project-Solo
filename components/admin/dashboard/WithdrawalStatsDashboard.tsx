"use client";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  Spinner,
  Tabs,
  TextField,
} from "@heroui/react";

import { useState, useEffect } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { ko } from "date-fns/locale";
import {
  format,
  isAfter,
  isBefore,
  addDays,
  subDays,
  subMonths,
} from "date-fns";
import AdminService from "@/app/services/admin";

// 탭 패널 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`withdrawal-trend-tabpanel-${index}`}
      aria-labelledby={`withdrawal-trend-tab-${index}`}
      {...other}
    >
      {value === index && <div style={{ paddingTop: 12 }}>{children}</div>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `withdrawal-trend-tab-${index}`,
    "aria-controls": `withdrawal-trend-tabpanel-${index}`,
  };
}

// 빈 데이터 생성 함수들
const generateEmptyDailyData = () => {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, "yyyy-MM-dd"),
      count: 0,
    });
  }

  return data;
};

const generateEmptyWeeklyData = () => {
  const data = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = subDays(today, i * 7);
    data.push({
      date: `${format(date, "yyyy-MM-dd")}`,
      count: 0,
    });
  }

  return data;
};

const generateEmptyMonthlyData = () => {
  const data = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(today, i);
    data.push({
      date: format(date, "yyyy-MM"),
      count: 0,
    });
  }

  return data;
};

// 데이터 포맷팅 함수들
const formatData = (data: any[], type: "daily" | "weekly" | "monthly") => {
  return data.map((item) => {
    const label = item.label || item.date || "";
    let formattedDate: string = label;

    try {
      switch (type) {
        case "daily": {
          const date = new Date(label);
          if (!isNaN(date.getTime())) {
            formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
          }
          break;
        }
        case "weekly": {
          if (label.includes(" ~ ")) {
            const weekRange = label.split(" ~ ");
            const startDate = new Date(weekRange[0]);
            if (!isNaN(startDate.getTime())) {
              const month = startDate.getMonth() + 1;
              const day = startDate.getDate();
              formattedDate = `${month}/${day}주`;
            }
          }
          break;
        }
        case "monthly": {
          const monthDate = new Date(label);
          if (!isNaN(monthDate.getTime())) {
            formattedDate = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`;
          }
          break;
        }
      }
    } catch {
      // 포맷팅 실패 시 원본 label 유지
    }

    return {
      date: formattedDate,
      originalDate: item.label,
      탈퇴자수: item.count,
    };
  });
};

const formatDailyData = (data: any[]) => formatData(data, "daily");
const formatWeeklyData = (data: any[]) => formatData(data, "weekly");
const formatMonthlyData = (data: any[]) => formatData(data, "monthly");

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ margin: 0, fontWeight: "bold" }}>{`날짜: ${label}`}</div>
        {data.originalDate && (
          <div style={{ margin: 0, fontSize: "12px", color: "#666" }}>
            {`상세: ${data.originalDate}`}
          </div>
        )}
        <div style={{ margin: 0, color: "#ff7300" }}>
          {`탈퇴자수: ${payload[0].value}명`}
        </div>
      </div>
    );
  }
  return null;
};

// 재사용 가능한 차트 컴포넌트
const WithdrawalChart = ({
  data,
  color,
  interval = 1,
}: {
  data: any[];
  color: string;
  interval?: number;
}) => (
  <div style={{ height: 400 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 90 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          interval={interval}
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="탈퇴자수"
          stroke={color}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

interface WithdrawalStatsDashboardProps {
  region?: string;
  useCluster?: boolean;
}

export default function WithdrawalStatsDashboard({
  region,
  useCluster,
}: WithdrawalStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // 사용자 지정 기간 상태
  const [startDate, setStartDate] = useState<Date | null>(
    subDays(new Date(), 30),
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [customPeriodData, setCustomPeriodData] = useState<any[]>([]);
  const [customPeriodLoading, setCustomPeriodLoading] = useState(false);
  const [customPeriodError, setCustomPeriodError] = useState<string | null>(
    null,
  );

  // 탭 변경 핸들러
  const handleTabChange = (
    event: React.SyntheticEvent | null,
    newValue: number,
  ) => {
    setActiveTab(newValue);
  };

  // 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 일별, 주별, 월별 데이터 조회
        // 기본적으로 비어있는 데이터 생성
        setDailyData(generateEmptyDailyData());
        setWeeklyData(generateEmptyWeeklyData());
        setMonthlyData(generateEmptyMonthlyData());

        // 일별 데이터 조회
        try {
          const dailyResponse =
            await AdminService.stats.getDailyWithdrawalTrend(
              region,
              useCluster,
            );
          console.log("일별 데이터 응답:", dailyResponse);
          if (
            dailyResponse?.data &&
            Array.isArray(dailyResponse.data) &&
            dailyResponse.data.length > 0
          ) {
            setDailyData(dailyResponse.data);
          }
        } catch (err) {
          console.error("일별 데이터 조회 오류:", err);
        }

        // 주별 데이터 조회
        try {
          const weeklyResponse =
            await AdminService.stats.getWeeklyWithdrawalTrend(
              region,
              useCluster,
            );
          console.log("주별 데이터 응답:", weeklyResponse);
          if (
            weeklyResponse?.data &&
            Array.isArray(weeklyResponse.data) &&
            weeklyResponse.data.length > 0
          ) {
            setWeeklyData(weeklyResponse.data);
          }
        } catch (err) {
          console.error("주별 데이터 조회 오류:", err);
        }

        // 월별 데이터 조회
        try {
          const monthlyResponse =
            await AdminService.stats.getMonthlyWithdrawalTrend(
              region,
              useCluster,
            );
          console.log("월별 데이터 응답:", monthlyResponse);
          if (
            monthlyResponse?.data &&
            Array.isArray(monthlyResponse.data) &&
            monthlyResponse.data.length > 0
          ) {
            setMonthlyData(monthlyResponse.data);
          }
        } catch (err) {
          console.error("월별 데이터 조회 오류:", err);
        }
      } catch (err) {
        console.error("회원 탈퇴 추이 데이터 조회 중 오류:", err);
        // 오류가 발생해도 비어있는 데이터 생성
        setDailyData(generateEmptyDailyData());
        setWeeklyData(generateEmptyWeeklyData());
        setMonthlyData(generateEmptyMonthlyData());
        setError("데이터를 불러오는데 실패했습니다. 임시 데이터를 표시합니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region, useCluster]);

  // 사용자 지정 기간 데이터 조회
  const fetchCustomPeriodData = async () => {
    if (!startDate || !endDate) {
      setCustomPeriodError("시작일과 종료일을 모두 선택해주세요.");
      return;
    }

    if (isAfter(startDate, endDate)) {
      setCustomPeriodError("시작일은 종료일보다 이전이어야 합니다.");
      return;
    }

    try {
      setCustomPeriodLoading(true);
      setCustomPeriodError(null);

      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const response = await AdminService.stats.getCustomPeriodWithdrawalTrend(
        formattedStartDate,
        formattedEndDate,
        region,
        useCluster,
      );

      console.log("사용자 지정 기간 데이터 응답:", response);

      if (response && response.data && response.data.length > 0) {
        setCustomPeriodData(response.data);
      } else {
        setCustomPeriodData([]);
        setCustomPeriodError("선택한 기간에 데이터가 없습니다.");
      }
    } catch (err) {
      console.error("사용자 지정 기간 데이터 조회 오류:", err);
      setCustomPeriodData([]);
      setCustomPeriodError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setCustomPeriodLoading(false);
    }
  };

  return (
    <Card>
      <Card.Content>
        <div className={"text-lg font-semibold text-neutral-900"}>
          회원 탈퇴 추이
        </div>
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => handleTabChange(null, Number(key))}
        >
          <Tabs.List aria-label="목록 보기">
            <Tabs.Tab id={0}>{"일별"}</Tabs.Tab>
            <Tabs.Tab id={1}>{"주별"}</Tabs.Tab>
            <Tabs.Tab id={2}>{"월별"}</Tabs.Tab>
            <Tabs.Tab id={3}>{"기간별"}</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        {loading && activeTab < 3 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 40,
              paddingBottom: 40,
            }}
          >
            <Spinner aria-label="불러오는 중" size="sm" />
          </div>
        ) : (
          <>
            {error && activeTab < 3 && (
              <Alert
                style={{ marginTop: 8, marginBottom: 8 }}
                status={"warning"}
                role="alert"
              >
                <Alert.Content>{error}</Alert.Content>
              </Alert>
            )}

            {/* 일별 탭 */}
            <TabPanel value={activeTab} index={0}>
              <WithdrawalChart
                data={formatDailyData(dailyData)}
                color="#ff7300"
                interval={1}
              />
              <div
                style={{ marginTop: 8, textAlign: "center" }}
                className={"text-sm text-neutral-700"}
              >
                최근 30일간 일별 회원 탈퇴 추이
              </div>
            </TabPanel>

            {/* 주별 탭 */}
            <TabPanel value={activeTab} index={1}>
              <WithdrawalChart
                data={formatWeeklyData(weeklyData)}
                color="#ff4500"
                interval={0}
              />
              <div
                style={{ marginTop: 8, textAlign: "center" }}
                className={"text-sm text-neutral-700"}
              >
                최근 12주간 주별 회원 탈퇴 추이
              </div>
            </TabPanel>

            {/* 월별 탭 */}
            <TabPanel value={activeTab} index={2}>
              <WithdrawalChart
                data={formatMonthlyData(monthlyData)}
                color="#d32f2f"
                interval={0}
              />
              <div
                style={{ marginTop: 8, textAlign: "center" }}
                className={"text-sm text-neutral-700"}
              >
                최근 12개월간 월별 회원 탈퇴 추이
              </div>
            </TabPanel>

            {/* 기간별 탭 */}
            <TabPanel value={activeTab} index={3}>
              <>
                <section style={{ padding: 8, marginBottom: 12 }}>
                  <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
                    <div className={"min-w-0"}>
                      <TextField className="w-full">
                        <Label>{"시작일"}</Label>
                        <Input
                          type="date"
                          value={
                            startDate ? format(startDate, "yyyy-MM-dd") : ""
                          }
                          onChange={(event) =>
                            setStartDate(
                              event.target.value
                                ? new Date(event.target.value + "T00:00:00")
                                : null,
                            )
                          }
                        />
                      </TextField>
                    </div>
                    <div className={"min-w-0"}>
                      <TextField className="w-full">
                        <Label>{"종료일"}</Label>
                        <Input
                          type="date"
                          value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                          onChange={(event) =>
                            setEndDate(
                              event.target.value
                                ? new Date(event.target.value + "T00:00:00")
                                : null,
                            )
                          }
                        />
                      </TextField>
                    </div>
                    <div className={"min-w-0"}>
                      <Button
                        onClick={fetchCustomPeriodData}
                        variant={"primary"}
                        isDisabled={
                          customPeriodLoading || !startDate || !endDate
                        }
                        size={"md"}
                        className="rounded-xl"
                      >
                        {customPeriodLoading ? "로딩 중..." : "조회"}
                      </Button>
                    </div>
                  </div>
                  {customPeriodError && (
                    <Alert
                      style={{ marginTop: 8 }}
                      status="danger"
                      role="alert"
                    >
                      <Alert.Content>{customPeriodError}</Alert.Content>
                    </Alert>
                  )}
                </section>
              </>

              {customPeriodLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 40,
                    paddingBottom: 40,
                  }}
                >
                  <Spinner aria-label="불러오는 중" size="sm" />
                </div>
              ) : (
                <>
                  {customPeriodData.length > 0 ? (
                    <WithdrawalChart
                      data={formatDailyData(customPeriodData)}
                      color="#8884d8"
                      interval={Math.max(
                        1,
                        Math.floor(customPeriodData.length / 10),
                      )}
                    />
                  ) : (
                    <div
                      style={{
                        paddingTop: 20,
                        paddingBottom: 20,
                        textAlign: "center",
                      }}
                    >
                      <div className={"text-sm text-neutral-700"}>
                        {customPeriodError ||
                          "조회할 기간을 선택하고 조회 버튼을 클릭하세요."}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabPanel>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
