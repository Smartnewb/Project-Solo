import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatStatsTab from '@/app/admin/chat/components/ChatStatsTab';
import chatService from '@/app/services/chat';
import type { ChatStatsResponse } from '@/app/services/chat';

jest.mock('@/app/services/chat', () => ({__esModule:true,default:{getChatStats:jest.fn()}}));
const stats: ChatStatsResponse = {
  startDate:'2026-10-01',endDate:'2026-10-02',
  summary:{totalRooms:100,activeRooms:25,totalMessages:1234,avgMessagesPerRoom:12.34,responseRate:50,maleFirstMessageRate:60,femaleFirstMessageRate:40,avgFirstResponseTimeMinutes:119.8,conversationWithin24hRate:70},
  hourlyDistribution:[{hour:0,count:0},{hour:9,count:100}],
  dailyTrend:[{date:'2026-10-01',messageCount:12,newRoomCount:3}],
  messageLengthDistribution:[{range:'1~10',count:34,percentage:20}],
};
beforeEach(() => { jest.clearAllMocks(); (chatService.getChatStats as jest.Mock).mockResolvedValue(stats); });
it('renders every statistics section and changes presets through actual HeroUI buttons', async () => {
  const user=userEvent.setup(); render(<ChatStatsTab />);
  await screen.findByRole('heading',{name:'요약 통계'});
  expect(chatService.getChatStats).toHaveBeenCalledWith({preset:'30days'});
  expect(screen.getByText('1,234')).toBeTruthy();
  expect(screen.getByText('2시간 0분')).toBeTruthy();
  expect(screen.getByRole('heading',{name:'여성 첫 메시지 비율'})).toBeTruthy();
  expect(screen.getByRole('table',{name:'시간대별 메시지 수'})).toBeTruthy();
  expect(screen.getByRole('table',{name:'날짜별 메시지와 새 채팅방 수'})).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'14일'}));
  await waitFor(() => expect(chatService.getChatStats).toHaveBeenLastCalledWith({preset:'14days'}));
});
it('sends calendar dates unchanged and prevents a reversed custom range', async () => {
  const user=userEvent.setup(); render(<ChatStatsTab />);
  await screen.findByRole('heading',{name:'요약 통계'});
  fireEvent.change(screen.getByLabelText('시작 날짜'),{target:{value:'2026-10-02'}});
  fireEvent.change(screen.getByLabelText('종료 날짜'),{target:{value:'2026-10-01'}});
  expect((screen.getByRole('button',{name:'조회'}) as HTMLButtonElement).disabled).toBe(true);
  expect(chatService.getChatStats).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('종료 날짜'),{target:{value:'2026-10-03'}});
  await user.click(screen.getByRole('button',{name:'조회'}));
  await waitFor(() => expect(chatService.getChatStats).toHaveBeenLastCalledWith({startDate:'2026-10-02',endDate:'2026-10-03'}));
});
it('retries a failed request without changing the chosen filter', async () => {
  (chatService.getChatStats as jest.Mock).mockRejectedValueOnce(new Error('통계 조회 실패'));
  const user=userEvent.setup();render(<ChatStatsTab />);
  await user.click(await screen.findByRole('button',{name:'재시도'}));
  await screen.findByRole('heading',{name:'요약 통계'});
  expect(chatService.getChatStats).toHaveBeenLastCalledWith({preset:'30days'});
});
