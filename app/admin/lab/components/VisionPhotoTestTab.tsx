"use client";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Button,
  Disclosure,
  Card,
  Chip,
  ProgressBar,
  Spinner,
  Tooltip,
} from "@heroui/react";
import {
  CloudUpload as CloudUploadIcon,
  CircleCheck as CheckCircleIcon,
  CircleX as CancelIcon,
  TriangleAlert as WarningIcon,
  ScanFace as FaceIcon,
  Rotate3D as AngleIcon,
  Smile as ExpressionIcon,
  BadgeCheck as QualityIcon,
  Ticket as ActivityIcon,
  Shield as SecurityIcon,
  ChevronDown as ExpandMoreIcon,
  Image as ImageIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
} from "lucide-react";

import { useState, useCallback } from "react";

import { adminRequest } from "@/shared/lib/http/admin-fetch";

interface PhotoValidationResult {
  totalScore: number;
  breakdown: {
    face: number;
    angle: number;
    expression: number;
    quality: number;
    activity: number;
    safeSearchPenalty: number;
  };
  reasons: {
    face: string;
    angle: string;
    expression: string;
    quality: string;
    activity: string;
    safeSearch: string;
  };
  decision: {
    autoDecision: "approved" | "manual_review" | "rejected";
    reason: string;
    priority: "high" | "normal" | "low";
  };
  isInappropriate: boolean;
  faceAnalysis: {
    faceCount: number;
    primaryFace: {
      confidence: number;
      faceRatio: number;
      panAngle: number;
      tiltAngle: number;
      joyLikelihood: string;
    } | null;
  };
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
    isInappropriate: boolean;
    requiresManualReview: boolean;
  };
  labelAnalysis: {
    hasActivityLabels: boolean;
    activityLabels: string[];
    topLabels: { description: string; score: number }[];
  };
  qualityAnalysis: {
    width: number;
    height: number;
    fileSize: number;
    blurVariance: number;
    longEdge: number;
    isValid: boolean;
  };
  processingTimeMs: number;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
};

const getDecisionBadge = (decision: string) => {
  switch (decision) {
    case "approved":
      return {
        label: "자동 승인",
        color: "success" as const,
        icon: <CheckCircleIcon size={16} />,
      };
    case "manual_review":
      return {
        label: "수동 검토",
        color: "warning" as const,
        icon: <WarningIcon size={16} />,
      };
    case "rejected":
      return {
        label: "반려",
        color: "error" as const,
        icon: <CancelIcon size={16} />,
      };
    default:
      return {
        label: "알 수 없음",
        color: "default" as const,
        icon: <InfoIcon size={16} />,
      };
  }
};

