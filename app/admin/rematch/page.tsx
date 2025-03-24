'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Alert
} from '@mui/material';

export default function RematchRequestPage() {
  const [rematchRequests, setRematchRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; content: string } | null>(null);

  const fetchRematchRequests = async () => {
    try {
      setIsLoading(true);
      console.log('재매칭 요청 조회 시작');
      const response = await fetch('/api/admin/rematch-requests');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('재매칭 요청 데이터:', data);
      
      setRematchRequests(data.requests || []);
      
      if (data.requests && data.requests.length > 0) {
        setMessage({
          type: 'info',
          content: `${data.requests.length}건의 재매칭 요청이 있습니다.`
        });
      } else {
        setMessage({
          type: 'info',
          content: '현재 재매칭 요청이 없습니다.'
        });
      }
    } catch (error) {
      console.error('재매칭 요청 조회 실패:', error);
      setMessage({
        type: 'error',
        content: '재매칭 요청 목록을 불러오는데 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processRematch = async (userId: string) => {
    try {
      console.log('재매칭 처리 시작:', userId);
      
      const response = await fetch('/api/admin/process-rematch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('재매칭 처리 결과:', data);

      // 재매칭 요청 목록 새로고침
      fetchRematchRequests();

      setMessage({
        type: 'success',
        content: '재매칭이 성공적으로 처리되었습니다.'
      });
    } catch (error) {
      console.error('재매칭 처리 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '재매칭 처리에 실패했습니다.'
      });
    }
  };

  useEffect(() => {
    fetchRematchRequests();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Typography variant="h4" component="h1" gutterBottom>
          재매칭 요청 관리
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchRematchRequests}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : '목록 새로고침'}
        </Button>
      </div>
      
      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          className="mb-4"
        >
          {message.content}
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <CircularProgress />
        </div>
      ) : (
        <div className="space-y-4">
          {rematchRequests.length > 0 ? (
            rematchRequests.map((request) => (
              <Card key={request.id} className="mb-4">
                <CardContent>
                  <div className="flex justify-between">
                    <div>
                      <Typography variant="h6">
                        {request.userName || '이름 없음'} ({request.gender || '성별 미상'})
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        요청 시간: {new Date(request.created_at).toLocaleString('ko-KR')}
                      </Typography>
                      {request.reason && (
                        <Typography variant="body2" className="mt-2">
                          요청 사유: {request.reason}
                        </Typography>
                      )}
                    </div>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => processRematch(request.user_id)}
                    >
                      재매칭 처리
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" className="text-center">
                  현재 재매칭 요청이 없습니다.
                </Typography>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 