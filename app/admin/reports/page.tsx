"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  Skeleton,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Report as ReportIcon,
  Chat as ChatIcon,
  Photo as PhotoIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import AdminService from "@/app/services/admin";
import UserDetailModal, {
  type UserDetail,
} from "@/components/admin/appearance/UserDetailModal";

interface Reporter {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: "MALE" | "FEMALE";
  profileImageUrl: string;
}

interface Reported {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: "MALE" | "FEMALE";
  profileImageUrl: string;
}

interface Report {
  id: string;
  reporter: Reporter;
  reported: Reported;
  reason: string;
  description: string | null;
  evidenceImages: string[];
  status: "pending" | "reviewing" | "resolved" | "rejected";
  createdAt: string;
  updatedAt: string | null;
  chatRoomId?: string;
}

interface ReportDetail extends Report {
  chatRoomId?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: string;
  mediaUrl?: string;
  createdAt: string;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  maleUser: { id: string; name: string };
  femaleUser: { id: string; name: string };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "pending", label: "대기중" },
  { value: "reviewing", label: "검토중" },
  { value: "resolved", label: "처리완료" },
  { value: "rejected", label: "반려" },
];

const REASONS_REQUIRING_CHAT = ["부적절한 언어 사용", "스팸/광고"];
const REASONS_REQUIRING_PROFILE_IMAGES = ["허위 프로필", "부적절한 사진"];

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reporterNameFilter, setReporterNameFilter] = useState<string>("");
  const [reportedNameFilter, setReportedNameFilter] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(
    null,
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatHistoryResponse | null>(
    null,
  );
  const [chatLoading, setChatLoading] = useState(false);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [profileImagesLoading, setProfileImagesLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>("pending");

  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", (page + 1).toString());
      params.append("limit", rowsPerPage.toString());

      if (statusFilter) {
        params.append("status", statusFilter);
      }
      if (reporterNameFilter.trim()) {
        params.append("reporterName", reporterNameFilter.trim());
      }
      if (reportedNameFilter.trim()) {
        params.append("reportedName", reportedNameFilter.trim());
      }

      const response = await AdminService.getProfileReports(params);

      if (response?.items) {
        setReports(response.items);
        setTotalCount(response.meta.totalItems);
      } else {
        setReports([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      console.error("신고 목록 조회 오류:", err);
      setError("신고 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, statusFilter, reporterNameFilter, reportedNameFilter]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: { target: { value: string } }) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleReporterNameFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setReporterNameFilter(event.target.value);
    setPage(0);
  };

  const handleReportedNameFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setReportedNameFilter(event.target.value);
    setPage(0);
  };

  const handleViewDetail = async (report: Report) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setActiveTab(0);
    setChatHistory(null);
    setProfileImages([]);

    try {
      const detailResponse = await AdminService.reports.getProfileReportDetail(
        report.id,
      );
      const reportDetail: ReportDetail = {
        ...report,
        ...detailResponse,
      };
      setSelectedReport(reportDetail);
      setNewStatus(reportDetail.status);
    } catch (err: unknown) {
      console.error("신고 상세 조회 오류:", err);
      setSelectedReport(report);
      setNewStatus(report.status);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedReport(null);
    setChatHistory(null);
    setProfileImages([]);
    setActiveTab(0);
  };

  const handleLoadChatHistory = useCallback(async () => {
    if (!selectedReport?.chatRoomId) return;

    setChatLoading(true);
    try {
      const response = await AdminService.reports.getChatHistory(
        selectedReport.chatRoomId,
      );
      setChatHistory(response);
    } catch (err: unknown) {
      console.error("채팅 내역 조회 오류:", err);
      alert("채팅 내역을 불러오는데 실패했습니다.");
    } finally {
      setChatLoading(false);
    }
  }, [selectedReport?.chatRoomId]);

  const handleLoadProfileImages = useCallback(async () => {
    if (!selectedReport?.reported?.id) return;

    setProfileImagesLoading(true);
    try {
      const images = await AdminService.reports.getUserProfileImages(
        selectedReport.reported.id,
      );
      setProfileImages(images);
    } catch (err: unknown) {
      console.error("프로필 이미지 조회 오류:", err);
      alert("프로필 이미지를 불러오는데 실패했습니다.");
    } finally {
      setProfileImagesLoading(false);
    }
  }, [selectedReport?.reported?.id]);

  const handleStatusChange = async () => {
    if (!selectedReport) return;

    setStatusUpdating(true);
    try {
      await AdminService.reports.updateReportStatus(
        selectedReport.id,
        newStatus,
      );
      alert("상태가 변경되었습니다.");
      setSelectedReport({ ...selectedReport, status: newStatus });
      fetchReports();
    } catch (err: unknown) {
      console.error("상태 변경 오류:", err);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleOpenUserDetailModal = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailModalOpen(true);
      setUserDetailLoading(true);
      setUserDetailError(null);
      setUserDetail(null);

      const data = await AdminService.userAppearance.getUserDetails(userId);
      setUserDetail(data);
    } catch (err: any) {
      console.error("사용자 상세 정보 조회 오류:", err);
      setUserDetailError(
        err.message || "사용자 정보를 불러오는데 실패했습니다.",
      );
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
    setSelectedUserId(null);
    setUserDetail(null);
    setUserDetailError(null);
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      pending: { label: "대기중", color: "warning" as const },
      reviewing: { label: "검토중", color: "info" as const },
      resolved: { label: "처리완료", color: "success" as const },
      rejected: { label: "반려", color: "error" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      color: "default" as const,
    };
    return (
      <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
    );
  };

  const getGenderText = (gender: string) => {
    return gender === "MALE" ? "남성" : "여성";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatReasonDisplay = (report: Report) => {
    if (report.reason === "기타" && report.description) {
      const truncatedDesc =
        report.description.length > 20
          ? `${report.description.slice(0, 20)}...`
          : report.description;
      return `기타(${truncatedDesc})`;
    }
    return report.reason;
  };

  const requiresChatHistory = (reason: string) =>
    REASONS_REQUIRING_CHAT.includes(reason);
  const requiresProfileImages = (reason: string) =>
    REASONS_REQUIRING_PROFILE_IMAGES.includes(reason);

  const renderChatMessages = () => {
    if (!chatHistory) return null;

    const { messages, maleUser, femaleUser } = chatHistory;
    const reporterId = selectedReport?.reporter?.id;

    return (
      <Box
        sx={{
          maxHeight: 400,
          overflowY: "auto",
          p: 2,
          bgcolor: "#f5f5f5",
          borderRadius: 2,
        }}
      >
        {messages.length === 0 ? (
          <Typography color="text.secondary" textAlign="center">
            채팅 내역이 없습니다.
          </Typography>
        ) : (
          messages.map((msg) => {
            const isReporter = msg.senderId === reporterId;
            const senderLabel =
              msg.senderId === maleUser?.id ? maleUser?.name : femaleUser?.name;

            return (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  justifyContent: isReporter ? "flex-end" : "flex-start",
                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    maxWidth: "70%",
                    bgcolor: isReporter ? "#e3f2fd" : "#fff",
                    p: 1.5,
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    {senderLabel || msg.senderName}
                  </Typography>
                  {msg.messageType === "image" && msg.mediaUrl ? (
                    <Box
                      component="img"
                      src={msg.mediaUrl}
                      alt="채팅 이미지"
                      sx={{ maxWidth: "100%", borderRadius: 1 }}
                    />
                  ) : (
                    <Typography variant="body2">{msg.content}</Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5, textAlign: "right" }}
                  >
                    {formatDate(msg.createdAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    );
  };

  const renderProfileImagesGrid = () => {
    if (profileImagesLoading) {
      return (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (profileImages.length === 0) {
      return (
        <Typography color="text.secondary" textAlign="center" py={4}>
          프로필 이미지가 없습니다.
        </Typography>
      );
    }

    return (
      <ImageList cols={4} gap={12}>
        {profileImages.map((imageUrl, index) => (
          <ImageListItem key={index}>
            <Box
              component="img"
              src={imageUrl}
              alt={`프로필 이미지 ${index + 1}`}
              sx={{
                width: "100%",
                height: 200,
                objectFit: "cover",
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
              onClick={() => window.open(imageUrl, "_blank")}
            />
          </ImageListItem>
        ))}
      </ImageList>
    );
  };

  const renderDetailTabs = () => {
    if (!selectedReport) return null;

    const showChatTab =
      requiresChatHistory(selectedReport.reason) && selectedReport.chatRoomId;
    const showProfileImagesTab = requiresProfileImages(selectedReport.reason);

    const tabs = [{ label: "기본 정보", icon: <DescriptionIcon /> }];

    if (showChatTab) {
      tabs.push({ label: "채팅 내역", icon: <ChatIcon /> });
    }
    if (showProfileImagesTab) {
      tabs.push({ label: "피신고자 프로필 이미지", icon: <PhotoIcon /> });
    }

    const hasTabs = tabs.length > 1;

    return (
      <>
        {hasTabs && (
          <Tabs
            value={activeTab}
            onChange={(_e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        )}

        {activeTab === 0 && renderBasicInfo()}

        {showChatTab && activeTab === 1 && (
          <Box>
            {!chatHistory ? (
              <Box textAlign="center" py={4}>
                <Button
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={handleLoadChatHistory}
                  disabled={chatLoading}
                >
                  {chatLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "채팅 내역 불러오기"
                  )}
                </Button>
              </Box>
            ) : (
              renderChatMessages()
            )}
          </Box>
        )}

        {showProfileImagesTab && activeTab === (showChatTab ? 2 : 1) && (
          <Box>
            {profileImages.length === 0 && !profileImagesLoading ? (
              <Box textAlign="center" py={4}>
                <Button
                  variant="contained"
                  startIcon={<PhotoIcon />}
                  onClick={handleLoadProfileImages}
                  disabled={profileImagesLoading}
                >
                  {profileImagesLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "프로필 이미지 불러오기"
                  )}
                </Button>
              </Box>
            ) : (
              renderProfileImagesGrid()
            )}
          </Box>
        )}
      </>
    );
  };

  const renderBasicInfo = () => {
    if (!selectedReport) return null;

    return (
      <Box>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Typography variant="h6">신고 정보</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>상태 변경</InputLabel>
                  <Select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as ReportStatus)
                    }
                    label="상태 변경"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleStatusChange}
                  disabled={
                    statusUpdating || newStatus === selectedReport.status
                  }
                >
                  {statusUpdating ? <CircularProgress size={20} /> : "변경"}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  신고 ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                  {selectedReport.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  현재 상태
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {getStatusChip(selectedReport.status)}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  신고일시
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedReport.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  최종 수정일시
                </Typography>
                <Typography variant="body1">
                  {selectedReport.updatedAt
                    ? formatDate(selectedReport.updatedAt)
                    : "없음"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  신고 사유
                </Typography>
                <Typography variant="body1">{selectedReport.reason}</Typography>
              </Grid>
              {selectedReport.description && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    상세 설명
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      bgcolor: "#f5f5f5",
                      p: 1.5,
                      borderRadius: 1,
                      mt: 0.5,
                    }}
                  >
                    {selectedReport.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            mb: 3,
            cursor: "pointer",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: 4 },
          }}
          onClick={() => handleOpenUserDetailModal(selectedReport.reporter.id)}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" gutterBottom>
                신고자 정보
              </Typography>
              <Typography variant="caption" color="primary">
                클릭하여 상세 보기
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Avatar
                    src={selectedReport.reporter.profileImageUrl}
                    sx={{ width: 80, height: 80 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      이름
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reporter.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      이메일
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reporter.email || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      전화번호
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reporter.phoneNumber || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      나이/성별
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reporter.age
                        ? `${selectedReport.reporter.age}세`
                        : "-"}{" "}
                      / {getGenderText(selectedReport.reporter.gender)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            mb: 3,
            cursor: "pointer",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: 4 },
          }}
          onClick={() => handleOpenUserDetailModal(selectedReport.reported.id)}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" gutterBottom>
                피신고자 정보
              </Typography>
              <Typography variant="caption" color="primary">
                클릭하여 상세 보기
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Avatar
                    src={selectedReport.reported.profileImageUrl}
                    sx={{ width: 80, height: 80 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      이름
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reported.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      이메일
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reported.email || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      전화번호
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reported.phoneNumber || "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      나이/성별
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reported.age
                        ? `${selectedReport.reported.age}세`
                        : "-"}{" "}
                      / {getGenderText(selectedReport.reported.gender)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {selectedReport.evidenceImages &&
          selectedReport.evidenceImages.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  증거 이미지
                </Typography>
                <Grid container spacing={2}>
                  {selectedReport.evidenceImages.map((imageUrl, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={`증거 이미지 ${index + 1}`}
                        sx={{
                          width: "100%",
                          height: 200,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(imageUrl, "_blank")}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <ReportIcon sx={{ fontSize: 36, mr: 2, color: "primary.main" }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          프로필 신고 관리
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          필터
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="pending">대기중</MenuItem>
                <MenuItem value="reviewing">검토중</MenuItem>
                <MenuItem value="resolved">처리완료</MenuItem>
                <MenuItem value="rejected">반려</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="신고자 이름"
              value={reporterNameFilter}
              onChange={handleReporterNameFilterChange}
              placeholder="신고자 이름 검색"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="피신고자 이름"
              value={reportedNameFilter}
              onChange={handleReportedNameFilterChange}
              placeholder="피신고자 이름 검색"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>신고 ID</TableCell>
                <TableCell>신고자</TableCell>
                <TableCell>피신고자</TableCell>
                <TableCell>신고 사유</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>신고일시</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    신고 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {report.id.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          src={report.reporter.profileImageUrl}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.reporter.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getGenderText(report.reporter.gender)},{" "}
                            {report.reporter.age}세
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          src={report.reported.profileImageUrl}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.reported.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getGenderText(report.reported.gender)},{" "}
                            {report.reported.age}세
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatReasonDisplay(report)}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(report.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(report.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetail(report)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Paper>

      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ReportIcon color="primary" />
            <Typography variant="h6">신고 상세 정보</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedReport ? (
            <Box sx={{ mt: 2 }}>{renderDetailTabs()}</Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>닫기</Button>
        </DialogActions>
      </Dialog>

      {userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={userDetailLoading}
          error={userDetailError}
          onRefresh={fetchReports}
        />
      )}
    </Box>
  );
}
