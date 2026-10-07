import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HtmlNoticeEditor } from '@/app/admin/content/components/forms/HtmlNoticeEditor';
import type { NoticeHtmlState } from '@/types/admin';
const mockPreview = jest.fn(); const mockGet = jest.fn(); const mockRestore = jest.fn();
jest.mock('@/app/services/admin', () => ({ __esModule: true, default: { cardNews: { previewHtml: (...args: unknown[]) => mockPreview(...args), get: (...args: unknown[]) => mockGet(...args), restoreHtml: (...args: unknown[]) => mockRestore(...args), uploadHtmlImage: jest.fn() } } }));
const mockToast = { error: jest.fn(), success: jest.fn() };
jest.mock('@/shared/ui/admin/toast/toast-context', () => ({ useToast: () => mockToast }));
jest.mock('@/shared/ui/admin/confirm-dialog/confirm-dialog-context', () => ({ useConfirm: () => jest.fn().mockResolvedValue(true) }));
const metadata = { title: 'Title', description: 'Description', categoryCode: 'announcement' as const, layoutMode: 'longform' as const, hasReward: false as const };
const state = { revision: 1, variants: { kr: { safeHtml: '<p>original</p>', safeCss: '' } }, translation: {status:'pending',attempts:0} } as NoticeHtmlState;
const previewResult = { previewDigest: 'safe-digest', document: '<html><head><meta http-equiv="Content-Security-Policy" content="default-src none"></head><body><p>server-safe</p></body></html>' };
const props = { metadata, metadataKey: 'metadata1', onSave: jest.fn(), onRestored: jest.fn(), onDirty: jest.fn() };
beforeEach(() => { jest.clearAllMocks(); mockPreview.mockResolvedValue(previewResult); });

