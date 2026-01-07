"use client";

import Link from "next/link";
import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import {
  People as UsersIcon,
  AutoAwesome as MatchingIcon,
  Diamond as GemsIcon,
  Sms as SmsIcon,
  Notifications as PushIcon,
  Chat as ChatIcon,
  Apple as AppleIcon,
  ViewCarousel as BannerIcon,
} from "@mui/icons-material";

interface QuickAccessItemProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  bgColor: string;
}

function QuickAccessItem({
  title,
  icon,
  link,
  color,
  bgColor,
}: QuickAccessItemProps) {
  return (
    <Link href={link} className="block">
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: color,
            backgroundColor: bgColor,
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
        }}
      >
        <Box className="flex items-center gap-3">
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: bgColor,
              color: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" fontWeight={500}>
            {title}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

const quickAccessItems: QuickAccessItemProps[] = [
  {
    title: "사용자 관리",
    icon: <UsersIcon fontSize="small" />,
    link: "/admin/users/appearance",
    color: "#3b82f6",
    bgColor: "#eff6ff",
  },
  {
    title: "매칭 관리",
    icon: <MatchingIcon fontSize="small" />,
    link: "/admin/matching-management",
    color: "#ec4899",
    bgColor: "#fdf2f8",
  },
  {
    title: "구슬 관리",
    icon: <GemsIcon fontSize="small" />,
    link: "/admin/gems",
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
  {
    title: "SMS 발송",
    icon: <SmsIcon fontSize="small" />,
    link: "/admin/sms",
    color: "#06b6d4",
    bgColor: "#ecfeff",
  },
  {
    title: "푸시 알림",
    icon: <PushIcon fontSize="small" />,
    link: "/admin/push-notifications",
    color: "#f59e0b",
    bgColor: "#fffbeb",
  },
  {
    title: "채팅 관리",
    icon: <ChatIcon fontSize="small" />,
    link: "/admin/chat",
    color: "#10b981",
    bgColor: "#ecfdf5",
  },
  {
    title: "iOS 환불",
    icon: <AppleIcon fontSize="small" />,
    link: "/admin/ios-refund",
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
  {
    title: "배너 관리",
    icon: <BannerIcon fontSize="small" />,
    link: "/admin/banners",
    color: "#ef4444",
    bgColor: "#fef2f2",
  },
];

export default function QuickAccess() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          🛠️ 자주 사용하는 메뉴
        </Typography>

        <Grid container spacing={2}>
          {quickAccessItems.map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item.link}>
              <QuickAccessItem {...item} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
