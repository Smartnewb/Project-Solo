import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import VisionPhotoTest from "@/app/admin/lab/lab-v2";
import { adminRequest } from "@/shared/lib/http/admin-fetch";
jest.mock("@/shared/lib/http/admin-fetch", () => ({ adminRequest: jest.fn() }));
it("이미지 이외의 파일을 검증 요청 전에 거절한다", () => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
  Element.prototype.getAnimations = jest.fn(() => []);
  const { container } = render(<VisionPhotoTest />);
  fireEvent.click(screen.getByRole("tab", { name: /VISION 프로필 심사/ }));
  fireEvent.change(container.querySelector("input[type=file]")!, {
    target: {
      files: [new File(["fixture"], "bad.txt", { type: "text/plain" })],
    },
  });
  expect(screen.getByRole("alert")).toHaveTextContent(/이미지|지원|형식/);
  expect(adminRequest).not.toHaveBeenCalled();
});
