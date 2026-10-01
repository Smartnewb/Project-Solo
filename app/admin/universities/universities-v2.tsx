"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  Tabs,
  TextField,
} from "@heroui/react";
import { Plus as AddIcon, Search as SearchIcon } from "lucide-react";

import { useState, useEffect, useCallback } from "react";

import AdminService from "@/app/services/admin";
import UniversityTable from "./components/UniversityTable";
import UniversityFormDialog from "./components/UniversityFormDialog";
import UniversityDetailDialog from "./components/UniversityDetailDialog";
import type {
  UniversityItem,
  UniversityListParams,
  RegionMetaItem,
  TypeMetaItem,
  UniversityType,
} from "@/types/admin";

type TabValue = "all" | "active" | "inactive";
type LogoSortValue = "default" | "missingFirst";

const PAGE_SIZE = 20;
const BULK_FETCH_SIZE = 100;

function hasLogo(university: UniversityItem) {
  return Boolean(university.logoUrl?.trim());
}

function sortUniversitiesByLogo(
  items: UniversityItem[],
  logoSort: LogoSortValue,
) {
  if (logoSort !== "missingFirst") return items;

  return [...items].sort((a, b) => {
    const logoDiff = Number(hasLogo(a)) - Number(hasLogo(b));
    if (logoDiff !== 0) return logoDiff;
    return a.name.localeCompare(b.name, "ko");
  });
}

