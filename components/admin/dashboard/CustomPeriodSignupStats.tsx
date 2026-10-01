"use client";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";

import { useState, useEffect } from "react";

import { ko } from "date-fns/locale";
import { format, isAfter, isBefore, addDays } from "date-fns";
import AdminService from "@/app/services/admin";
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

// 사용자 지정 기간 회원가입 통계 컴포넌트
export default function CustomPeriodSignupStats() {
  const [startDate, setStartDate] = useState<Date | null>(
    addDays(new Date(), -30),
  ); // 기본값: 30일 전
  const [endDate, setEndDate] = useState<Date | null>(new Date()); // 기본값: 오늘
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupCount, setSignupCount] = useState<number>(0);
  const [trendData, setTrendData] = useState<any[]>([]);

  // 날짜 유효성 검사
  const isDateRangeValid = () => {
    if (!startDate || !endDate) return false;
    if (isAfter(startDate, endDate)) return false;
    return true;
  };

  // 데이터 조회
  const fetchData = async () => {
    if (!isDateRangeValid()) {
      setError("유효한 날짜 범위를 선택해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedStartDate = format(startDate as Date, "yyyy-MM-dd");
      const formattedEndDate = format(endDate as Date, "yyyy-MM-dd");

      // 회원가입자 수 조회
      const countResponse = await AdminService.stats.getCustomPeriodSignupCount(
        formattedStartDate,
        formattedEndDate,
      );

      console.log("회원가입자 수 응답:", countResponse);

      // API 응답 구조 상세 로깅
      console.log("응답 타입:", typeof countResponse);
      if (typeof countResponse === "object" && countResponse !== null) {
        console.log("응답 객체 키:", Object.keys(countResponse));
      }

      // API 응답 구조에 따라 적절한 값 추출
      let count = 0;

      if (typeof countResponse === "number") {
        count = countResponse;
      } else if (typeof countResponse === "object" && countResponse !== null) {
        // totalSignups 필드 확인 (현재 응답 구조에 맞게 추가)
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
            // 배열인 경우 개수 합산
            count = countResponse.data.reduce(
              (sum: number, item: { count?: number }) =>
                sum + (item.count || 0),
              0,
            );
          }
        }
      }

      console.log("추출된 회원가입자 수:", count);
      console.log(
        "필드 확인 - totalSignups 있는지:",
        "totalSignups" in countResponse,
      );
      console.log("전체 응답 객체:", countResponse);
      setSignupCount(count);

      // 회원가입 추이 조회
      const trendResponse = await AdminService.stats.getCustomPeriodSignupTrend(
        formattedStartDate,
        formattedEndDate,
      );

      console.log("회원가입 추이 응답:", trendResponse);

      // API 응답 구조 상세 로깅
      console.log("추이 응답 타입:", typeof trendResponse);
      if (typeof trendResponse === "object" && trendResponse !== null) {
        console.log("추이 응답 객체 키:", Object.keys(trendResponse));
      }

      // 응답 구조에 따라 데이터 추출
      let trendDataArray = [];

      if (Array.isArray(trendResponse)) {
        trendDataArray = trendResponse;
      } else if (typeof trendResponse === "object" && trendResponse !== null) {
        if ("data" in trendResponse && Array.isArray(trendResponse.data)) {
          trendDataArray = trendResponse.data;
        } else if (Array.isArray(trendResponse.items)) {
          trendDataArray = trendResponse.items;
        }
      }

      console.log("추출된 추이 데이터:", trendDataArray);

      // 데이터 포맷팅
      const formattedData = trendDataArray.map((item: any) => {
        try {
          if (!item.date) return { date: "-", 가입자수: item.count || 0 };

          const date = new Date(item.date);
          if (isNaN(date.getTime())) {
            return { date: item.date, 가입자수: item.count || 0 };
          }

          return {
            date: format(date, "MM/dd"),
            가입자수: item.count || 0,
          };
        } catch (e) {
          console.error("날짜 변환 오류:", e, item);
          return { date: item.date || "-", 가입자수: item.count || 0 };
        }
      });

      setTrendData(formattedData);
    } catch (error: any) {
      console.error("사용자 지정 기간 데이터 조회 중 오류:", error);

      // 인증 오류 처리
      if (error.response?.status === 401) {
        setError("인증이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "데이터를 불러오는데 실패했습니다.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    // 시작일과 종료일이 유효한 경우에만 데이터 로드
    if (startDate && endDate && isDateRangeValid()) {
      fetchData();
    }
  }, []);

  return (
    <Card>
      <Card.Content>
        <div className={"text-lg font-semibold text-neutral-900"}>
          기간별 회원가입 통계
        </div>
        <>
          <div
            style={{ marginBottom: 12 }}
            className={"grid grid-cols-1 gap-4 md:grid-cols-2"}
          >
            <div className={"min-w-0"}>
              <TextField className="w-full">
                <Label>{"시작일"}</Label>
                <Input
                  type="date"
                  value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
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
                onClick={fetchData}
                style={{ height: "40px" }}
                variant={"primary"}
                isDisabled={loading || !isDateRangeValid()}
                size={"md"}
                className="rounded-xl"
              >
                {loading ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : (
                  "조회"
                )}
              </Button>
            </div>
          </div>
        </>
        {loading && (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 12 }}
          >
            <Spinner aria-label="불러오는 중" size="sm" />
            <div
              style={{ marginLeft: 8 }}
              className={"text-sm text-neutral-700"}
            >
              데이터를 불러오는 중...
            </div>
          </div>
        )}
        {error && (
          <Alert style={{ marginBottom: 8 }} status="danger" role="alert">
            <Alert.Content>{error}</Alert.Content>
          </Alert>
        )}
        {!loading && (
          <section
            style={{ padding: 8, marginBottom: 12, backgroundColor: "#f5f5f5" }}
          >
            <div className={"text-lg font-semibold text-neutral-900"}>
              선택 기간 내 총 회원가입자 수:{" "}
              <strong id="signup-count">{`${signupCount}명`}</strong>
            </div>
            <div
              style={{ marginTop: 4 }}
              className={"text-sm text-neutral-700"}
            >
              {startDate && endDate
                ? `${format(startDate, "yyyy년 MM월 dd일")} ~ ${format(endDate, "yyyy년 MM월 dd일")}`
                : ""}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div className={"text-sm text-neutral-700"}>
                데이터 로그: {JSON.stringify({ signupCount })}
              </div>
            </div>
          </section>
        )}
        {!loading && (
          <div style={{ marginTop: 12 }}>
            <div className={"text-sm text-neutral-700"}>일별 회원가입 추이</div>
            {trendData.length > 0 ? (
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      interval={Math.max(1, Math.floor(trendData.length / 10))}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="가입자수"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                style={{
                  padding: 12,
                  textAlign: "center",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 4,
                }}
              >
                <div className={"text-sm text-neutral-700"}>
                  선택한 기간에 대한 데이터가 없습니다.
                </div>
              </div>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
