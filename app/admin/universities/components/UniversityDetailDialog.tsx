import { Button, Chip, Modal, Spinner, Tabs } from "@heroui/react";
import { GraduationCap as SchoolIcon } from "lucide-react";
import { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import DepartmentManagement from "./DepartmentManagement";
import LogoUpload from "./LogoUpload";
import type { UniversityItem, UniversityDetail } from "@/types/admin";
import { safeToLocaleString } from "@/app/utils/formatters";

interface UniversityDetailDialogProps {
  open: boolean;
  onClose: () => void;
  university: UniversityItem;
  onRefresh: () => void;
}

type TabValue = "info" | "departments" | "logo";

export default function UniversityDetailDialog({
  open,
  onClose,
  university,
  onRefresh,
}: UniversityDetailDialogProps) {
  const [tabValue, setTabValue] = useState<TabValue>("info");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<UniversityDetail | null>(null);

  useEffect(() => {
    if (open) {
      loadDetail();
    }
  }, [open, university.id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await AdminService.universities.getById(university.id);
      setDetail(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newValue: TabValue) => {
    setTabValue(newValue);
  };

  const handleLogoUploaded = () => {
    loadDetail();
    onRefresh();
  };

  const handleDepartmentChanged = () => {
    loadDetail();
    onRefresh();
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="max-w-3xl">
          <Modal.Heading>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {university.logoUrl ? (
                <img
                  src={university.logoUrl}
                  alt={university.name}
                  className="h-12 w-12 rounded-lg object-contain"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <SchoolIcon size={16} />
                </div>
              )}
              <div>
                <h6 className="text-lg font-semibold text-foreground">
                  {university.name}
                </h6>
                {university.en && <p>{university.en}</p>}
              </div>
            </div>
          </Modal.Heading>
          <Tabs
            selectedKey={tabValue}
            onSelectionChange={(key) =>
              handleTabChange(String(key) as TabValue)
            }
            style={{
              paddingInline: 24,
              borderBottom: "1px solid #e4e4e7",
              borderColor: "#52525b",
            }}
          >
            <Tabs.ListContainer>
              <Tabs.List>
                <Tabs.Tab id={"info"}>
                  {"기본 정보"}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id={"departments"}>
                  {`학과 관리 (${detail?.departmentCount || 0})`}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id={"logo"}>
                  {"로고 관리"}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <Modal.Body style={{ minHeight: 400 }}>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingBlock: 64,
                }}
              >
                <Spinner aria-label="로딩 중" />
              </div>
            ) : (
              <>
                {tabValue === "info" && detail && (
                  <div style={{ paddingBlock: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div>
                        <p>대학 ID</p>
                        <p>{detail.id}</p>
                      </div>
                      <hr />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <p>대학 코드</p>
                          <p>{detail.code || "-"}</p>
                        </div>
                        <div>
                          <p>지역</p>
                          <p>{detail.regionName || detail.region}</p>
                        </div>
                        <div>
                          <p>대학 유형</p>
                          <Chip size="sm">
                            {detail.type === "UNIVERSITY" ? "4년제" : "전문대"}
                          </Chip>
                        </div>
                        <div>
                          <p>설립 유형</p>
                          <p>{detail.foundation || "-"}</p>
                        </div>
                        <div>
                          <p>활성화 상태</p>
                          <Chip size="sm">
                            {detail.isActive ? "활성" : "비활성"}
                          </Chip>
                        </div>
                        <div>
                          <p>학과 수</p>
                          <p>{detail.departmentCount || 0}개</p>
                        </div>
                      </div>
                      <hr />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <p>생성일</p>
                          <p>{safeToLocaleString(detail.createdAt)}</p>
                        </div>
                        <div>
                          <p>수정일</p>
                          <p>{safeToLocaleString(detail.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tabValue === "departments" && detail && (
                  <DepartmentManagement
                    university={detail}
                    onChanged={handleDepartmentChanged}
                  />
                )}

                {tabValue === "logo" && detail && (
                  <LogoUpload
                    university={detail}
                    onUploaded={handleLogoUploaded}
                  />
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={onClose} variant={"secondary"}>
              닫기
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
