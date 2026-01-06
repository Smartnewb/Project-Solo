'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Skeleton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import type { BackgroundPreset } from '@/types/admin';

interface BackgroundSelectorProps {
  presets: BackgroundPreset[];
  selectedPresetId: string;
  customBackgroundUrl: string;
  backgroundType: 'PRESET' | 'CUSTOM';
  loading?: boolean;
  uploadingBackground?: boolean;
  onPresetSelect: (preset: BackgroundPreset) => void;
  onPresetEdit?: (preset: BackgroundPreset) => void;
  onCustomUpload: (file: File) => void;
  onCustomClear: () => void;
  onBackgroundTypeChange: (type: 'PRESET' | 'CUSTOM') => void;
  onAddPresetClick: () => void;
}

export default function BackgroundSelector({
  presets,
  selectedPresetId,
  customBackgroundUrl,
  backgroundType,
  loading = false,
  uploadingBackground = false,
  onPresetSelect,
  onPresetEdit,
  onCustomUpload,
  onCustomClear,
  onBackgroundTypeChange,
  onAddPresetClick
}: BackgroundSelectorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    onBackgroundTypeChange(newValue === 0 ? 'PRESET' : 'CUSTOM');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.match(/^image\/(jpeg|png)$/)) {
      if (file.size <= 5 * 1024 * 1024) {
        onCustomUpload(file);
      } else {
        alert('파일 크기는 5MB 이하여야 합니다.');
      }
    } else {
      alert('JPG 또는 PNG 파일만 업로드 가능합니다.');
    }
  }, [onCustomUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert('JPG 또는 PNG 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    onCustomUpload(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          배경 이미지
        </Typography>
      </Box>

      <Tabs
        value={backgroundType === 'PRESET' ? 0 : 1}
        onChange={handleTabChange}
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            minHeight: 40,
            textTransform: 'none',
            fontWeight: 500
          },
          '& .Mui-selected': {
            color: '#7A4AE2 !important'
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#7A4AE2'
          }
        }}
      >
        <Tab label="프리셋 선택" />
        <Tab label="직접 업로드" />
      </Tabs>

      {backgroundType === 'PRESET' ? (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={100}
                  height={125}
                  sx={{ flexShrink: 0, borderRadius: 2 }}
                />
              ))}
            </Box>
          ) : presets.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'grey.300'
              }}
            >
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                등록된 프리셋이 없습니다.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={onAddPresetClick}
                sx={{
                  borderColor: '#7A4AE2',
                  color: '#7A4AE2',
                  '&:hover': {
                    borderColor: '#6839CC',
                    bgcolor: 'rgba(122, 74, 226, 0.04)'
                  }
                }}
              >
                첫 프리셋 추가하기
              </Button>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  overflowX: 'auto',
                  pb: 1.5,
                  scrollSnapType: 'x mandatory',
                  '&::-webkit-scrollbar': {
                    height: 6
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'grey.100',
                    borderRadius: 3
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'grey.300',
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: 'grey.400'
                    }
                  }
                }}
              >
                {presets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  const isHovered = hoveredPresetId === preset.id;
                  const imageUrl = preset.imageUrl || preset.thumbnailUrl;
                  return (
                    <Box
                      key={preset.id}
                      onClick={() => onPresetSelect(preset)}
                      onMouseEnter={() => setHoveredPresetId(preset.id)}
                      onMouseLeave={() => setHoveredPresetId(null)}
                      sx={{
                        position: 'relative',
                        flexShrink: 0,
                        width: 100,
                        height: 125,
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        scrollSnapAlign: 'start',
                        border: isSelected ? '3px solid #7A4AE2' : '2px solid transparent',
                        boxShadow: isSelected
                          ? '0 0 0 2px rgba(122, 74, 226, 0.2)'
                          : '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: isSelected
                            ? '0 0 0 2px rgba(122, 74, 226, 0.3)'
                            : '0 4px 12px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      {onPresetEdit && isHovered && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPresetEdit(preset);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            zIndex: 10,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            width: 26,
                            height: 26,
                            '&:hover': {
                              bgcolor: 'white'
                            }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                      {imageUrl ? (
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={preset.displayName}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            console.error('이미지 로드 실패:', imageUrl);
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const placeholder = parent.querySelector('.image-placeholder');
                              if (placeholder) {
                                (placeholder as HTMLElement).style.display = 'flex';
                              }
                            }
                          }}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : null}
                      <Box
                        className="image-placeholder"
                        sx={{
                          display: imageUrl ? 'none' : 'flex',
                          width: '100%',
                          height: '100%',
                          bgcolor: 'grey.200',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 0.5
                        }}
                      >
                        <AddPhotoAlternateIcon sx={{ fontSize: 28, color: 'grey.400' }} />
                        <Typography variant="caption" sx={{ color: 'grey.500', fontSize: 10 }}>
                          이미지 없음
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            bgcolor: '#7A4AE2',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        >
                          <CheckCircleIcon sx={{ color: 'white', fontSize: 16 }} />
                        </Box>
                      )}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                          p: 0.75,
                          pt: 2
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'white',
                            fontWeight: 500,
                            fontSize: 11,
                            lineHeight: 1.2,
                            display: 'block',
                            textAlign: 'center',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }}
                        >
                          {preset.displayName}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}

                <Box
                  onClick={onAddPresetClick}
                  sx={{
                    flexShrink: 0,
                    width: 100,
                    height: 125,
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    bgcolor: 'grey.50',
                    scrollSnapAlign: 'start',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#7A4AE2',
                      bgcolor: 'rgba(122, 74, 226, 0.04)'
                    }
                  }}
                >
                  <AddPhotoAlternateIcon sx={{ fontSize: 28, color: 'grey.400', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    프리셋 추가
                  </Typography>
                </Box>
              </Box>

              {selectedPreset && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: 'rgba(122, 74, 226, 0.04)',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'rgba(122, 74, 226, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#7A4AE2', fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    선택됨: <strong style={{ color: '#7A4AE2' }}>{selectedPreset.displayName}</strong>
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      ) : (
        <Box>
          {!customBackgroundUrl ? (
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                p: 4,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: isDragOver ? '#7A4AE2' : 'grey.300',
                bgcolor: isDragOver ? 'rgba(122, 74, 226, 0.04)' : 'grey.50',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#7A4AE2',
                  bgcolor: 'rgba(122, 74, 226, 0.04)'
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingBackground ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={40} sx={{ color: '#7A4AE2' }} />
                  <Typography color="text.secondary">업로드 중...</Typography>
                </Box>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 48, color: isDragOver ? '#7A4AE2' : 'grey.400', mb: 1 }} />
                  <Typography variant="body1" fontWeight={500} sx={{ mb: 0.5 }}>
                    이미지를 드래그하거나 클릭하여 업로드
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG (최대 5MB) | 권장 비율 4:5
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                position: 'relative',
                display: 'inline-block',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Box
                component="img"
                src={customBackgroundUrl}
                alt="업로드된 배경"
                sx={{
                  width: 160,
                  height: 200,
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  left: 0,
                  p: 0.5,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 0.5,
                  background: 'linear-gradient(rgba(0,0,0,0.3), transparent)'
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'white' }
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onCustomClear}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'white' }
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18, color: 'error.main' }} />
                </IconButton>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.6))'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <CheckCircleIcon sx={{ fontSize: 14 }} />
                  업로드 완료
                </Typography>
              </Box>
            </Box>
          )}

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
          />
        </Box>
      )}
    </Box>
  );
}