it('executes only a validated server document in an empty sandbox and invalidates on metadata change', async () => {
  const view = render(<HtmlNoticeEditor {...props} />);
  fireEvent.change(screen.getByLabelText('HTML'), {target:{value:'<script>unsafe()</script><p>source</p>'}});
  expect(screen.queryByTitle('검증된 KR 공지 미리보기')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  const frame = await screen.findByTitle('검증된 KR 공지 미리보기');
  expect(frame).toHaveAttribute('sandbox','');
  expect(frame).toHaveAttribute('srcdoc',previewResult.document);
  expect(document.querySelector('script')).toBeNull();
  view.rerender(<HtmlNoticeEditor {...props} metadata={{...metadata,title:'Changed'}} metadataKey="metadata2" />);
  expect(screen.queryByTitle('검증된 KR 공지 미리보기')).not.toBeInTheDocument();
});
it('메타데이터를 고친 뒤 저장 후 발행을 누르면 검증 버튼 없이 현재 입력으로 다시 검증하고 발행한다', async () => {
  // given
  const view = render(<HtmlNoticeEditor {...props} initialState={state} />);
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  await screen.findByTitle('검증된 KR 공지 미리보기');
  view.rerender(<HtmlNoticeEditor {...props} initialState={state} metadata={{...metadata,description:'New description'}} metadataKey="metadata2" />);
  mockPreview.mockResolvedValue({...previewResult,previewDigest:'fresh-digest'});
  props.onSave.mockResolvedValue({id:'notice',noticeHtmlState:state});
  // when
  fireEvent.click(screen.getByRole('button',{name:'저장 후 발행'}));
  // then
  await waitFor(() => expect(props.onSave).toHaveBeenCalledWith({html:'<p>original</p>',css:'',previewDigest:'fresh-digest',expectedRevision:1},true));
  expect(mockPreview.mock.calls[1][0]).toMatchObject({description:'New description'});
});
it('ignores an asynchronous preview response for old metadata', async () => {
  let resolve!: (value: typeof previewResult) => void;
  mockPreview.mockReturnValue(new Promise((done) => {resolve=done;}));
  const view = render(<HtmlNoticeEditor {...props} initialState={state} />);
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  view.rerender(<HtmlNoticeEditor {...props} initialState={state} metadata={{...metadata,title:'Later'}} metadataKey="later" />);
  await act(async () => resolve(previewResult));
  expect(screen.queryByTitle('검증된 KR 공지 미리보기')).not.toBeInTheDocument();
});
it('polls JP completion without resetting unsaved edits or the editor base revision', async () => {
  jest.useFakeTimers();
  mockGet.mockResolvedValue({id:'notice',noticeHtmlState:{...state,revision:2,variants:{...state.variants,jp:{...state.variants.kr,revision:2}},translation:{status:'done',attempts:0}}});
  const view = render(<HtmlNoticeEditor {...props} articleId="notice" initialState={state} />);
  fireEvent.change(screen.getByLabelText('HTML'),{target:{value:'<p>my unsaved edits</p>'}});
  await act(async () => {jest.advanceTimersByTime(5000);});
  expect(screen.getByLabelText('HTML')).toHaveValue('<p>my unsaved edits</p>');
  expect(screen.getByRole('status')).toHaveTextContent('JP 게시본 준비 완료');
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  await act(async () => {});
  props.onSave.mockResolvedValue({id:'notice',noticeHtmlState:state});
  fireEvent.click(screen.getByRole('button',{name:'저장',exact:true}));
  await act(async () => {});
  expect(props.onSave).toHaveBeenCalledWith({html:'<p>my unsaved edits</p>',css:'',previewDigest:'safe-digest',expectedRevision:1},false);
  view.unmount(); jest.useRealTimers();
});
it('accepts a full HTML file above the old 50KB size but rejects files above 256KB', async () => {
  render(<HtmlNoticeEditor {...props} />);
  const source = '<html><head><style>p{color:black}</style></head><body>' + 'x'.repeat(60*1024) + '</body></html>';
  const file = new File([source], 'notice.html', {type:'text/html'});
  Object.defineProperty(file,'text',{value:async()=>source});
  fireEvent.change(screen.getByLabelText('HTML 파일 선택'),{target:{files:[file]}});
  await waitFor(() => expect(screen.getByLabelText('HTML')).toHaveValue(source));
  const tooBig = new File(['x'.repeat(257*1024)], 'huge.html');
  fireEvent.change(screen.getByLabelText('HTML 파일 선택'),{target:{files:[tooBig]}});
  expect(mockToast.error).toHaveBeenCalledWith('256KB 이하 HTML 파일을 선택해주세요.');
  expect(screen.getByLabelText('HTML')).toHaveValue(source);
});

const copyPreview = {
  ...previewResult,
  kr: { ...state.variants.kr, safeHtml: '<p>Original</p><a>Help</a>', safeCss: 'p{color:black}' },
  textSegments: [{ id:'text-0',text:'Original' }, {id:'text-1',text:'Help'}],
};
it('applies literal copy through the server while preserving original links and updating source and digest', async () => {
  const original = '<html><head><style>p{color:black}</style></head><body><p>Original</p><a href="https://example.com/help">Help</a></body></html>';
  const edited = original.replace('Original','&lt;script&gt;alert(1)&lt;/script&gt;');
  mockPreview.mockResolvedValueOnce(copyPreview).mockResolvedValueOnce({
    ...copyPreview, previewDigest:'copy-digest', editableHtml:edited, editableCss:'p{padding:4px}',
    document:'<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    textSegments:[{id:'text-0',text:'<script>alert(1)</script>'},{id:'text-1',text:'Help'}],
  });
  render(<HtmlNoticeEditor {...props} initialState={state} />);
  fireEvent.change(screen.getByLabelText('HTML'),{target:{value:original}});
  fireEvent.change(screen.getByLabelText('CSS'),{target:{value:'p{padding:4px}'}});
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  const copyField = await screen.findByLabelText('문구 1');
  fireEvent.change(copyField,{target:{value:'<script>alert(1)</script>'}});
  expect(screen.getByRole('button',{name:'저장',exact:true})).toBeDisabled();
  expect(props.onDirty).toHaveBeenLastCalledWith(true);
  expect(document.querySelector('script')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'문구 반영 및 재검증'}));
  await waitFor(() => expect(screen.getByLabelText('HTML')).toHaveValue(edited));
  expect(mockPreview.mock.calls[1][0]).toMatchObject({noticeHtmlInput:{html:original,css:'p{padding:4px}'},textEdits:[{id:'text-0',text:'<script>alert(1)</script>'},{id:'text-1',text:'Help'}]});
  expect(screen.getByTitle('검증된 KR 공지 미리보기')).toHaveAttribute('sandbox','');
  expect(screen.getByRole('button',{name:'저장',exact:true})).not.toBeDisabled();
  expect(props.onSave).not.toHaveBeenCalled();
  props.onSave.mockResolvedValue({id:'notice',noticeHtmlState:state});
  fireEvent.click(screen.getByRole('button',{name:'저장',exact:true}));
  await waitFor(() => expect(props.onSave).toHaveBeenCalledWith({html:edited,css:'p{padding:4px}',previewDigest:'copy-digest',expectedRevision:1},false));
});
it('retains copy drafts after validation failure and never enables save for an unvalidated edit', async () => {
  let reject!: (error: Error) => void;
  mockPreview.mockResolvedValueOnce(copyPreview).mockReturnValueOnce(new Promise((_,fail) => {reject=fail;}));
  render(<HtmlNoticeEditor {...props} initialState={state} />);
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  fireEvent.change(await screen.findByLabelText('문구 1'),{target:{value:'Draft stays'}});
  fireEvent.click(screen.getByRole('button',{name:'문구 반영 및 재검증'}));
  expect(screen.getByLabelText('문구 1')).toBeDisabled();
  expect(screen.getByRole('button',{name:'저장',exact:true})).toBeDisabled();
  await act(async () => reject(new Error('Rejected')));
  expect(screen.getByLabelText('문구 1')).toHaveValue('Draft stays');
  expect(screen.getByLabelText('문구 1')).not.toBeDisabled();
  expect(screen.getByRole('button',{name:'저장',exact:true})).toBeDisabled();
  expect(screen.getByRole('button',{name:'문구 반영 및 재검증'})).not.toBeDisabled();
});
it('ignores stale copy responses after metadata changes and keeps staged copy for retry', async () => {
  let resolve!: (response: typeof copyPreview & {editableHtml:string}) => void;
  mockPreview.mockResolvedValueOnce(copyPreview).mockReturnValueOnce(new Promise((done) => {resolve=done;}));
  const view = render(<HtmlNoticeEditor {...props} initialState={state} />);
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  fireEvent.change(await screen.findByLabelText('문구 1'),{target:{value:'Later copy'}});
  fireEvent.click(screen.getByRole('button',{name:'문구 반영 및 재검증'}));
  view.rerender(<HtmlNoticeEditor {...props} initialState={state} metadata={{...metadata,title:'Later title'}} metadataKey="later" />);
  await act(async () => resolve({...copyPreview,editableHtml:'<p>stale response</p>'}));
  expect(screen.getByLabelText('HTML')).toHaveValue(state.variants.kr.safeHtml);
  expect(screen.getByLabelText('문구 1')).toHaveValue('Later copy');
  expect(screen.getByRole('button',{name:'저장',exact:true})).toBeDisabled();
  expect(screen.queryByTitle('검증된 KR 공지 미리보기')).not.toBeInTheDocument();
});
it('blocks blank edits and invalidates the text editor when raw HTML changes', async () => {
  mockPreview.mockResolvedValue(copyPreview);
  render(<HtmlNoticeEditor {...props} initialState={state} />);
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  fireEvent.change(await screen.findByLabelText('문구 1'),{target:{value:' '}});
  fireEvent.click(screen.getByRole('button',{name:'문구 반영 및 재검증'}));
  expect(mockPreview).toHaveBeenCalledTimes(1);
  expect(mockToast.error).toHaveBeenCalledWith('문구를 비울 수 없습니다. 삭제가 필요하면 HTML을 수정한 뒤 검증해주세요.');
  fireEvent.change(screen.getByLabelText('HTML'),{target:{value:'<p>raw change</p>'}});
  expect(screen.queryByLabelText('문구 1')).not.toBeInTheDocument();
});
it('refuses old server copy responses without editable source instead of dropping links', async () => {
  mockPreview.mockResolvedValue(copyPreview);
  render(<HtmlNoticeEditor {...props} initialState={state} />);
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  fireEvent.change(await screen.findByLabelText('문구 1'),{target:{value:'New copy'}});
  fireEvent.click(screen.getByRole('button',{name:'문구 반영 및 재검증'}));
  await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
  expect(screen.getByLabelText('HTML')).toHaveValue(state.variants.kr.safeHtml);
  expect(screen.getByLabelText('문구 1')).toHaveValue('New copy');
  expect(screen.getByRole('button',{name:'저장',exact:true})).toBeDisabled();
});

