import React from 'react';
import { act, render } from '@testing-library/react';
import { ConfirmDialogProvider, useConfirmDialogState } from '@/shared/ui/admin/confirm-dialog';

test('확인창이 열린 채 다시 호출되면 앞선 호출은 false 로 끝난다', async () => {
  let ctx!: ReturnType<typeof useConfirmDialogState>;
  function Probe() {
    ctx = useConfirmDialogState();
    return null;
  }
  render(<ConfirmDialogProvider><Probe /></ConfirmDialogProvider>);
  let first!: Promise<boolean>;
  let second!: Promise<boolean>;
  act(() => { first = ctx.confirm({ message: 'a' }); });
  act(() => { second = ctx.confirm({ message: 'b' }); });
  await expect(first).resolves.toBe(false);
  act(() => ctx.handleConfirm());
  await expect(second).resolves.toBe(true);
  expect(ctx.state.open).toBe(false);
  expect(ctx.state.message).toBe('b');
});
