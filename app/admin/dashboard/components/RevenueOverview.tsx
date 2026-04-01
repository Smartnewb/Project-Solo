"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { KPI } from "../types";
import { useRevenueSummary } from "@/app/admin/hooks/use-revenue-v2";

interface RevenueOverviewProps {
  kpi: KPI | null;
  loading?: boolean;
}

const formatCurrency = (value: number | undefined | null) => {
  const v = value ?? 0;
  if (v >= 100000000) {
    return `${(v / 100000000).toFixed(1)}억`;
  }
  if (v >= 10000000) {
    return `${(v / 10000).toFixed(0)}만`;
  }
  if (v >= 10000) {
    return `${(v / 10000).toFixed(1)}만`;
  }
  return `${v.toLocaleString()}`;
};

export default function RevenueOverview({
  kpi,
  loading,
}: RevenueOverviewProps) {
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return {
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${d}`,
    };
  }, []);

  const {
    data: v2Summary,
    isLoading: v2Loading,
  } = useRevenueSummary(startDate, endDate);

  const isLoading = loading || v2Loading;
  const totalRevenue = v2Summary?.totalRevenue ?? kpi?.monthlyRevenue ?? 0;
  const pgRevenue = v2Summary?.pgRevenue ?? 0;
  const iapRevenue = v2Summary?.iapRevenue ?? 0;

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

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Skeleton
              variant="rectangular"
              height={80}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rectangular"
              height={60}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#ecfdf5" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.875rem" }}
              >
                이번 달 매출
              </Typography>
              <Typography
                fontWeight={700}
                sx={{ color: "#059669", fontSize: "1.75rem" }}
              >
                ₩{formatCurrency(totalRevenue)}
              </Typography>
            </Box>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box
                  sx={{ p: 1.5, borderRadius: 1, backgroundColor: "#f0f9ff" }}
                >
                  <Typography variant="caption" color="text.secondary">
                    PG 매출
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    ₩{formatCurrency(pgRevenue)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{ p: 1.5, borderRadius: 1, backgroundColor: "#fefce8" }}
                >
                  <Typography variant="caption" color="text.secondary">
                    IAP 매출
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    ₩{formatCurrency(iapRevenue)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
