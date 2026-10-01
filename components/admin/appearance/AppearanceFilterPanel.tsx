"use client";
import {
  Button,
  Card,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";

import { ListFilter, Search, X } from "lucide-react";

import { useState } from "react";

import { AppearanceGrade, Gender } from "@/app/admin/users/appearance/types";
import RegionFilter, {
  Region,
  useRegionFilter,
} from "@/components/admin/common/RegionFilter";

// 등급 옵션
const GRADE_OPTIONS: { value: AppearanceGrade | "all"; label: string }[] = [
  { value: "all", label: "모든 등급" },
  { value: "S", label: "S등급" },
  { value: "A", label: "A등급" },
  { value: "B", label: "B등급" },
  { value: "C", label: "C등급" },
  { value: "UNKNOWN", label: "미분류" }, // 백엔드 API에서 사용하는 값과 일치
];

// 성별 옵션
const GENDER_OPTIONS: { value: Gender | "all"; label: string }[] = [
  { value: "all", label: "모든 성별" },
  { value: "MALE", label: "남성" },
  { value: "FEMALE", label: "여성" },
];

// 장기 미접속자 옵션
const LONG_TERM_INACTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "모든 사용자" },
  { value: "true", label: "장기 미접속자만" },
  { value: "false", label: "정상 사용자만" },
];

// 프로필 정보 입력 여부 옵션
const HAS_PREFERENCES_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "모든 사용자" },
  { value: "true", label: "프로필 입력 완료" },
  { value: "false", label: "프로필 미입력" },
];

// 탈퇴자 포함 여부 옵션
const INCLUDE_DELETED_OPTIONS: { value: string; label: string }[] = [
  { value: "false", label: "활성 사용자만" },
  { value: "true", label: "탈퇴자 포함" },
];

interface AppearanceFilterPanelProps {
  onFilter?: (filters: {
    gender?: Gender;
    appearanceGrade?: AppearanceGrade;
    universityName?: string;
    minAge?: number;
    maxAge?: number;
    searchTerm?: string;
    region?: string;
    useCluster?: boolean;
    isLongTermInactive?: boolean;
    hasPreferences?: boolean;
    includeDeleted?: boolean;
  }) => void;
}

