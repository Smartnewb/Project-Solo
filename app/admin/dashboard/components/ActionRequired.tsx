"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Box, Card, CardContent, Typography, Skeleton } from "@mui/material";
import {
  AutoAwesome as ReviewInboxIcon,
  AssignmentInd as ProfileReviewIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import AdminService from "@/app/services/admin";
import { getReviewInbox } from "@/app/services/review-inbox";

interface ActionItemCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  link: string;
  color: string;
  bgColor: string;
  loading?: boolean;
}

function ActionItemCard({
  title,
  count,
  icon,
  link,
  color,
  bgColor,
  loading,
}: ActionItemCardProps) {
  const hasItems = count > 0;

  return (
    <Link href={link} className="block flex-1 min-w-[140px]">
      <Card
        sx={{
          height: "100%",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          border: hasItems ? `2px solid ${color}` : "1px solid #e5e7eb",
          backgroundColor: hasItems ? bgColor : "#f9fafb",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: hasItems
              ? `0 4px 12px ${color}40`
              : "0 4px 12px rgba(0,0,0,0.1)",
          },
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box className="flex items-center gap-3">
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: hasItems ? color : "#9ca3af",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </Box>
            <Box className="flex-1">
              <Typography
                variant="caption"
                sx={{
                  color: hasItems ? "text.primary" : "text.secondary",
                  fontWeight: 500,
                }}
              >
                {title}
              </Typography>
              {loading ? (
                <Skeleton width={40} height={28} />
              ) : (
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: hasItems ? color : "#9ca3af",
                    lineHeight: 1.2,
                  }}
                >
                  {count}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ ml: 0.5, color: "text.secondary" }}
                  >
                    건
                  </Typography>
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ActionRequired() {
  const [pendingReview, setPendingReview] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewInboxPending, setReviewInboxPending] = useState(0);
  const [reviewInboxLoading, setReviewInboxLoading] = useState(true);
  const [pendingCertification, setPendingCertification] = useState(0);
  const [certificationLoading, setCertificationLoading] = useState(true);

  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        setReviewLoading(true);
        const response = await AdminService.userReview.getPendingUsers(1, 1);
        setPendingReview(response.meta?.total ?? 0);
      } catch (_error) {
        setPendingReview(0);
      } finally {
        setReviewLoading(false);
      }
    };

    const fetchReviewInboxCount = async () => {
      try {
        setReviewInboxLoading(true);
        const response = await getReviewInbox();
        setReviewInboxPending(response.summary.approval + response.summary.judgment);
      } catch (_error) {
        setReviewInboxPending(0);
      } finally {
        setReviewInboxLoading(false);
      }
    };

    const fetchCertificationCount = async () => {
      try {
        setCertificationLoading(true);
        const response =
          await AdminService.userAppearance.getUniversityVerificationPending({
            page: 1,
            limit: 1,
          });
        setPendingCertification(
          response.pagination?.total ?? response.total ?? 0,
        );
      } catch (_error) {
        setPendingCertification(0);
      } finally {
        setCertificationLoading(false);
      }
    };

    fetchReviewCount();
    fetchReviewInboxCount();
    fetchCertificationCount();
  }, []);

  const totalPending = pendingReview + reviewInboxPending + pendingCertification;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box className="flex items-center gap-2 mb-4">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: totalPending > 0 ? "#ef4444" : "#22c55e",
              animation: totalPending > 0 ? "pulse 2s infinite" : "none",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.5 },
              },
            }}
          />
          <Typography variant="h6" fontWeight={600}>
            긴급 처리 필요
          </Typography>
          {totalPending > 0 && (
            <Typography
              variant="caption"
              sx={{
                ml: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                fontWeight: 600,
              }}
            >
              총 {totalPending}건
            </Typography>
          )}
        </Box>

        <Box className="flex gap-3 flex-wrap">
          <ActionItemCard
            title="검토 인박스"
            count={reviewInboxPending}
            icon={<ReviewInboxIcon fontSize="small" />}
            link="/admin/review-inbox"
            color="#7c3aed"
            bgColor="#f5f3ff"
            loading={reviewInboxLoading}
          />
          <ActionItemCard
            title="회원 심사"
            count={pendingReview}
            icon={<ProfileReviewIcon fontSize="small" />}
            link="/admin/profile-review"
            color="#3b82f6"
            bgColor="#eff6ff"
            loading={reviewLoading}
          />
          <ActionItemCard
            title="학생증 인증"
            count={pendingCertification}
            icon={<SchoolIcon fontSize="small" />}
            link="/admin/users/appearance?tab=5"
            color="#f59e0b"
            bgColor="#fffbeb"
            loading={certificationLoading}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
