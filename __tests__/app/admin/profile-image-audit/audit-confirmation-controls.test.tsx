import React from 'react';
import {fireEvent,render,screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {ConfirmAuditActionDialog} from '@/app/admin/profile-image-audit/components/ConfirmAuditActionDialog';
it('requires nonblank rejection reason and confirms only by explicit action',()=>{
 const confirm=jest.fn();render(<ConfirmAuditActionDialog action="reject" selectedCount={2} busy={false} onClose={jest.fn()} onConfirm={confirm}/>);
 expect(confirm).not.toHaveBeenCalled();fireEvent.change(screen.getByRole('textbox',{name:'직접 작성'}),{target:{value:'   '}});expect(screen.getByRole('button',{name:'처리'})).toBeDisabled();
 fireEvent.change(screen.getByRole('textbox',{name:'직접 작성'}),{target:{value:' 재업로드 필요 '}});fireEvent.click(screen.getByRole('button',{name:'처리'}));expect(confirm).toHaveBeenCalledWith('재업로드 필요');
});
it('blocks repeated submit and dismissal while operation is busy',()=>{
 const close=jest.fn(),confirm=jest.fn();render(<ConfirmAuditActionDialog action="delete" selectedCount={1} busy onClose={close} onConfirm={confirm}/>);
 expect(screen.getByRole('button',{name:'처리'})).toBeDisabled();expect(screen.getByRole('button',{name:'취소'})).toBeDisabled();fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});expect(close).not.toHaveBeenCalled();expect(confirm).not.toHaveBeenCalled();
});
