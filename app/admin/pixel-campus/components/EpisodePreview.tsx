"use client";
import { Button } from "@heroui/react";

import { useEffect, useMemo, useState } from "react";

import type { PixelCampusChoice, PixelCampusCut } from "@/types/admin";

interface Props {
  sceneImageUrl?: string | null;
  cuts: PixelCampusCut[];
  choices: PixelCampusChoice[];
}

const speakerLabels: Record<PixelCampusCut["speaker"], string> = {
  miho: "미호",
  me: "나",
};

export function EpisodePreview({ sceneImageUrl, cuts, choices }: Props) {
  const visibleCuts = useMemo(
    () => cuts.filter((cut) => cut.text.trim()),
    [cuts],
  );
  const previewCuts = visibleCuts.length
    ? visibleCuts
    : [{ speaker: "miho" as const, text: "컷 대사가 여기에 표시됩니다." }];
  const finalStep = previewCuts.length;
  const [step, setStep] = useState(0);
  const isChoicesStep = step >= finalStep;
  const currentCut = previewCuts[Math.min(step, previewCuts.length - 1)];

  useEffect(() => {
    setStep((prev) => Math.min(prev, finalStep));
  }, [finalStep]);

  return (
    <div
      style={{
        width: 375,
        maxWidth: "100%",
        aspectRatio: "375 / 720",
        marginInline: "auto",
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#111322",
        color: "white",
        boxShadow: "0 16px 40px rgba(13,14,36,0.24)",
      }}
    >
      {sceneImageUrl ? (
        <img
          src={sceneImageUrl}
          alt="픽셀 캠퍼스 장면"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        ></img>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#25283A",
          }}
        >
          <p>장면 이미지 없음</p>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(8,9,23,0.42) 0%, rgba(8,9,23,0.08) 34%, rgba(8,9,23,0.88) 100%)",
        }}
      ></div>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", gap: 6, marginBottom: "auto" }}>
          {previewCuts.map((_, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                backgroundColor:
                  index <= Math.min(step, finalStep - 1)
                    ? "#A855F7"
                    : "rgba(255,255,255,0.34)",
              }}
            ></div>
          ))}
        </div>
        <div>
          {!isChoicesStep && (
            <>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  paddingInline: 12,
                  paddingBlock: 6,
                  marginBottom: 8,
                  borderRadius: 999,
                  backgroundColor: "#7C3AED",
                  boxShadow: "0 8px 18px rgba(76,29,149,0.28)",
                }}
              >
                <p>{speakerLabels[currentCut.speaker]}</p>
              </div>
              <div
                style={{
                  padding: 16,
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 2,
                  backgroundColor: "rgba(7,9,24,0.88)",
                  minHeight: 112,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
                }}
              >
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {currentCut.text}
                </p>
              </div>
            </>
          )}
          {isChoicesStep && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {choices.slice(0, 2).map((choice, index) => (
                <Button
                  key={choice.id ?? index}
                  style={{
                    minHeight: 52,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.94)",
                    color: "#151626",
                    justifyContent: "center",
                    textTransform: "none",
                    fontWeight: 800,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
                  }}
                  variant={"primary"}
                >
                  {choice.label || `선택지 ${index + 1}`}
                </Button>
              ))}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 12,
            }}
          >
            <Button
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              style={{
                color: "white",
                borderColor: "rgba(255,255,255,0.42)",
                backgroundColor: "rgba(0,0,0,0.22)",
              }}
              variant={"secondary"}
              isDisabled={step === 0}
            >
              이전
            </Button>
            <Button
              onClick={() => setStep((prev) => Math.min(prev + 1, finalStep))}
              style={{ backgroundColor: "#8B5CF6" }}
              variant={"primary"}
              isDisabled={isChoicesStep}
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
