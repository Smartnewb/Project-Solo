import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('@/shared/ui/admin/toast/toast-context',()=>({useToast:()=>({error:jest.fn()})}));
import {StyleReferenceBulkDialog} from '@/app/admin/style-reference/components/StyleReferenceBulkDialog';
import {StyleReferenceFilters} from '@/app/admin/style-reference/components/StyleReferenceFilters';
import {StyleReferenceUploadDialog} from '@/app/admin/style-reference/components/StyleReferenceUploadDialog';
it('preserves unrelated filters while selecting gender',async()=>{
 const change=jest.fn();render(<StyleReferenceFilters filters={{gender:'ALL',category:'FASHION',status:'ACTIVE'}} onChange={change}/>);await selectHeroValue('성별','MALE');expect(change).toHaveBeenCalledWith({gender:'MALE',category:'FASHION',status:'ACTIVE'});
});
it('parses bulk input before submitting and displays truthful results',async()=>{
 const submit=jest.fn().mockResolvedValue({created:1,analyzed:0,errors:[]});render(<StyleReferenceBulkDialog open onClose={jest.fn()} onSubmit={submit} isLoading={false}/>);
 fireEvent.change(screen.getByLabelText('일괄 등록 JSON'),{target:{value:'invalid'}});fireEvent.click(screen.getByRole('button',{name:'일괄 등록',exact:true}));expect(submit).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('JSON 파싱 오류');
 const items=[{imageUrl:'https://example.com/image.png',gender:'MALE',category:'FASHION'}];fireEvent.change(screen.getByLabelText('일괄 등록 JSON'),{target:{value:JSON.stringify({items})}});fireEvent.click(screen.getByRole('button',{name:'일괄 등록',exact:true}));await waitFor(()=>expect(submit).toHaveBeenCalledWith(items));expect(await screen.findByText(/등록 완료: 1개/)).toBeInTheDocument();
});
it('keeps explicit gender choice and image URL upload contract',async()=>{
 const submit=jest.fn().mockResolvedValue(undefined);render(<StyleReferenceUploadDialog open onClose={jest.fn()} onSubmit={submit} isLoading={false}/>);
 fireEvent.change(screen.getByLabelText('이미지 URL *'),{target:{value:'https://example.com/image.png'}});fireEvent.click(screen.getByRole('button',{name:'남성',exact:true}));expect(screen.getByRole('button',{name:'남성',exact:true})).toHaveAttribute('aria-pressed','true');fireEvent.click(screen.getByRole('button',{name:'등록',exact:true}));await waitFor(()=>expect(submit).toHaveBeenCalledWith(expect.objectContaining({imageUrl:'https://example.com/image.png',gender:'MALE',category:'VIBE'})));
});
