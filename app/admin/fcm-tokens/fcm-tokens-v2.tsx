'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Chip, Label, ListBox, Pagination, Select, Spinner } from '@heroui/react';
import AdminService, { type FcmTokensResponse, type FcmTokenSummary, type FcmTokenUserItem } from '@/app/services/admin';
import { safeToLocaleString } from '@/app/utils/formatters';

const FILTERS = [{id:'all',label:'전체'},{id:'true',label:'토큰 있음'},{id:'false',label:'토큰 없음'}];
const itemsPerPage = 20;

export default function FcmTokensV2() {
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [summary,setSummary]=useState<FcmTokenSummary|null>(null);
  const [items,setItems]=useState<FcmTokenUserItem[]>([]);
  const [currentPage,setCurrentPage]=useState(1);
  const [totalPages,setTotalPages]=useState(0);
  const [totalItems,setTotalItems]=useState(0);
  const [hasTokenFilter,setHasTokenFilter]=useState('all');
  const fetchData=useCallback(async(page:number,hasToken?:boolean)=>{
    setLoading(true);setError('');
    try {
      const data:FcmTokensResponse=await AdminService.fcmTokens.getTokens(page,itemsPerPage,hasToken);
      setSummary(data.summary);setItems(data.items);setCurrentPage(data.meta.currentPage);setTotalItems(data.meta.totalItems);setTotalPages(Math.ceil(data.meta.totalItems/data.meta.itemsPerPage));
    } catch {setError('FCM 토큰 현황을 불러오지 못했습니다. 다시 시도해주세요.');}
    finally {setLoading(false);}
  },[]);
  const hasToken=hasTokenFilter==='all'?undefined:hasTokenFilter==='true';
  useEffect(()=>{void fetchData(1,hasToken);},[hasToken,fetchData]);
  const changePage=(page:number)=>void fetchData(page,hasToken);
  const pages=Array.from({length:Math.min(5,totalPages)},(_,i)=>Math.min(Math.max(1,currentPage-2),Math.max(1,totalPages-4))+i);
  const formatDate=(value:string|null)=>value?safeToLocaleString(value,'ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'-';
  return <main className="space-y-5 p-6"><h1 className="text-2xl font-bold">FCM 토큰 현황</h1>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 p-3"><p>{error}</p><Button variant="secondary" isDisabled={loading} onPress={()=>changePage(currentPage)}>재시도</Button></div>}
    {summary && <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{[['전체 사용자',summary.totalUsers.toLocaleString()],['토큰 보유',summary.withToken.toLocaleString()],['토큰 미보유',summary.withoutToken.toLocaleString()],['iOS',summary.iosCount.toLocaleString()],['Android',summary.androidCount.toLocaleString()],['활성 유저 토큰률',`${summary.activeUserTokenRate.toFixed(1)}%`]].map(([title,value])=><div key={title} className="space-y-1 rounded-xl border bg-white p-4"><dt className="text-sm text-gray-600">{title}</dt><dd className="text-2xl font-bold tabular-nums">{value}</dd></div>)}</dl>}
    <Select className="max-w-xs" selectedKey={hasTokenFilter} isDisabled={loading} onSelectionChange={key=>{if(key!=null){setHasTokenFilter(String(key));setCurrentPage(1);}}}><Label>토큰 보유 여부</Label><Select.Trigger><Select.Value/><Select.Indicator/></Select.Trigger><Select.Popover><ListBox>{FILTERS.map(filter=><ListBox.Item key={filter.id} id={filter.id} textValue={filter.label}>{filter.label}<ListBox.ItemIndicator/></ListBox.Item>)}</ListBox></Select.Popover></Select>
    <section className="overflow-x-auto rounded-xl border bg-white">{loading?<div role="status" aria-label="FCM 현황 조회 중" className="flex justify-center p-8"><Spinner/></div>:items.length===0?<p className="p-8 text-center text-gray-600">데이터가 없습니다.</p>:<table className="w-full text-sm"><caption className="sr-only">사용자별 FCM 토큰 보유 현황</caption><thead className="bg-gray-50"><tr>{['이름','이메일','전화번호','프로필','최종 로그인','토큰','토큰 수'].map(title=><th key={title} scope="col" className="whitespace-nowrap border-b p-3 text-left">{title}</th>)}</tr></thead><tbody className="divide-y">{items.map(user=><tr key={user.userId}>
      <th scope="row" className="p-3 text-left font-semibold">{user.name}</th><td className="p-3">{user.email || '-'}</td><td className="p-3">{user.phoneNumber}</td><td className="p-3">{user.profile?<div className="flex items-center gap-2"><Chip size="sm" variant="soft">{user.profile.rank}</Chip>{user.profile.title && <span>{user.profile.title}</span>}<span className="text-xs text-gray-600">{user.profile.gender==='male'?'M':user.profile.gender==='female'?'F':''}{user.profile.age?`/${user.profile.age}`:''}</span></div>:<span className="text-xs text-gray-600">프로필 없음</span>}</td><td className="whitespace-nowrap p-3 text-xs">{formatDate(user.lastLoginAt)}</td><td className="p-3"><div className="flex flex-wrap gap-1">{user.tokens.length?user.tokens.map((token,index)=><Chip key={index} size="sm" variant="soft" className={!token.isActive?'opacity-50':''}>{token.platform==='ios'?'iOS':'Android'}{!token.isActive?' · 비활성':''}</Chip>):'-'}</div></td><td className="p-3 tabular-nums">{user.tokens.length}</td>
    </tr>)}</tbody></table>}</section>
    {totalPages>1 && <footer className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-gray-600">{currentPage} / {totalPages} 페이지 (총 {totalItems.toLocaleString()}명)</p><Pagination><Pagination.Content><Pagination.Item><Pagination.Link isDisabled={loading || currentPage===1} onPress={()=>changePage(1)}>처음</Pagination.Link></Pagination.Item><Pagination.Item><Pagination.Previous isDisabled={loading || currentPage===1} onPress={()=>changePage(currentPage-1)}>이전</Pagination.Previous></Pagination.Item>{pages.map(page=><Pagination.Item key={page}><Pagination.Link isActive={page===currentPage} isDisabled={loading} aria-label={`${page}페이지`} onPress={()=>changePage(page)}>{page}</Pagination.Link></Pagination.Item>)}<Pagination.Item><Pagination.Next isDisabled={loading || currentPage===totalPages} onPress={()=>changePage(currentPage+1)}>다음</Pagination.Next></Pagination.Item><Pagination.Item><Pagination.Link isDisabled={loading || currentPage===totalPages} onPress={()=>changePage(totalPages)}>마지막</Pagination.Link></Pagination.Item></Pagination.Content></Pagination></footer>}
  </main>;
}
