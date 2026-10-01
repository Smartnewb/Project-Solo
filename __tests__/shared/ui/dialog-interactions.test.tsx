import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Button } from "@heroui/react";

it("keeps a wide editor's heading, controls and footer accessible and restores focus after Escape", async () => {
  const user = userEvent.setup();
  render(<Dialog><DialogTrigger>편집 열기</DialogTrigger><DialogContent className="max-w-6xl"><DialogHeader><DialogTitle>넓은 편집</DialogTitle></DialogHeader><label>제목<input /></label><DialogFooter><Button>저장</Button></DialogFooter></DialogContent></Dialog>);
  const trigger = screen.getByRole("button", { name: "편집 열기" });
  await user.click(trigger);
  expect(await screen.findByRole("dialog", { name: "넓은 편집" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "제목" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});
