import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('@/shared/ui/admin/toast/toast-context',()=>({useToast:()=>({error:jest.fn(),success:jest.fn()})}));
import BannerCard from '@/app/admin/banners/components/BannerCard';
import BannerFormDialog from '@/app/admin/banners/components/BannerFormDialog';
import type {Banner} from '@/types/admin';
const banner={id:'banner',position:'home',imageUrl:'https://img.example/banner.png',actionUrl:'/matching',isActive:true,startDate:null,endDate:null} as Banner;
it('retains activation/edit/delete action identifiers with real HeroUI controls',()=>{
 const toggle=jest.fn(),edit=jest.fn(),remove=jest.fn();render(<BannerCard banner={banner} onToggleActive={toggle} onEdit={edit} onDelete={remove} />);
 fireEvent.click(screen.getByRole('checkbox',{name:'배너 활성화'}));expect(toggle).toHaveBeenCalledWith('banner',false);
 fireEvent.click(screen.getByRole('button',{name:'배너 수정'}));expect(edit).toHaveBeenCalledWith(banner);
 fireEvent.click(screen.getByRole('button',{name:'배너 삭제'}));expect(remove).toHaveBeenCalledWith('banner');
});
it('edits banners with preserved action URL and unlimited scheduling payload',async()=>{
 const submit=jest.fn().mockResolvedValue(undefined);render(<BannerFormDialog open onClose={jest.fn()} onSubmit={submit} editBanner={banner} />);
 expect(screen.getByRole('dialog',{name:'배너 수정'})).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('액션 URL (선택)'),{target:{value:'/moment'}});
 fireEvent.click(screen.getByRole('button',{name:'수정',exact:true}));
 await waitFor(()=>expect(submit).toHaveBeenCalledWith(null,{position:'home',actionUrl:'/moment',startDate:undefined,endDate:undefined}));
});
