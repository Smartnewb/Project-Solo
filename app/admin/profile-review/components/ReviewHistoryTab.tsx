"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import AdminService, {
  ReviewHistoryFilter,
  ReviewHistoryItem,
  ReviewHistoryResponse,
} from "@/app/services/admin";

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
  const [result, setResult] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  // 이미지 미리보기
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (page: number = 1, limit: number = pagination.limit) => {
      try {
        setLoading(true);
        setError(null);

        const filters: ReviewHistoryFilter = { page, limit };
        if (reviewType) filters.reviewType = reviewType as "admin" | "auto";
        if (result) filters.result = result as "approved" | "rejected";
        if (gender) filters.gender = gender as "MALE" | "FEMALE";
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (search) filters.search = search;

        const response: ReviewHistoryResponse =
          await AdminService.userReview.getReviewHistory(filters);

        setItems(response.items);
        setPagination(response.pagination);
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
    [reviewType, result, gender, startDate, endDate, search, pagination.limit],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    setReviewType("");
    setResult("");
    setGender("");
    setStartDate("");
    setEndDate("");
    setSearch("");
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

  const getResultChip = (resultValue: string) => {
    if (resultValue === "approved") {
      return <Chip label="승인" size="small" color="success" />;
    }
    return <Chip label="반려" size="small" color="error" />;
  };

  const getReviewTypeChip = (type: string) => {
    if (type === "admin") {
      return (
        <Chip label="수동" size="small" variant="outlined" color="primary" />
      );
    }
    return (
      <Chip label="자동" size="small" variant="outlined" color="default" />
    );
  };

  const getSlotLabel = (slotIndex: number, isMain: boolean) => {
    if (isMain || slotIndex === 0) return "대표";
    return `서브 ${slotIndex}`;
  };

  const formatDate = (dateStr: string) => {
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
    reviewType || result || gender || startDate || endDate || search;

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
              value={result}
              label="심사 결과"
              onChange={(e) => setResult(e.target.value)}
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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />

          <TextField
            size="small"
            type="date"
            label="종료일"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />

          <TextField
            size="small"
            placeholder="유저명 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            sx={{ width: 180 }}
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
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Avatar
                        src={item.imageUrl}
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          cursor: "pointer",
                        }}
                        onClick={() => setPreviewImage(item.imageUrl)}
                      />
                    </TableCell>
                    <TableCell>{item.userName}</TableCell>
                    <TableCell>
                      {item.gender === "MALE" ? "남" : "여"}
                    </TableCell>
                    <TableCell>{item.age}</TableCell>
                    <TableCell>
                      {getSlotLabel(item.slotIndex, item.isMain)}
                    </TableCell>
                    <TableCell>{getResultChip(item.result)}</TableCell>
                    <TableCell>{getReviewTypeChip(item.reviewType)}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      {item.rejectionReason ? (
                        <Tooltip
                          title={
                            <>
                              {item.rejectionCategory && (
                                <div>분류: {item.rejectionCategory}</div>
                              )}
                              <div>{item.rejectionReason}</div>
                            </>
                          }
                        >
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
                      {item.reviewerName || (
                        <Typography variant="body2" color="text.secondary">
                          시스템
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(item.reviewedAt)}
                    </TableCell>
                  </TableRow>
                ))
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
