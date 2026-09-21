'use client';

import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RestoreIcon from '@mui/icons-material/Restore';
import type { StyleReferenceItem } from '@/app/services/admin';
import { getKeywordMeta, CATEGORY_LABELS, GENDER_LABELS } from '../constants';

interface StyleReferenceCardProps {
  item: StyleReferenceItem;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  isLoading?: boolean;
}

export function StyleReferenceCard({
  item,
  onDeactivate,
  onReactivate,
  isLoading,
}: StyleReferenceCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{ opacity: item.isActive ? 1 : 0.5, position: 'relative' }}
    >
      <CardMedia
        component="img"
        height={120}
        image={item.thumbnailUrl ?? item.imageUrl}
        alt={`${GENDER_LABELS[item.gender]} ${CATEGORY_LABELS[item.category]}`}
        sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
      />

      {!item.isActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'error.main',
            color: 'white',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          비활성
        </Box>
      )}

      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
          {item.tags.slice(0, 3).map((tag) => {
            const meta = getKeywordMeta(tag);
            return (
              <Chip
                key={tag}
                label={meta ? `${meta.emoji} ${meta.nameKo}` : tag}
                size="small"
                sx={{ fontSize: 10, height: 20 }}
              />
            );
          })}
          {item.tags.length > 3 && (
            <Chip
              label={`+${item.tags.length - 3}`}
              size="small"
              sx={{ fontSize: 10, height: 20 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {GENDER_LABELS[item.gender]} · {CATEGORY_LABELS[item.category]}
          </Typography>

          {item.isActive ? (
            <Tooltip title="비활성화">
              <span>
                <IconButton
                  size="small"
                  color="default"
                  disabled={isLoading}
                  onClick={() => onDeactivate(item.id)}
                >
                  <VisibilityOffIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="재활성화">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={isLoading}
                  onClick={() => onReactivate(item.id)}
                >
                  <RestoreIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