export default function AppearanceFilterPanel({
  onFilter,
}: AppearanceFilterPanelProps) {
  const [gender, setGender] = useState<Gender | "all">("all");
  const [appearanceGrade, setAppearanceGrade] = useState<
    AppearanceGrade | "all"
  >("all");
  const [universityName, setUniversityName] = useState("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLongTermInactive, setIsLongTermInactive] = useState<string>("all");
  const [hasPreferences, setHasPreferences] = useState<string>("all");
  const [includeDeleted, setIncludeDeleted] = useState<string>("false");
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSearchTermChange = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, "");
    if (numbersOnly.length > 0 && value.replace(/[^0-9-]/g, "") === value) {
      setSearchTerm(formatPhoneNumber(value));
    } else {
      setSearchTerm(value);
    }
  };

  // 지역 필터 훅 사용
  const {
    region,
    useCluster,
    setRegion,
    setUseCluster,
    getRegionParam,
    getUseClusterParam,
  } = useRegionFilter();

  // 필터 적용
  const applyFilter = () => {
    if (onFilter) {
      const filters: any = {};

      if (gender !== "all") filters.gender = gender;
      if (appearanceGrade !== "all") filters.appearanceGrade = appearanceGrade;
      if (universityName) filters.universityName = universityName;
      if (minAge !== "") filters.minAge = minAge;
      if (maxAge !== "") filters.maxAge = maxAge;
      if (searchTerm) filters.searchTerm = searchTerm;

      // 지역 필터 적용
      const regionParam = getRegionParam();
      if (regionParam) filters.region = regionParam;
      filters.useCluster = getUseClusterParam();

      if (isLongTermInactive !== "all")
        filters.isLongTermInactive = isLongTermInactive === "true";
      if (hasPreferences !== "all")
        filters.hasPreferences = hasPreferences === "true";
      filters.includeDeleted = includeDeleted === "true";

      onFilter(filters);
    }
  };

  // 필터 초기화
  const resetFilter = () => {
    setGender("all");
    setAppearanceGrade("all");
    setUniversityName("");
    setMinAge("");
    setMaxAge("");
    setSearchTerm("");
    setRegion("ALL"); // 지역 필터 초기화
    setIsLongTermInactive("all");
    setHasPreferences("all");
    setIncludeDeleted("false");

    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Content>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div className={"text-lg font-semibold text-neutral-900"}>
            사용자 필터
          </div>
          <Button
            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
            variant={"ghost"}
            isDisabled={undefined}
            size={"md"}
            className="rounded-xl"
          >
            {<ListFilter />}
            {isAdvancedFilterOpen ? "간단한 필터" : "고급 필터"}
          </Button>
        </div>
        <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
          {/* 기본 필터 */}
          <div className={"min-w-0"}>
            <TextField
              className="w-full"
              isDisabled={undefined}
              isInvalid={undefined}
            >
              <Label>{"검색어"}</Label>
              {
                <span>
                  <Search />
                </span>
              }
              {searchTerm ? (
                <span>
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant={"ghost"}
                    isDisabled={undefined}
                    isIconOnly={true}
                    size={"sm"}
                    className="rounded-lg"
                  >
                    <X />
                  </Button>
                </span>
              ) : null}
              <Input
                placeholder="이름, 인스타그램, 전화번호로 검색"
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyFilter();
                  }
                }}
                aria-label={"검색어"}
              />
            </TextField>
          </div>
          <div className={"min-w-0"}>
            <Select
              selectedKey={appearanceGrade}
              onSelectionChange={(value) =>
                ((e) =>
                  setAppearanceGrade(
                    e.target.value as AppearanceGrade | "all",
                  ))({
                  target: { value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              isDisabled={undefined}
              aria-label={"외모 등급"}
              className="w-full"
            >
              <Label>{"외모 등급"}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {GRADE_OPTIONS.map((option) => (
                    <ListBox.Item
                      key={option.value}
                      id={option.value}
                      textValue={"option.label"}
                    >
                      {option.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div className={"min-w-0"}>
            <Select
              selectedKey={isLongTermInactive}
              onSelectionChange={(value) =>
                ((e) => setIsLongTermInactive(e.target.value))({
                  target: { value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              isDisabled={undefined}
              aria-label={"휴먼유저"}
              className="w-full"
            >
              <Label>{"휴먼유저"}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {LONG_TERM_INACTIVE_OPTIONS.map((option) => (
                    <ListBox.Item
                      key={option.value}
                      id={option.value}
                      textValue={"option.label"}
                    >
                      {option.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div className={"min-w-0"}>
            <Select
              selectedKey={hasPreferences}
              onSelectionChange={(value) =>
                ((e) => setHasPreferences(e.target.value))({
                  target: { value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              isDisabled={undefined}
              aria-label={"프로필 정보"}
              className="w-full"
            >
              <Label>{"프로필 정보"}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {HAS_PREFERENCES_OPTIONS.map((option) => (
                    <ListBox.Item
                      key={option.value}
                      id={option.value}
                      textValue={"option.label"}
                    >
                      {option.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div className={"min-w-0"}>
            <Select
              selectedKey={gender}
              onSelectionChange={(value) =>
                ((e) => setGender(e.target.value as Gender | "all"))({
                  target: { value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              isDisabled={undefined}
              aria-label={"성별"}
              className="w-full"
            >
              <Label>{"성별"}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {GENDER_OPTIONS.map((option) => (
                    <ListBox.Item
                      key={option.value}
                      id={option.value}
                      textValue={"option.label"}
                    >
                      {option.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div className={"min-w-0"}>
            <RegionFilter
              value={region}
              onChange={setRegion}
              useCluster={useCluster}
              onClusterModeChange={setUseCluster}
              showClusterToggle={false}
              size="small"
              fullWidth
            />
          </div>
          {/* 고급 필터 */}
          {isAdvancedFilterOpen && (
            <>
              <div className={"min-w-0"}>
                <TextField
                  className="w-full"
                  isDisabled={undefined}
                  isInvalid={undefined}
                >
                  <Label>{"대학교"}</Label>
                  <Input
                    placeholder="대학교 이름"
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    aria-label={"대학교"}
                  />
                </TextField>
              </div>

              <div className={"min-w-0"}>
                <TextField
                  className="w-full"
                  isDisabled={undefined}
                  isInvalid={undefined}
                >
                  <Label>{"최소 나이"}</Label>
                  <Input
                    type="number"
                    value={minAge}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);
                      setMinAge(value);
                    }}
                    aria-label={"최소 나이"}
                  />
                </TextField>
              </div>

              <div className={"min-w-0"}>
                <TextField
                  className="w-full"
                  isDisabled={undefined}
                  isInvalid={undefined}
                >
                  <Label>{"최대 나이"}</Label>
                  <Input
                    type="number"
                    value={maxAge}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);
                      setMaxAge(value);
                    }}
                    aria-label={"최대 나이"}
                  />
                </TextField>
              </div>

              <div className={"min-w-0"}>
                <Select
                  selectedKey={includeDeleted}
                  onSelectionChange={(value) =>
                    ((e) => setIncludeDeleted(e.target.value))({
                      target: { value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  isDisabled={undefined}
                  aria-label={"탈퇴자 포함 여부"}
                  className="w-full"
                >
                  <Label>{"탈퇴자 포함 여부"}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {INCLUDE_DELETED_OPTIONS.map((option) => (
                        <ListBox.Item
                          key={option.value}
                          id={option.value}
                          textValue={"option.label"}
                        >
                          {option.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </>
          )}
        </div>
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
        >
          <Button
            onClick={resetFilter}
            style={{ marginRight: 4 }}
            variant={"secondary"}
            isDisabled={undefined}
            size={"md"}
            className="rounded-xl"
          >
            초기화
          </Button>
          <Button
            onClick={applyFilter}
            variant={"primary"}
            isDisabled={undefined}
            size={"md"}
            className="rounded-xl"
          >
            필터 적용
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
