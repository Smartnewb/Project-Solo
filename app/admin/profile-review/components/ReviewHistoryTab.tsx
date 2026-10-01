"use client";
import { Button, Spinner, Chip, Modal, TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { X as CloseIcon, Search as SearchIcon, ChevronDown as ExpandMoreIcon, ChevronUp as ExpandLessIcon } from 'lucide-react';
import { useState, useEffect, useCallback, Fragment } from "react";
import { safeToLocaleString } from '@/app/utils/formatters';
import AdminService, { ReviewHistoryFilter, ReviewHistoryItem, ReviewHistoryResponse, ImageValidationResponse, } from "@/app/services/admin";
const LIKELIHOOD_CONFIG: Record<string, {
    label: string;
    color: "success" | "warning" | "error" | "default";
}> = {
    VERY_UNLIKELY: { label: "매우 낮음", color: "success" },
    UNLIKELY: { label: "낮음", color: "success" },
    POSSIBLE: { label: "가능", color: "warning" },
    LIKELY: { label: "높음", color: "warning" },
    VERY_LIKELY: { label: "매우 높음", color: "error" },
    UNKNOWN: { label: "알 수 없음", color: "default" },
};
function getLikelihoodChip(value: string, label: string) {
    const config = LIKELIHOOD_CONFIG[value] || LIKELIHOOD_CONFIG.UNKNOWN;
    return (<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <p style={{ minWidth: 40 }}>
        {label}
      </p>
      <Chip size="sm">{config.label}</Chip>
    </div>);
}
function VisionDataCard({ data }: {
    data: ImageValidationResponse;
}) {
    const face = data.visionResponse?.[0];
    if (!face) {
        return (<aside role="alert" className="rounded-lg border p-3" style={{ margin: 8 }}>
        Vision 응답에 얼굴 데이터가 없습니다.
      </aside>);
    }
    return (<div style={{ padding: 16, marginInline: 8, marginBottom: 8, backgroundColor: "#fafafa", borderRadius: 1, border: "1px solid #e0e0e0" }}>
      {/* 신뢰도 프로그레스바 */}
      <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
        <div style={{ flex: 1, maxWidth: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <p>
              얼굴 검출
            </p>
            <p>
              {(face.detectionConfidence * 100).toFixed(0)}%
            </p>
          </div>
          <progress value={face.detectionConfidence * 100} style={{ height: 6, borderRadius: 3 }} aria-label="처리 중"></progress>
        </div>
        <div style={{ flex: 1, maxWidth: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <p>
              랜드마크
            </p>
            <p>
              {(face.landmarkingConfidence * 100).toFixed(0)}%
            </p>
          </div>
          <progress value={face.landmarkingConfidence * 100} style={{ height: 6, borderRadius: 3 }} aria-label="처리 중"></progress>
        </div>
      </div>

      {/* Likelihood Chips */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        {getLikelihoodChip(face.joyLikelihood, "기쁨")}
        {getLikelihoodChip(face.sorrowLikelihood, "슬픔")}
        {getLikelihoodChip(face.angerLikelihood, "분노")}
        {getLikelihoodChip(face.surpriseLikelihood, "놀람")}
        {getLikelihoodChip(face.blurredLikelihood, "흐림")}
        {getLikelihoodChip(face.underExposedLikelihood, "저노출")}
        {getLikelihoodChip(face.headwearLikelihood, "모자")}
      </div>

      {/* 판정 + 각도 */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <p>판정:</p>
          <Chip size="sm">{data.autoDecision}</Chip>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <p>점수:</p>
          <p>{data.totalScore}</p>
        </div>
        <p>
          각도: R {face.rollAngle.toFixed(1)}° / P {face.panAngle.toFixed(1)}° / T {face.tiltAngle.toFixed(1)}°
        </p>
        {data.decisionReason && (<p>
            {data.decisionReason}
          </p>)}
      </div>
    </div>);
}
export default function ReviewHistoryTab() {
    const [items, setItems] = useState<ReviewHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
    });
    // 필터 상태
    const [reviewType, setReviewType] = useState<string>("");
    const [reviewStatus, setReviewStatus] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const [from, setFrom] = useState<string>("");
    const [to, setTo] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchInput, setSearchInput] = useState<string>("");
    // 이미지 미리보기
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    // Vision 데이터 확장
    const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
    const [visionDataCache, setVisionDataCache] = useState<Record<string, ImageValidationResponse | null>>({});
    const [visionLoading, setVisionLoading] = useState<string | null>(null);
    const fetchHistory = useCallback(async (page: number = 1, limit: number = pagination.limit) => {
        try {
            setLoading(true);
            setError(null);
            const filters: ReviewHistoryFilter = { page, limit };
            if (reviewType)
                filters.reviewType = reviewType as "admin" | "auto";
            if (reviewStatus)
                filters.reviewStatus = reviewStatus as "approved" | "rejected";
            if (gender)
                filters.gender = gender as "MALE" | "FEMALE";
            if (from)
                filters.from = from;
            if (to)
                filters.to = to;
            if (searchTerm)
                filters.searchTerm = searchTerm;
            const response: ReviewHistoryResponse = await AdminService.userReview.getReviewHistory(filters);
            setItems(response.items);
            setPagination(response.pagination);
            setExpandedImageId(null);
        }
        catch (err: any) {
            setError(err.response?.data?.message ||
                "심사 이력을 불러오는 중 오류가 발생했습니다.");
        }
        finally {
            setLoading(false);
        }
    }, [reviewType, reviewStatus, gender, from, to, searchTerm, pagination.limit]);
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    const handleToggleVision = async (imageId: string) => {
        if (expandedImageId === imageId) {
            setExpandedImageId(null);
            return;
        }
        setExpandedImageId(imageId);
        if (visionDataCache[imageId] !== undefined)
            return;
        try {
            setVisionLoading(imageId);
            const data = await AdminService.userReview.getImageValidation(imageId);
            setVisionDataCache((prev) => ({ ...prev, [imageId]: data }));
        }
        catch (err: any) {
            if (err.response?.status === 404) {
                setVisionDataCache((prev) => ({ ...prev, [imageId]: null }));
            }
            else {
                setVisionDataCache((prev) => ({ ...prev, [imageId]: null }));
            }
        }
        finally {
            setVisionLoading(null);
        }
    };
    const handleSearch = () => {
        setSearchTerm(searchInput);
    };
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };
    const handleClearFilters = () => {
        setReviewType("");
        setReviewStatus("");
        setGender("");
        setFrom("");
        setTo("");
        setSearchTerm("");
        setSearchInput("");
    };
    const handleChangePage = (_: unknown, newPage: number) => {
        fetchHistory(newPage + 1, pagination.limit);
    };
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = parseInt(event.target.value, 10);
        fetchHistory(1, newLimit);
    };
    const getResultChip = (status: string) => {
        if (status === "approved") {
            return <Chip size="sm">{"승인"}</Chip>;
        }
        return <Chip size="sm">{"반려"}</Chip>;
    };
    const getReviewTypeChip = (type: string | null) => {
        if (type === "admin") {
            return (<Chip size="sm">{"수동"}</Chip>);
        }
        if (type === "auto") {
            return (<Chip size="sm">{"자동"}</Chip>);
        }
        return (<p>
        -
      </p>);
    };
    const getSlotLabel = (slotIndex: number, isMain: boolean) => {
        if (isMain || slotIndex === 0)
            return "대표";
        return `서브 ${slotIndex}`;
    };
    const formatDate = (dateStr: string | null) => {
        if (!dateStr)
            return "-";
        return safeToLocaleString(dateStr, "ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    const hasActiveFilters = reviewType || reviewStatus || gender || from || to || searchTerm;
    return (<div>
      {/* 필터 영역 */}
      <section style={{ padding: 16, marginBottom: 16 }} className="rounded-xl border bg-white p-4">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: 120 }}>
            <label>심사 유형</label>
            <Select value={reviewType} aria-label={"심사 유형"} onChange={(key) => {
            const value = String(key ?? "");
            setReviewType(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"admin"} textValue={"\uC218\uB3D9 (Admin)"}>수동 (Admin)</ListBox.Item>
              <ListBox.Item id={"auto"} textValue={"\uC790\uB3D9"}>자동</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>

          <div style={{ minWidth: 120 }}>
            <label>심사 결과</label>
            <Select value={reviewStatus} aria-label={"심사 결과"} onChange={(key) => {
            const value = String(key ?? "");
            setReviewStatus(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"approved"} textValue={"\uC2B9\uC778"}>승인</ListBox.Item>
              <ListBox.Item id={"rejected"} textValue={"\uBC18\uB824"}>반려</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>

          <div style={{ minWidth: 100 }}>
            <label>성별</label>
            <Select value={gender} aria-label={"성별"} onChange={(key) => {
            const value = String(key ?? "");
            setGender(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"MALE"} textValue={"\uB0A8\uC131"}>남성</ListBox.Item>
              <ListBox.Item id={"FEMALE"} textValue={"\uC5EC\uC131"}>여성</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>

          <TextField className="mb-4"><Label>{"시작일"}</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)}></Input></TextField>

          <TextField className="mb-4"><Label>{"종료일"}</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)}></Input></TextField>

          <TextField className="mb-4"><Input aria-label="심사 이력 검색" placeholder="이름, 이메일, 전화번호 검색" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown}></Input></TextField>

          {hasActiveFilters && (<Button onPress={handleClearFilters} variant="secondary">
              초기화
            </Button>)}
        </div>
      </section>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      {/* 테이블 */}
      <div>
        {loading && (<div style={{ display: "flex", justifyContent: "center", paddingBlock: 32 }}>
            <Spinner size="sm"></Spinner>
          </div>)}

        {!loading && (<table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="border-b">
                <th scope="col" className="border-b px-4 py-3">이미지</th>
                <th scope="col" className="border-b px-4 py-3">유저명</th>
                <th scope="col" className="border-b px-4 py-3">성별</th>
                <th scope="col" className="border-b px-4 py-3">나이</th>
                <th scope="col" className="border-b px-4 py-3">슬롯</th>
                <th scope="col" className="border-b px-4 py-3">결과</th>
                <th scope="col" className="border-b px-4 py-3">유형</th>
                <th scope="col" className="border-b px-4 py-3">반려 사유</th>
                <th scope="col" className="border-b px-4 py-3">심사자</th>
                <th scope="col" className="border-b px-4 py-3">심사일시</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (<tr className="border-b">
                  <td colSpan={10} style={{ paddingBlock: 48 }} className="border-b px-4 py-3">
                    <p>
                      심사 이력이 없습니다.
                    </p>
                  </td>
                </tr>) : (items.map((item) => {
                const isAuto = item.reviewType === "auto";
                const isExpanded = expandedImageId === item.imageId;
                return (<Fragment key={item.imageId}>
                      <tr style={{ cursor: isAuto ? "pointer" : "default" }} className="border-b">
                        <td className="border-b px-4 py-3">
                          <img src={item.imageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                        </td>
                        <td className="border-b px-4 py-3">{item.user.name || "-"}</td>
                        <td className="border-b px-4 py-3">
                          {item.user.gender === "MALE"
                        ? "남"
                        : item.user.gender === "FEMALE"
                            ? "여"
                            : "-"}
                        </td>
                        <td className="border-b px-4 py-3">{item.user.age ?? "-"}</td>
                        <td className="border-b px-4 py-3">
                          {getSlotLabel(item.slotIndex, item.isMain)}
                        </td>
                        <td className="border-b px-4 py-3">{getResultChip(item.reviewStatus)}</td>
                        <td className="border-b px-4 py-3">
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {getReviewTypeChip(item.reviewType)}
                            {isAuto && <Button variant="tertiary" isIconOnly aria-label={`${item.user.name || "사용자"} 자동 심사 상세`} aria-expanded={isExpanded} onPress={() => handleToggleVision(item.imageId)}>{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</Button>}
                          </div>
                        </td>
                        <td style={{ maxWidth: 200 }} className="border-b px-4 py-3">
                          {item.rejectionReason ? (<span title={item.rejectionReason}>
                              <p style={{ cursor: "help" }}>
                                {item.rejectionReason}
                              </p>
                            </span>) : (<p>
                              -
                            </p>)}
                        </td>
                        <td className="border-b px-4 py-3">
                          {item.reviewedBy || (<p>
                              시스템
                            </p>)}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }} className="border-b px-4 py-3">
                          {formatDate(item.reviewedAt)}
                        </td>
                      </tr>

                      {/* Vision 데이터 확장 Row */}
                      {isAuto && (<tr className="border-b">
                          <td colSpan={10} style={{ paddingBlock: 0 }} className="border-b px-4 py-3">
                            <div hidden={!isExpanded}>
                              {visionLoading === item.imageId ? (<div style={{ display: "flex", justifyContent: "center", paddingBlock: 16 }}>
                                  <Spinner size="sm"></Spinner>
                                </div>) : visionDataCache[item.imageId] === null ? (<aside role="alert" className="rounded-lg border p-3" style={{ margin: 8 }}>
                                  해당 이미지의 Vision 검증 데이터가 없습니다.
                                </aside>) : visionDataCache[item.imageId] ? (<VisionDataCard data={visionDataCache[item.imageId]!}></VisionDataCard>) : null}
                            </div>
                          </td>
                        </tr>)}
                    </Fragment>);
            }))}
            </tbody>
          </table>)}

        <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={pagination.limit} onChange={(key) => {
            const value = String(key ?? "");
            (handleChangeRowsPerPage)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={20} textValue={"20"}>20</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={pagination.page - 1 <= 0} onPress={() => (handleChangePage)(null, pagination.page - 1 - 1)}>이전</Button><span>{pagination.page - 1 + 1} 페이지 / {pagination.total}개</span><Button variant="secondary" isDisabled={(pagination.page - 1 + 1) * pagination.limit >= pagination.total} onPress={() => (handleChangePage)(null, pagination.page - 1 + 1)}>다음</Button></div>
      </div>

      {/* 이미지 미리보기 Dialog */}
      <Modal.Backdrop isOpen={!!previewImage} onOpenChange={next => {
            if (!next)
                (() => setPreviewImage(null))();
        }}><Modal.Container size="lg"><Modal.Dialog>
        <div style={{ position: "relative" }}>
          <Button onPress={() => setPreviewImage(null)} variant="tertiary" isIconOnly={true} style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", color: "white", zIndex: 1 }}>
            <CloseIcon></CloseIcon>
          </Button>
          {previewImage && (<img src={previewImage} alt="미리보기" style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                display: "block",
            }}></img>)}
        </div>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </div>);
}
