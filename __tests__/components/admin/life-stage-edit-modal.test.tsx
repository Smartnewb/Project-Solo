import { describePriceEffect } from "@/components/admin/appearance/modals/LifeStageEditModal";

describe("describePriceEffect", () => {
  it("학생에서 직장인으로 바꾸면 요금이 오른다고 알린다", () => {
    expect(describePriceEffect("UNDERGRAD", "WORKER")).toContain("늘어납니다");
    expect(describePriceEffect(null, "GRAD_STUDENT")).toContain("늘어납니다");
  });

  it("직장인에서 대학생으로 바꾸면 요금이 내려간다고 알린다", () => {
    expect(describePriceEffect("WORKER", "UNDERGRAD")).toContain("내려갑니다");
    expect(describePriceEffect("INTERN", "GRADUATE")).toContain("내려갑니다");
  });

  it("요금 구간이 같거나 그대로면 알리지 않는다", () => {
    expect(describePriceEffect("WORKER", "INTERN")).toBeNull();
    expect(describePriceEffect("UNDERGRAD", "GRADUATE")).toBeNull();
    expect(describePriceEffect("WORKER", "WORKER")).toBeNull();
  });
});
