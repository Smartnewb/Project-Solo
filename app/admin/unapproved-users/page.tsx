"use client";

import { Box, Typography } from "@mui/material";
import UnclassifiedUsersPanel from "@/components/admin/appearance/UnclassifiedUsersPanel";

export default function UnapprovedUsersPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        미승인 유저
      </Typography>
      <UnclassifiedUsersPanel
        title="UNKNOWN 미승인 유저"
        description="UNKNOWN rank 유저를 한 화면에서 확인하고, 등급 설정과 승인 처리를 진행합니다."
        initialViewMode="table"
      />
    </Box>
  );
}
