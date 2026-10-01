import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import LayoutModeSelector from '@/app/admin/content/components/card-series/LayoutModeSelector';
const mockGet = jest.fn();
const mockPublish = jest.fn();
const mockUpload = jest.fn();
const mockToast = {success:jest.fn(),error:jest.fn()};
jest.mock('@/app/services/admin/content',()=>({cardNews:{get:(...args:unknown[])=>mockGet(...args)}}));
jest.mock('@/app/services/admin',()=>({__esModule:true,default:{sometimeArticles:{uploadImage:(...args:unknown[])=>mockUpload(...args)}}}));
jest.mock('@/app/admin/hooks',()=>({
 usePublishCardNews:()=>({mutateAsync:mockPublish,isPending:false}),
 useUpdateSometimeArticle:()=>({mutateAsync:jest.fn(),isPending:false}),
 usePublishNotice:()=>({mutateAsync:jest.fn(),isPending:false}),
 usePublishVideo:()=>({mutateAsync:jest.fn(),isPending:false}),
}));
jest.mock('@/shared/ui/admin/toast/toast-context',()=>({useToast:()=>mockToast}));
import {ContentFilters} from '@/app/admin/content/components/ContentFilters';
import {ContentTypeSelectModal} from '@/app/admin/content/components/ContentTypeSelectModal';
import {PublishDialog} from '@/app/admin/content/components/PublishDialog';
import ImageUploader from '@/app/admin/content/components/article/ImageUploader';

beforeEach(()=>jest.clearAllMocks());
it('native category/status filters and real HeroUI search preserve callbacks',async()=>{
 const change=jest.fn();render(<ContentFilters category="" status="" search="" onChange={change} />);
 await selectHeroValue('상태','draft');
 fireEvent.change(screen.getByRole('textbox',{name:'검색'}),{target:{value:'공지'}});
 expect(change).toHaveBeenCalledWith({status:'draft'});expect(change).toHaveBeenCalledWith({search:'공지'});
});
it('content type modal supports keyboard selection and dismisses through real HeroUI',async()=>{
 const select=jest.fn(),close=jest.fn();render(<ContentTypeSelectModal open onClose={close} onSelect={select} />);
 expect(screen.getByRole('dialog',{name:'콘텐츠 유형 선택'})).toBeInTheDocument();
 screen.getByRole('button',{name:'공지사항 작성'}).focus();await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledWith('notice');
 fireEvent.click(screen.getByRole('button',{name:'닫기'}));expect(close).toHaveBeenCalled();
});
it('publish dialog uses fresh HTML revision and push fields through real controls',async()=>{
 mockGet.mockResolvedValue({noticeHtmlState:{revision:7}});mockPublish.mockResolvedValue({success:true,message:'queued'});
 const close=jest.fn();render(<PublishDialog open onClose={close} type="longform" item={{id:'html',title:'공지'}} />);
 fireEvent.change(screen.getByLabelText('푸시 알림 메시지'),{target:{value:'메시지'}});
 fireEvent.click(screen.getByRole('button',{name:'발행',exact:true}));
 await waitFor(()=>expect(mockPublish).toHaveBeenCalledWith({id:'html',data:{expectedRevision:7,pushNotificationMessage:'메시지'}}));
 expect(close).toHaveBeenCalled();
});
it('image upload button opens a file chooser and retains the service upload contract',async()=>{
 mockUpload.mockResolvedValue({url:'https://cdn.example/image.png'});
 const change=jest.fn();const click=jest.spyOn(HTMLInputElement.prototype,'click');
 const {container}=render(<ImageUploader value="" onChange={change} />);
 fireEvent.click(screen.getByRole('button',{name:'이미지 업로드'}));expect(click).toHaveBeenCalled();
 const file=new File(['image'],'photo.png',{type:'image/png'});
 fireEvent.change(container.querySelector('input[type=file]')!,{target:{files:[file]}});
 await waitFor(()=>expect(mockUpload).toHaveBeenCalledWith(file));
 await waitFor(()=>expect(change).toHaveBeenCalledWith('https://cdn.example/image.png'));
 click.mockRestore();
});

it('layout mode selection uses keyboard press and blocks disabled changes',async()=>{
 const change=jest.fn();const view=render(<LayoutModeSelector value="image_only" onChange={change}/>);
 const button=screen.getByRole('button',{name:'이미지 전용'});button.focus();await userEvent.keyboard('{Enter}');expect(change).toHaveBeenCalledWith('image_only');
 change.mockClear();view.rerender(<LayoutModeSelector value="image_only" onChange={change} disabled/>);expect(button).toBeDisabled();fireEvent.click(button);expect(change).not.toHaveBeenCalled();
});
