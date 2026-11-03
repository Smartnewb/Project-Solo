import { getPrivateMatchingLabel } from "@/components/admin/appearance/private-matching-label";

describe("getPrivateMatchingLabel", () => {
  const now = new Date("2026-10-27T12:00:00.000Z");

  it("프라이빗 기록이 없으면 표시하지 않는다", () => {
    expect(getPrivateMatchingLabel(null, null, now)).toBeNull();
    expect(getPrivateMatchingLabel(undefined, undefined, now)).toBeNull();
  });

  it("만료 시각이 지났으면(꺼진 상태) 표시하지 않는다", () => {
    expect(
      getPrivateMatchingLabel("2026-10-27T11:00:00.000Z", "2026-10-01T00:00:00.000Z", now),
    ).toBeNull();
  });

  it("기한 없음(9999년)은 날짜 대신 켠 날을 보여 준다", () => {
    expect(
      getPrivateMatchingLabel("9999-12-31T00:00:00.000Z", "2026-10-27T03:00:00.000Z", now),
    ).toBe("프라이빗 매칭 (2026년 10월 27일부터)");
    expect(getPrivateMatchingLabel("9999-12-31T00:00:00.000Z", null, now)).toBe("프라이빗 매칭");
  });

  it("옛 30일짜리는 끝나는 날을 보여 준다", () => {
    expect(
      getPrivateMatchingLabel("2026-11-10T00:00:00.000Z", "2026-10-11T00:00:00.000Z", now),
    ).toBe("프라이빗 매칭 (~2026년 11월 10일)");
  });

  it("날짜를 읽을 수 없으면 표시하지 않는다", () => {
    expect(getPrivateMatchingLabel("not-a-date", null, now)).toBeNull();
  });
});