it('reopens admin editable HTML with approved hrefs instead of the stripped rendering HTML', async () => {
  const editable = '<p>original</p><a href="https://example.com/help">Help</a>';
  const reopened = {...state,variants:{kr:{...state.variants.kr,editableHtml:editable,links:[{label:'Help',url:'https://example.com/help'}]}}};
  mockPreview.mockResolvedValue({...copyPreview,kr:{...copyPreview.kr,links:reopened.variants.kr.links}});
  render(<HtmlNoticeEditor {...props} initialState={reopened} />);
  expect(screen.getByLabelText('HTML')).toHaveValue(editable);
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  await screen.findByLabelText('문구 1');
  expect(mockPreview.mock.calls[0][0].noticeHtmlInput.html).toBe(editable);
  expect(screen.queryByText('이전 공지의 링크를 보존하려면 원본 HTML 파일을 다시 올려주세요.')).not.toBeInTheDocument();
});
it('blocks legacy link loss even after raw edits until the original targets are confirmed by the server', async () => {
  const legacy = {...state,variants:{kr:{...state.variants.kr,links:[{label:'Help',url:'https://example.com/help'}]}}};
  render(<HtmlNoticeEditor {...props} initialState={legacy} />);
  expect(screen.getByRole('alert')).toHaveTextContent('이전 공지의 링크를 보존하려면 원본 HTML 파일을 다시 올려주세요.');
  fireEvent.click(screen.getByRole('button',{name:'저장',exact:true}));
  await act(async () => {});
  expect(mockToast.error).toHaveBeenCalledWith('이전 공지의 링크를 보존하려면 원본 HTML 파일을 다시 올려주세요.');
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  expect(mockPreview).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('HTML'),{target:{value:'<p>changed but no links</p>'}});
  mockPreview.mockResolvedValue({...copyPreview,kr:{...copyPreview.kr,links:[]}});
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  await waitFor(() => expect(mockPreview).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByRole('button',{name:'검증 및 미리보기'})).not.toBeDisabled());
  expect(screen.queryByTitle('검증된 KR 공지 미리보기')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('문구 1')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('HTML'),{target:{value:'<p>changed</p><a href="https://example.com/help">Help</a>'}});
  mockPreview.mockResolvedValue({...copyPreview,kr:{...copyPreview.kr,links:legacy.variants.kr.links}});
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  await screen.findByLabelText('문구 1');
  expect(screen.getByRole('button',{name:'저장',exact:true})).not.toBeDisabled();
  expect(props.onSave).not.toHaveBeenCalled();
});
