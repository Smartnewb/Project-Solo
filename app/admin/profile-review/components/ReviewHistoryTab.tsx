"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Avatar,
  Chip,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  IconButton,
  CircularProgress,
  Alert,
  Collapse,
  LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AdminService, {
  ReviewHistoryFilter,
  ReviewHistoryItem,
  ReviewHistoryResponse,
  ImageValidationResponse,
} from "@/app/services/admin";

const LIKELIHOOD_CONFIG: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  VERY_UNLIKELY: { label: "매우 낮음", color: "success" },
  UNLIKELY: { label: "낮음", color: "success" },
  POSSIBLE: { label: "가능", color: "warning" },
  LIKELY: { label: "높음", color: "warning" },
  VERY_LIKELY: { label: "매우 높음", color: "error" },
  UNKNOWN: { label: "알 수 없음", color: "default" },
};

function getLikelihoodChip(value: string, label: string) {
  const config = LIKELIHOOD_CONFIG[value] || LIKELIHOOD_CONFIG.UNKNOWN;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
        {label}
      </Typography>
      <Chip label={config.label} size="small" color={config.color} variant="outlined" />
    </Box>
  );
}

function VisionDataCard({ data }: { data: ImageValidationResponse }) {
  const face = data.visionResponse?.[0];

  if (!face) {
    return (
      <Alert severity="info" sx={{ m: 1 }}>
        Vision 응답에 얼굴 데이터가 없습니다.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        mx: 1,
        mb: 1,
        backgroundColor: "#fafafa",
        borderRadius: 1,
        border: "1px solid #e0e0e0",
      }}
    >
      {/* 신뢰도 프로그레스바 */}
      <Box sx={{ display: "flex", gap: 4, mb: 2 }}>
        <Box sx={{ flex: 1, maxWidth: 240 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              얼굴 검출
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {(face.detectionConfidence * 100).toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={face.detectionConfidence * 100}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
        <Box sx={{ flex: 1, maxWidth: 240 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              랜드마크
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {(face.landmarkingConfidence * 100).toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={face.landmarkingConfidence * 100}
            color="secondary"
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </Box>

      {/* Likelihood Chips */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        {getLikelihoodChip(face.joyLikelihood, "기쁨")}
        {getLikelihoodChip(face.sorrowLikelihood, "슬픔")}
        {getLikelihoodChip(face.angerLikelihood, "분노")}
        {getLikelihoodChip(face.surpriseLikelihood, "놀람")}
        {getLikelihoodChip(face.blurredLikelihood, "흐림")}
        {getLikelihoodChip(face.underExposedLikelihood, "저노출")}
        {getLikelihoodChip(face.headwearLikelihood, "모자")}
      </Box>

      {/* 판정 + 각도 */}
      <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">판정:</Typography>
          <Chip
            label={data.autoDecision}
            size="small"
            color={data.autoDecision === "approved" ? "success" : data.autoDecision === "rejected" ? "error" : "default"}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">점수:</Typography>
          <Typography variant="body2" fontWeight={600}>{data.totalScore}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          각도: R {face.rollAngle.toFixed(1)}° / P {face.panAngle.toFixed(1)}° / T {face.tiltAngle.toFixed(1)}°
        </Typography>
        {data.decisionReason && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            {data.decisionReason}
          </Typography>
        )}
      </Box>
    </Box>
  );
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

  const fetchHistory = useCallback(
    async (page: number = 1, limit: number = pagination.limit) => {
      try {
        setLoading(true);
        setError(null);

        const filters: ReviewHistoryFilter = { page, limit };
        if (reviewType) filters.reviewType = reviewType as "admin" | "auto";
        if (reviewStatus)
          filters.reviewStatus = reviewStatus as "approved" | "rejected";
        if (gender) filters.gender = gender as "MALE" | "FEMALE";
        if (from) filters.from = from;
        if (to) filters.to = to;
        if (searchTerm) filters.searchTerm = searchTerm;

        const response: ReviewHistoryResponse =
          await AdminService.userReview.getReviewHistory(filters);

        setItems(response.items);
        setPagination(response.pagination);
        setExpandedImageId(null);
      } catch (err: any) {
        console.error("심사 이력 조회 오류:", err);
        setError(
          err.response?.data?.message ||
            "심사 이력을 불러오는 중 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
      }
    },
    [reviewType, reviewStatus, gender, from, to, searchTerm, pagination.limit],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleToggleVision = async (imageId: string) => {
    if (expandedImageId === imageId) {
      setExpandedImageId(null);
      return;
    }

    setExpandedImageId(imageId);

    if (visionDataCache[imageId] !== undefined) return;

    try {
      setVisionLoading(imageId);
      const data = await AdminService.userReview.getImageValidation(imageId);
      setVisionDataCache((prev) => ({ ...prev, [imageId]: data }));
    } catch (err: any) {
      if (err.response?.status === 404) {
        setVisionDataCache((prev) => ({ ...prev, [imageId]: null }));
      } else {
        console.error("Vision 데이터 조회 오류:", err);
        setVisionDataCache((prev) => ({ ...prev, [imageId]: null }));
      }
    } finally {
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

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newLimit = parseInt(event.target.value, 10);
    fetchHistory(1, newLimit);
  };

  const getResultChip = (status: string) => {
    if (status === "approved") {
      return <Chip label="승인" size="small" color="success" />;
    }
    return <Chip label="반려" size="small" color="error" />;
  };

  const getReviewTypeChip = (type: string | null) => {
    if (type === "admin") {
      return (
        <Chip label="수동" size="small" variant="outlined" color="primary" />
      );
    }
    if (type === "auto") {
      return (
        <Chip label="자동" size="small" variant="outlined" color="default" />
      );
    }
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );
  };

  const getSlotLabel = (slotIndex: number, isMain: boolean) => {
    if (isMain || slotIndex === 0) return "대표";
    return `서브 ${slotIndex}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActiveFilters =
    reviewType || reviewStatus || gender || from || to || searchTerm;

  return (
    <Box>
      {/* 필터 영역 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>심사 유형</InputLabel>
            <Select
              value={reviewType}
              label="심사 유형"
              onChange={(e) => setReviewType(e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="admin">수동 (Admin)</MenuItem>
              <MenuItem value="auto">자동</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>심사 결과</InputLabel>
            <Select
              value={reviewStatus}
              label="심사 결과"
              onChange={(e) => setReviewStatus(e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="approved">승인</MenuItem>
              <MenuItem value="rejected">반려</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>성별</InputLabel>
            <Select
              value={gender}
              label="성별"
              onChange={(e) => setGender(e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="MALE">남성</MenuItem>
              <MenuItem value="FEMALE">여성</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="시작일"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />

          <TextField
            size="small"
            type="date"
            label="종료일"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />

          <TextField
            size="small"
            placeholder="이름, 이메일, 전화번호 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            sx={{ width: 220 }}
            InputProps={{
              endAdornment: (
                <IconButton size="small" onClick={handleSearch}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              ),
            }}
          />

          {hasActiveFilters && (
            <Button size="small" variant="outlined" onClick={handleClearFilters}>
              초기화
            </Button>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 테이블 */}
      <TableContainer component={Paper}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!loading && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>이미지</TableCell>
                <TableCell>유저명</TableCell>
                <TableCell>성별</TableCell>
                <TableCell>나이</TableCell>
                <TableCell>슬롯</TableCell>
                <TableCell>결과</TableCell>
                <TableCell>유형</TableCell>
                <TableCell>반려 사유</TableCell>
                <TableCell>심사자</TableCell>
                <TableCell>심사일시</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      심사 이력이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isAuto = item.reviewType === "auto";
                  const isExpanded = expandedImageId === item.imageId;

                  return (
                    <Fragment key={item.imageId}>
                      <TableRow
                        hover
                        onClick={isAuto ? () => handleToggleVision(item.imageId) : undefined}
                        sx={{
                          cursor: isAuto ? "pointer" : "default",
                          ...(isExpanded && {
                            backgroundColor: "action.selected",
                          }),
                        }}
                      >
                        <TableCell>
                          <Avatar
                            src={item.imageUrl}
                            variant="rounded"
                            sx={{
                              width: 48,
                              height: 48,
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(item.imageUrl);
                            }}
                          />
                        </TableCell>
                        <TableCell>{item.user.name || "-"}</TableCell>
                        <TableCell>
                          {item.user.gender === "MALE"
                            ? "남"
                            : item.user.gender === "FEMALE"
                              ? "여"
                              : "-"}
                        </TableCell>
                        <TableCell>{item.user.age ?? "-"}</TableCell>
                        <TableCell>
                          {getSlotLabel(item.slotIndex, item.isMain)}
                        </TableCell>
                        <TableCell>{getResultChip(item.reviewStatus)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {getReviewTypeChip(item.reviewType)}
                            {isAuto && (
                              isExpanded ? (
                                <ExpandLessIcon fontSize="small" color="action" />
                              ) : (
                                <ExpandMoreIcon fontSize="small" color="action" />
                              )
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {item.rejectionReason ? (
                            <Tooltip title={item.rejectionReason}>
                              <Typography
                                variant="body2"
                                noWrap
                                sx={{ cursor: "help" }}
                              >
                                {item.rejectionReason}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.reviewedBy || (
                            <Typography variant="body2" color="text.secondary">
                              시스템
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(item.reviewedAt)}
                        </TableCell>
                      </TableRow>

                      {/* Vision 데이터 확장 Row */}
                      {isAuto && (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            sx={{ py: 0, borderBottom: isExpanded ? undefined : "none" }}
                          >
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              {visionLoading === item.imageId ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                                  <CircularProgress size={24} />
                                </Box>
                              ) : visionDataCache[item.imageId] === null ? (
                                <Alert severity="info" sx={{ m: 1 }}>
                                  해당 이미지의 Vision 검증 데이터가 없습니다.
                                </Alert>
                              ) : visionDataCache[item.imageId] ? (
                                <VisionDataCard data={visionDataCache[item.imageId]} />
                              ) : null}
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="표시 건수"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / 총 ${count !== -1 ? count : `${to}+`}건`
          }
        />
      </TableContainer>

      {/* 이미지 미리보기 Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "white",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {previewImage && (
            <img
              src={previewImage}
              alt="미리보기"
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                display: "block",
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