function UniversitiesPageContent() {
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [tabValue, setTabValue] = useState<TabValue>("all");
  const [searchName, setSearchName] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterType, setFilterType] = useState<UniversityType | "">("");
  const [logoSort, setLogoSort] = useState<LogoSortValue>("default");

  const [regions, setRegions] = useState<RegionMetaItem[]>([]);
  const [types, setTypes] = useState<TypeMetaItem[]>([]);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editUniversity, setEditUniversity] = useState<UniversityItem | null>(
    null,
  );
  const [selectedUniversity, setSelectedUniversity] =
    useState<UniversityItem | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [page, tabValue, searchName, filterRegion, filterType, logoSort]);

  const loadMetadata = async () => {
    try {
      const [regionsData, typesData] = await Promise.all([
        AdminService.universities.meta.getRegions(),
        AdminService.universities.meta.getTypes(),
      ]);
      setRegions(regionsData);
      setTypes(typesData);
    } catch (err: any) {}
  };

  const loadUniversities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params: UniversityListParams = {
        page,
        limit: PAGE_SIZE,
      };

      if (searchName) params.name = searchName;
      if (filterRegion) params.region = filterRegion;
      if (filterType) params.type = filterType;
      if (tabValue !== "all") {
        params.isActive = tabValue === "active";
      }

      if (logoSort === "missingFirst") {
        const firstPage = await AdminService.universities.getList({
          ...params,
          page: 1,
          limit: BULK_FETCH_SIZE,
        });
        const bulkTotalPages = firstPage.meta.totalPages;
        const restPages =
          bulkTotalPages > 1
            ? await Promise.all(
                Array.from({ length: bulkTotalPages - 1 }, (_, index) =>
                  AdminService.universities.getList({
                    ...params,
                    page: index + 2,
                    limit: BULK_FETCH_SIZE,
                  }),
                ),
              )
            : [];
        const allItems = [firstPage, ...restPages].flatMap(
          (data) => data.items,
        );
        const sortedItems = sortUniversitiesByLogo(allItems, logoSort);
        const start = (page - 1) * PAGE_SIZE;

        setUniversities(sortedItems.slice(start, start + PAGE_SIZE));
        setTotalPages(Math.max(1, Math.ceil(firstPage.meta.total / PAGE_SIZE)));
        setTotalCount(firstPage.meta.total);
        return;
      }

      const data = await AdminService.universities.getList(params);
      setUniversities(sortUniversitiesByLogo(data.items, logoSort));
      setTotalPages(data.meta.totalPages);
      setTotalCount(data.meta.total);
    } catch (err: any) {
      setError(err.message || "대학 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, tabValue, searchName, filterRegion, filterType, logoSort]);

  const handleTabChange = (newValue: TabValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    loadUniversities();
  };

  const handleReset = () => {
    setSearchName("");
    setFilterRegion("");
    setFilterType("");
    setLogoSort("default");
    setPage(1);
  };

  const handleAddClick = () => {
    setEditUniversity(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (university: UniversityItem) => {
    setEditUniversity(university);
    setFormDialogOpen(true);
  };

  const handleViewDetail = (university: UniversityItem) => {
    setSelectedUniversity(university);
    setDetailDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 대학을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      await AdminService.universities.delete(id);
      loadUniversities();
    } catch (err: any) {
      alert(err.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await AdminService.universities.update(id, { isActive });
      loadUniversities();
    } catch (err: any) {
      alert(err.response?.data?.message || "상태 변경에 실패했습니다.");
    }
  };

  const handleFormSubmit = async () => {
    setFormDialogOpen(false);
    loadUniversities();
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditUniversity(null);
  };

  const handleDetailClose = () => {
    setDetailDialogOpen(false);
    setSelectedUniversity(null);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h5 className="text-lg font-semibold text-foreground">대학 관리</h5>
          <p style={{ marginTop: 4 }}>전체 {totalCount}개</p>
        </div>
        <Button onClick={handleAddClick} variant={"primary"}>
          {<AddIcon size={16} />}대학 등록
        </Button>
      </div>
      <Tabs
        selectedKey={tabValue}
        onSelectionChange={(key) => handleTabChange(String(key) as TabValue)}
        style={{ marginBottom: 24 }}
      >
        <Tabs.ListContainer>
          <Tabs.List>
            <Tabs.Tab id={"all"}>
              {"전체"}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id={"active"}>
              {"활성"}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id={"inactive"}>
              {"비활성"}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <TextField style={{ minWidth: 250 }}>
          <Label>{"대학명 검색"}</Label>
          <Input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </TextField>
        <div style={{ minWidth: 150 }}>
          <Select
            selectedKey={filterRegion || null}
            onSelectionChange={(key) => setFilterRegion(String(key ?? ""))}
            aria-label={"지역"}
          >
            <HeroSelectLabel>지역</HeroSelectLabel>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={""} textValue={"전체"}>
                  전체
                </ListBox.Item>
                {regions.map((region) => (
                  <ListBox.Item
                    key={region.code}
                    id={region.code}
                    textValue={String(region.nameLocal)}
                  >
                    {region.nameLocal}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <div style={{ minWidth: 150 }}>
          <Select
            selectedKey={filterType || null}
            onSelectionChange={(key) => {
              setFilterType(String(key ?? "") as UniversityType | "");
              setPage(1);
            }}
            aria-label={"대학 유형"}
          >
            <HeroSelectLabel>대학 유형</HeroSelectLabel>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={""} textValue={"전체"}>
                  전체
                </ListBox.Item>
                {types.map((type) => (
                  <ListBox.Item
                    key={type.code}
                    id={type.code}
                    textValue={String(type.name)}
                  >
                    {type.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <div style={{ minWidth: 170 }}>
          <Select
            selectedKey={logoSort || null}
            onSelectionChange={(key) => {
              setLogoSort(String(key) as LogoSortValue);
              setPage(1);
            }}
            aria-label={"로고 정렬"}
          >
            <HeroSelectLabel>로고 정렬</HeroSelectLabel>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={"default"} textValue={"기본"}>
                  기본
                </ListBox.Item>
                <ListBox.Item id={"missingFirst"} textValue={"로고 없는 순"}>
                  로고 없는 순
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <Button onClick={handleSearch} variant={"primary"}>
          {<SearchIcon size={16} />}검색
        </Button>
        <Button onClick={handleReset} variant={"secondary"}>
          초기화
        </Button>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}
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
      ) : universities.length === 0 ? (
        <div style={{ textAlign: "center", paddingBlock: 64 }}>
          <p>등록된 대학이 없습니다.</p>
        </div>
      ) : (
        <UniversityTable
          universities={universities}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onViewDetail={handleViewDetail}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
      <UniversityFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editUniversity={editUniversity}
        regions={regions}
        types={types}
      />
      {selectedUniversity && (
        <UniversityDetailDialog
          open={detailDialogOpen}
          onClose={handleDetailClose}
          university={selectedUniversity}
          onRefresh={loadUniversities}
        />
      )}
    </div>
  );
}

export default function UniversitiesV2() {
  return <UniversitiesPageContent />;
}
