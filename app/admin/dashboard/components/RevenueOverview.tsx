"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Button,
} from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import { KPI } from "../types";

interface RevenueOverviewProps {
  kpi: KPI | null;
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만`;
  }
  return `${value.toLocaleString()}`;
};

export default function RevenueOverview({
  kpi,
  loading,
}: RevenueOverviewProps) {
  const monthlyRevenue = kpi?.monthlyRevenue ?? 0;

  return (
    <Card>
      <CardContent>
        <Box className="flex items-center justify-between mb-3">
          <Typography variant="h6" fontWeight={600}>
            💰 매출 현황
          </Typography>
          <Link href="/admin/sales" passHref>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{ textTransform: "none" }}
            >
              상세 보기
            </Button>
          </Link>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#ecfdf5",
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            이번 달 매출
          </Typography>
          {loading ? (
            <Skeleton width={150} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700} sx={{ color: "#059669" }}>
              ₩{formatCurrency(monthlyRevenue)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
