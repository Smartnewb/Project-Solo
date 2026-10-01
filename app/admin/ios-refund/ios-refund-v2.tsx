'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Chip, Input, Label, ListBox, Pagination, Select, Spinner, TextField } from '@heroui/react';
import { Controller } from 'react-hook-form';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import AdminService from '@/app/services/admin';
import { AppleRefundItem, AppleRefundStatus, AppleRefundListParams } from '@/types/admin';
import { safeToLocaleString } from '@/app/utils/formatters';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { iosRefundFilterSchema, IosRefundFilterFormValues } from '@/app/admin/hooks/forms/schemas/ios-refund.schema';

const DEFAULT_FILTERS:IosRefundFilterFormValues={filterStatus:'ALL',searchTerm:'',startDate:'',endDate:''};

function IOSRefundPageContent() {
  const [items, setItems] = useState<AppleRefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error,setError]=useState('');
  const [appliedFilters,setAppliedFilters]=useState(DEFAULT_FILTERS);
  const toast=useToast();

  const filterForm = useAdminForm<IosRefundFilterFormValues>({
    schema: iosRefundFilterSchema,
    defaultValues: DEFAULT_FILTERS,
  });
  const startDate=filterForm.watch('startDate'),endDate=filterForm.watch('endDate');
  const reversedRange=!!startDate && !!endDate && startDate>endDate;
  const {filterStatus,searchTerm,startDate:appliedStart,endDate:appliedEnd}=appliedFilters;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);setError('');
      const params: AppleRefundListParams = {
        page,
        limit: 20,
        ...(filterStatus !== 'ALL' && { status: filterStatus as AppleRefundStatus }),
        ...(searchTerm && { searchTerm }),
        ...(appliedStart && { startDate:appliedStart }),
        ...(appliedEnd && { endDate:appliedEnd }),
      };
      const response = await AdminService.appleRefund.getList(params);
      setItems(response.items);
      setTotalPages(response.meta.totalPages);
      setTotalCount(response.meta.totalCount);
      return true;
    } catch { setError('환불 내역을 불러오지 못했습니다. 다시 시도해주세요.'); return false; } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = async () => {
    if(syncing) return;
    try {
      setSyncing(true);
      await AdminService.appleRefund.syncRefundStatus();
      const refreshed=await fetchData();
      if(refreshed) toast.success('환불 상태 동기화가 완료되었습니다.');
      else toast.warning('동기화는 완료되었지만 내역 조회에 실패했습니다. 다시 조회해주세요.');
    } catch (error) {
      toast.error('동기화에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch=filterForm.handleFormSubmit(async data=>{
    if(data.startDate && data.endDate && data.startDate>data.endDate) return;
    setPage(1);setAppliedFilters({...data,searchTerm:data.searchTerm.trim()});
  });
  const handleReset=()=>{filterForm.reset(DEFAULT_FILTERS);setPage(1);setAppliedFilters({...DEFAULT_FILTERS});};

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return safeToLocaleString(dateString, 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency || 'KRW',
    }).format(amount);
  };

  return <main className="mx-auto max-w-7xl space-y-5 p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">iOS 환불 관리</h1><p className="mt-1 text-sm text-gray-600">Apple App Store 인앱 결제 환불 내역을 관리합니다.</p></div><Button onPress={()=>void handleSync()} isDisabled={syncing || loading}>{syncing && <Spinner size="sm" aria-hidden="true"/>}{syncing?'동기화 중...':'환불 상태 동기화'}</Button></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 p-3"><p>{error}</p><Button variant="secondary" isDisabled={loading || syncing} onPress={()=>void fetchData()}>재시도</Button></div>}
    <form className="space-y-4 rounded-xl border bg-white p-4" onSubmit={handleSearch}><h2 className="text-lg font-semibold">필터</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Controller name="filterStatus" control={filterForm.control} render={({field})=><Select selectedKey={field.value} onSelectionChange={key=>key!=null && field.onChange(String(key))} isDisabled={loading || syncing}><Label>환불 상태</Label><Select.Trigger><Select.Value/><Select.Indicator/></Select.Trigger><Select.Popover><ListBox>{[{id:'ALL',label:'전체'},{id:AppleRefundStatus.NONE,label:'정상'},{id:AppleRefundStatus.REFUNDED,label:'환불 완료'}].map(option=><ListBox.Item key={option.id} id={option.id} textValue={option.label}>{option.label}<ListBox.ItemIndicator/></ListBox.Item>)}</ListBox></Select.Popover></Select>}/>
      {(['searchTerm','startDate','endDate'] as const).map(name=><Controller key={name} name={name} control={filterForm.control} render={({field})=><TextField isDisabled={loading || syncing} isInvalid={name==='endDate' && reversedRange}><Label>{name==='searchTerm'?'사용자 검색':name==='startDate'?'시작일':'종료일'}</Label><Input {...field} type={name==='searchTerm'?'text':'date'} placeholder={name==='searchTerm'?'사용자 이름 또는 ID':undefined} min={name==='endDate' && startDate ? startDate:undefined}/></TextField>}/>)}
    </div>{reversedRange && <p role="alert" className="text-sm text-danger">종료일은 시작일 이후여야 합니다.</p>}<div className="flex justify-end gap-2"><Button variant="secondary" onPress={handleReset} isDisabled={loading || syncing}>초기화</Button><Button type="submit" isDisabled={loading || syncing || reversedRange}>검색</Button></div></form>
    <section className="overflow-hidden rounded-xl border bg-white"><h2 className="border-b p-4 text-lg font-semibold">환불 내역 <span className="font-normal text-gray-600">({totalCount}건)</span></h2>
      {loading?<div role="status" aria-label="환불 내역 조회 중" className="flex justify-center p-10"><Spinner/></div>:!items.length?<p className="p-10 text-center text-gray-600">환불 내역이 없습니다</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">Apple 환불 거래 내역</caption><thead className="bg-gray-50"><tr>{['사용자','상품 ID','거래 ID','금액','결제일','환불일','상태'].map(title=><th key={title} scope="col" className="whitespace-nowrap border-b p-3 text-left">{title}</th>)}</tr></thead><tbody className="divide-y">{items.map(item=><tr key={item.id}><th scope="row" className="p-3 text-left font-normal"><p className="font-semibold">{item.userName}</p><p className="text-xs text-gray-600">{item.userId}</p></th><td className="p-3">{item.productId}</td><td className="p-3"><p>{item.transactionId}</p><p className="text-xs text-gray-600">원본: {item.originalTransactionId}</p></td><td className="whitespace-nowrap p-3">{formatCurrency(item.amount,item.currency)}</td><td className="whitespace-nowrap p-3 text-xs">{formatDate(item.purchaseDate)}</td><td className="whitespace-nowrap p-3 text-xs">{formatDate(item.refundDate)}</td><td className="p-3"><Chip size="sm" variant="soft" color={item.refundStatus===AppleRefundStatus.REFUNDED?'danger':'success'}>{item.refundStatus===AppleRefundStatus.REFUNDED?'환불 완료':'정상'}</Chip></td></tr>)}</tbody></table></div>}
      {totalPages>1 && <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><p className="text-sm text-gray-600">{page} / {totalPages} 페이지</p><Pagination><Pagination.Content><Pagination.Item><Pagination.Previous isDisabled={loading || syncing || page===1} onPress={()=>setPage(p=>Math.max(1,p-1))}>이전</Pagination.Previous></Pagination.Item><Pagination.Item><Pagination.Next isDisabled={loading || syncing || page===totalPages} onPress={()=>setPage(p=>Math.min(totalPages,p+1))}>다음</Pagination.Next></Pagination.Item></Pagination.Content></Pagination></footer>}
    </section>
  </main>;
}

export default function IOSRefundPageV2() {return <IOSRefundPageContent/>;}