const getLikelihoodColor = (likelihood: string): string => {
  switch (likelihood) {
    case "VERY_UNLIKELY":
    case "UNLIKELY":
      return "#22c55e";
    case "POSSIBLE":
      return "#eab308";
    case "LIKELY":
    case "VERY_LIKELY":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ScoreGauge = ({
  score,
  size = 160,
}: {
  score: number;
  size?: number;
}) => {
  const color = getScoreColor(score);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        marginInline: "auto",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <h3>{score}</h3>
        <p>/ 100점</p>
      </div>
    </div>
  );
};

const ScoreBreakdownCard = ({
  icon,
  label,
  score,
  maxScore,
  reason,
  isPenalty = false,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  maxScore: number;
  reason: string;
  isPenalty?: boolean;
}) => {
  const percentage = isPenalty ? 0 : (score / maxScore) * 100;
  const displayScore = isPenalty ? -score : score;

  return (
    <Card style={{ marginBottom: 16 }}>
      <Card.Content style={{ paddingBlock: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {icon}
          <p>{label}</p>
          <div style={{ flexGrow: 1 }}></div>
          <p
            style={{ color: isPenalty ? "#ef4444" : getScoreColor(percentage) }}
          >
            {displayScore}점 / {isPenalty ? "감점" : `${maxScore}점`}
          </p>
        </div>
        {!isPenalty && (
          <ProgressBar value={percentage} aria-label="점수">
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        )}
        <Tooltip>
          <Tooltip.Trigger>
            <p
              style={{
                marginTop: 8,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "help",
              }}
            >
              {reason}
            </p>
          </Tooltip.Trigger>
          <Tooltip.Content>{reason}</Tooltip.Content>
        </Tooltip>
      </Card.Content>
    </Card>
  );
};

const AngleIndicator = ({
  panAngle,
  tiltAngle,
}: {
  panAngle: number;
  tiltAngle: number;
}) => {
  const maxAngle = 45;
  const panNormalized = Math.max(-maxAngle, Math.min(maxAngle, panAngle));
  const tiltNormalized = Math.max(-maxAngle, Math.min(maxAngle, tiltAngle));

  return (
    <div
      style={{
        position: "relative",
        width: 100,
        height: 100,
        marginInline: "auto",
        marginBlock: 16,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: "2px solid #e5e7eb",
          transform: "translate(-50%, -50%)",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: "#3b82f6",
          transform: `translate(calc(-50% + ${(panNormalized / maxAngle) * 30}px), calc(-50% + ${(tiltNormalized / maxAngle) * 30}px))`,
          transition: "transform 0.3s ease",
        }}
      ></div>
      <p
        style={{
          position: "absolute",
          top: -5,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        상
      </p>
      <p
        style={{
          position: "absolute",
          bottom: -5,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        하
      </p>
      <p
        style={{
          position: "absolute",
          left: -10,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        좌
      </p>
      <p
        style={{
          position: "absolute",
          right: -10,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        우
      </p>
    </div>
  );
};

export default function VisionPhotoTestTab() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoValidationResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [],
  );

  const handleFile = async (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(heic|heif)$/i)
    ) {
      setError(
        "지원하지 않는 파일 형식입니다. JPEG, PNG, WebP, HEIC 파일만 업로드 가능합니다.",
      );
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("파일 크기가 20MB를 초과했습니다.");
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const data = await adminRequest<PhotoValidationResult>(
        "/admin/v2/photo-validation/test",
        {
          method: "POST",
          body: formData,
        },
      );
      setResult(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "사진 검증 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const decisionBadge = result
    ? getDecisionBadge(result.decision.autoDecision)
    : null;

  return (
    <div>
      <p style={{ marginBottom: 24 }}>
        프로필 사진을 업로드하여 AI 검증 결과를 테스트합니다. 실제 DB에 저장되지
        않습니다.
      </p>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 24 }}
        >
          {error}
          <Button
            variant="secondary"
            aria-label="알림 닫기"
            onClick={() => setError(null)}
          >
            닫기
          </Button>
        </div>
      )}
      <div className="grid grid-cols-12 gap-4">
        <div className="min-w-0 col-span-12 md:col-span-4">
          <div
            className="h-auto w-full justify-start whitespace-normal text-left"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              padding: 32,
              border: "2px dashed",
              borderColor: "#e4e4e7",
              borderRadius: 2,
              backgroundColor: isDragging ? "#e4e4e7" : "#fafafa",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              style={{ display: "none" }}
              onChange={handleFileInput}
            />
            <HeroActionButton
              variant="ghost"
              className="h-auto w-full flex-col whitespace-normal p-0"
              onClick={() => document.getElementById("file-input")?.click()}
              aria-label="사진 업로드"
              isDisabled={isLoading}
            >
              {isLoading ? (
                <div>
                  <Spinner aria-label="로딩 중" />
                  <p>검증 중...</p>
                </div>
              ) : (
                <>
                  <CloudUploadIcon size={16} />
                  <h6>이미지를 드래그하거나 클릭하여 업로드</h6>
                  <p>JPEG, PNG, WebP, HEIC (최대 20MB)</p>
                </>
              )}
            </HeroActionButton>
          </div>
          {previewUrl && (
            <div style={{ marginTop: 16, padding: 16 }}>
              <p style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ImageIcon size={16} />
                업로드된 이미지
              </p>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 1,
                }}
              ></img>
            </div>
          )}
        </div>
        <div className="min-w-0 col-span-12 md:col-span-8">
          {result && (
            <div>
              <div style={{ padding: 24, marginBottom: 24 }}>
                <div className="grid grid-cols-12 gap-4">
                  <div className="min-w-0 col-span-12 sm:col-span-4">
                    <ScoreGauge score={result.totalScore} />
                  </div>
                  <div className="min-w-0 col-span-12 sm:col-span-8">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 16,
                      }}
                    >
                      <Chip size="sm">
                        {decisionBadge?.icon}
                        {decisionBadge?.label}
                      </Chip>
                      <Chip size="sm">{`우선순위: ${result.decision.priority === "high" ? "높음" : result.decision.priority === "normal" ? "보통" : "낮음"}`}</Chip>
                    </div>
                    <p
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <TimerIcon size={16} />
                      처리 시간: {result.processingTimeMs}ms
                    </p>
                    {result.isInappropriate && (
                      <div
                        role="alert"
                        className="rounded-lg border border-default p-3 text-sm"
                        style={{ marginTop: 16 }}
                      >
                        부적절한 콘텐츠가 감지되었습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <h6 style={{ marginTop: 24 }}>점수 상세 내역</h6>
              <div className="grid grid-cols-12 gap-4">
                <div className="min-w-0 col-span-12 md:col-span-6">
                  <ScoreBreakdownCard
                    icon={<FaceIcon size={16} />}
                    label="얼굴 감지"
                    score={result.breakdown.face}
                    maxScore={40}
                    reason={result.reasons.face}
                  />
                  <ScoreBreakdownCard
                    icon={<AngleIcon size={16} />}
                    label="얼굴 각도"
                    score={result.breakdown.angle}
                    maxScore={15}
                    reason={result.reasons.angle}
                  />
                  <ScoreBreakdownCard
                    icon={<ExpressionIcon size={16} />}
                    label="표정"
                    score={result.breakdown.expression}
                    maxScore={10}
                    reason={result.reasons.expression}
                  />
                </div>
                <div className="min-w-0 col-span-12 md:col-span-6">
                  <ScoreBreakdownCard
                    icon={<QualityIcon size={16} />}
                    label="이미지 품질"
                    score={result.breakdown.quality}
                    maxScore={25}
                    reason={result.reasons.quality}
                  />
                  <ScoreBreakdownCard
                    icon={<ActivityIcon size={16} />}
                    label="활동 라벨"
                    score={result.breakdown.activity}
                    maxScore={10}
                    reason={result.reasons.activity}
                  />
                  {result.breakdown.safeSearchPenalty > 0 && (
                    <ScoreBreakdownCard
                      icon={<SecurityIcon size={16} />}
                      label="SafeSearch 감점"
                      score={result.breakdown.safeSearchPenalty}
                      maxScore={100}
                      reason={result.reasons.safeSearch}
                      isPenalty
                    />
                  )}
                </div>
              </div>
              <Disclosure>
                <Disclosure.Heading>
                  <Disclosure.Trigger className="w-full py-3 text-left">
                    <p
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <FaceIcon size={16} />
                      얼굴 분석 상세
                    </p>
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="min-w-0 col-span-12 sm:col-span-6">
                      <p>감지된 얼굴 수</p>
                      <h6>{result.faceAnalysis.faceCount}개</h6>
                    </div>
                    {result.faceAnalysis.primaryFace && (
                      <>
                        <div className="min-w-0 col-span-6 sm:col-span-3">
                          <p>신뢰도</p>
                          <h6>
                            {(
                              result.faceAnalysis.primaryFace.confidence * 100
                            ).toFixed(1)}
                            %
                          </h6>
                        </div>
                        <div className="min-w-0 col-span-6 sm:col-span-3">
                          <p>얼굴 비율</p>
                          <h6>
                            {(
                              result.faceAnalysis.primaryFace.faceRatio * 100
                            ).toFixed(1)}
                            %
                          </h6>
                        </div>
                        <div className="min-w-0 col-span-12">
                          <p style={{ textAlign: "center" }}>
                            얼굴 각도 (Pan:{" "}
                            {result.faceAnalysis.primaryFace.panAngle.toFixed(
                              1,
                            )}
                            °, Tilt:{" "}
                            {result.faceAnalysis.primaryFace.tiltAngle.toFixed(
                              1,
                            )}
                            °)
                          </p>
                          <AngleIndicator
                            panAngle={result.faceAnalysis.primaryFace.panAngle}
                            tiltAngle={
                              result.faceAnalysis.primaryFace.tiltAngle
                            }
                          />
                        </div>
                        <div className="min-w-0 col-span-12">
                          <p>밝은 표정 가능성</p>
                          <Chip size="sm">
                            {result.faceAnalysis.primaryFace.joyLikelihood}
                          </Chip>
                        </div>
                      </>
                    )}
                  </div>
                </Disclosure.Content>
              </Disclosure>
              <Disclosure>
                <Disclosure.Heading>
                  <Disclosure.Trigger className="w-full py-3 text-left">
                    <p
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <SecurityIcon size={16} />
                      SafeSearch 분석
                    </p>
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="min-w-0 col-span-4">
                      <p>성인 콘텐츠</p>
                      <Chip size="sm">{result.safeSearch.adult}</Chip>
                    </div>
                    <div className="min-w-0 col-span-4">
                      <p>폭력성</p>
                      <Chip size="sm">{result.safeSearch.violence}</Chip>
                    </div>
                    <div className="min-w-0 col-span-4">
                      <p>선정성</p>
                      <Chip size="sm">{result.safeSearch.racy}</Chip>
                    </div>
                  </div>
                </Disclosure.Content>
              </Disclosure>
              <Disclosure>
                <Disclosure.Heading>
                  <Disclosure.Trigger className="w-full py-3 text-left">
                    <p
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <ActivityIcon size={16} />
                      라벨 분석
                    </p>
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  {result.labelAnalysis.activityLabels.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p>활동 라벨</p>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {result.labelAnalysis.activityLabels.map((label) => (
                          <Chip key={label} size="sm">
                            {label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  <p>상위 라벨</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {result.labelAnalysis.topLabels.map((label) => (
                      <Tooltip key={label.description}>
                        <Tooltip.Trigger>
                          <Chip size="sm">{`${label.description} (${(label.score * 100).toFixed(0)}%)`}</Chip>
                        </Tooltip.Trigger>
                        <Tooltip.Content>{`신뢰도: ${(label.score * 100).toFixed(1)}%`}</Tooltip.Content>
                      </Tooltip>
                    ))}
                  </div>
                </Disclosure.Content>
              </Disclosure>
              <Disclosure>
                <Disclosure.Heading>
                  <Disclosure.Trigger className="w-full py-3 text-left">
                    <p
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <QualityIcon size={16} />
                      이미지 품질
                    </p>
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="min-w-0 col-span-6 sm:col-span-3">
                      <p>해상도</p>
                      <p>
                        {result.qualityAnalysis.width}x{" "}
                        {result.qualityAnalysis.height}
                      </p>
                    </div>
                    <div className="min-w-0 col-span-6 sm:col-span-3">
                      <p>긴 변</p>
                      <p>{result.qualityAnalysis.longEdge}px</p>
                    </div>
                    <div className="min-w-0 col-span-6 sm:col-span-3">
                      <p>파일 크기</p>
                      <p>{formatFileSize(result.qualityAnalysis.fileSize)}</p>
                    </div>
                    <div className="min-w-0 col-span-6 sm:col-span-3">
                      <p>선명도 (Blur Variance)</p>
                      <p>{result.qualityAnalysis.blurVariance.toFixed(2)}</p>
                    </div>
                  </div>
                </Disclosure.Content>
              </Disclosure>
            </div>
          )}
          {!result && !isLoading && (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ImageIcon size={16} />
              <h6>이미지를 업로드하면 분석 결과가 여기에 표시됩니다</h6>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
