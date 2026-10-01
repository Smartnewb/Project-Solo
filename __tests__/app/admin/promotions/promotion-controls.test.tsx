import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
const products=[{id:'origin',productName:'원가',totalGems:10,price:1000,currency:'KRW'},{id:'sale',productName:'할인',totalGems:10,price:500,currency:'KRW'}];
jest.mock('@tanstack/react-query',()=>({useQuery:()=>({data:products,isLoading:false,isError:false})}));
jest.mock('@/app/admin/hooks',()=>({useUploadPromotionImage:()=>({mutateAsync:jest.fn(),isPending:false}),useDeletePromotionImage:()=>({mutate:jest.fn()})}));
jest.mock('@/shared/ui/admin/toast',()=>({useToast:()=>({error:jest.fn()})}));
import {PromotionFormDrawer} from '@/app/admin/promotions/components/PromotionFormDrawer';
import {PromotionImageUpload} from '@/app/admin/promotions/components/PromotionImageUpload';
import type {Promotion} from '@/types/admin';
const promotion={id:'offer',title:'할인',imageUrl:'https://images.example/offer.png',backgroundColor:'#FFFFFF',originGemProductId:'origin',saleGemProductId:'sale',startsAt:'2026-10-10T12:00:00Z',expiresAt:'2026-10-11T12:00:00Z',sortOrder:0,ctaText:'지금 받기',targetFirstPurchaseOnly:false,isActive:true} as Promotion;
it('retains SKU compatibility fields, dates and audience flags through real HeroUI drawer',async()=>{
 const submit=jest.fn().mockResolvedValue(undefined);render(<PromotionFormDrawer open onClose={jest.fn()} onSubmit={submit} editPromotion={promotion}/>);
 expect(screen.getByRole('dialog',{name:'프로모션 수정'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('checkbox',{name:'첫 구매자만'}));fireEvent.click(screen.getByRole('button',{name:'수정',exact:true}));
 await waitFor(()=>expect(submit).toHaveBeenCalledWith(expect.objectContaining({originGemProductId:'origin',saleGemProductId:'sale',targetGemProductId:'sale',startsAt:new Date('2026-10-10T12:00').toISOString(),expiresAt:new Date('2026-10-11T12:00').toISOString(),targetFirstPurchaseOnly:true,isActive:true})));
});
it('blocks same SKU pair and invalid expiry before submitting',async()=>{
 const submit=jest.fn();render(<PromotionFormDrawer open onClose={jest.fn()} onSubmit={submit} editPromotion={promotion}/>);
 await selectHeroValue('할인 상품 *','origin');fireEvent.change(screen.getByLabelText('종료일 *'),{target:{value:'2026-10-09T12:00'}});fireEvent.click(screen.getByRole('button',{name:'수정',exact:true}));
 expect(screen.getByText('원가 상품과 할인 상품은 달라야 합니다.')).toBeInTheDocument();expect(screen.getByText('종료일은 시작일 이후여야 합니다.')).toBeInTheDocument();expect(submit).not.toHaveBeenCalled();
});
it('keeps upload file validation and keyboard picker access',async()=>{
 const selected=jest.fn(),error=jest.fn();const {container}=render(<PromotionImageUpload imageUrl={null} uploading={false} onFileSelected={selected} onError={error}/>);const input=container.querySelector('input')!;
 const click=jest.spyOn(input,'click');screen.getByRole('button',{name:'프로모션 이미지 선택'}).focus();await userEvent.keyboard('{Enter}');expect(click).toHaveBeenCalled();
 fireEvent.change(input,{target:{files:[new File(['<svg/>'],'x.svg',{type:'image/svg+xml'})]}});expect(error).toHaveBeenCalled();expect(selected).not.toHaveBeenCalled();
 const png=new File(['png'],'x.png',{type:'image/png'});fireEvent.change(input,{target:{files:[png]}});expect(selected).toHaveBeenCalledWith(png);
});
