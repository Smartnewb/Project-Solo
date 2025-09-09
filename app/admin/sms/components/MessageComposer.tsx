// TITLE: 메세지 작성 컴포넌트
import { useState, useEffect } from "react";
import { SendSmsRequest, User } from '../types';
import { smsService } from '@/app/services/sms';
import { setSeconds } from "date-fns";

// MARK: - props
interface MessageComposerProps {
    recipients?: User[];
    templateId?: string;
    templateTitle?: string;
    templateContent?: string;
    onSendComplete?: () => void;

}

// MARK: - 메인 컴포넌트
export function MessageComposer({ recipients, templateId, templateTitle, templateContent, onSendComplete }: MessageComposerProps) {
    // === 상태관리 ===
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [scheduledAt, setScheduledAt] = useState<string>('');
    const [scheduledAtOpen, setScheduledAtOpen] = useState<boolean>(false);

    // 현재 사용 중인 소스 추적
    const [messageSource, setMessageSource] = useState<'draft' | 'template' | 'manual'>('manual');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastTemplateId, setLastTemplateId] = useState<string | undefined>();

    // === 임시 저장 ===
    const handleSave = async () => {
        if (!message.trim()) {
            alert('메세지를 입력해주세요.');
            return;
        }

        try {
            const savedData = {
                message,
                recipients,
                templateId: templateId || null, 
                templateTitle: templateTitle || null,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('sms_draft', JSON.stringify(savedData));
            setHasUnsavedChanges(false);
            alert('임시 저장이 완료되었습니다.');
        } catch (error) {
            console.log('임시 저장 실패:', error);
            alert('임시 저장에 실패했습니다.');
        }
    };

    // === 템플릿 적용 ===
    const handleApplyTemplate = () => {
        if (!templateContent) {
            alert('선택된 템플릿이 없습니다.');
            return;
        }

        setMessage(templateContent);
        setMessageSource('template');
        setHasUnsavedChanges(false);
        setLastTemplateId(templateId);
    };

    // === 템플릿 내용 불러오기 === 
    useEffect(() => {
        // 템플릿이 선택되고 내용이 있을 때
        if (templateContent && templateId && templateId !== lastTemplateId) {
            if (!message.trim() || !hasUnsavedChanges) {
                setMessage(templateContent);
                setMessageSource('template');
                setHasUnsavedChanges(false);
                setLastTemplateId(templateId);
            } else {
                const confirmReplace = confirm(
                    '현재 작성 중인 내용이 있습니다.\n템플릿을 불러오면 현재 내용이 사라집니다.\n계속하시겠습니까?'
                );

                if (confirmReplace) {
                    setMessage(templateContent);
                    setMessageSource('template');
                    setHasUnsavedChanges(false);
                    setLastTemplateId(templateId);
                }
            }
        } else if (!templateId && lastTemplateId) {
            // 템플릿 선택 해제 시, 내용 초기화
            setMessage('');
            setLastTemplateId(undefined);
            setMessageSource('manual');
            setHasUnsavedChanges(false);
        }
    }, [templateContent, templateId]);

    // === 임시저장 불러오기 === 
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('sms_draft');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                const timeDiff = Date.now() - new Date(parsed.savedAt).getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);

                // 임시저장 불러오기(24시간)
                if (hoursDiff < 24) {
                    const loadDraft = confirm(
                        `임시 저장된 메시지가 있습니다.\n저장 시간: ${new Date(parsed.savedAt).toLocaleString()}\n불러오시겠습니까?`
                    );

                    if (loadDraft) {
                        setMessage(parsed.message || '');
                        setMessageSource('draft');
                        setHasUnsavedChanges(false);

                        
                        if (parsed.templateId) {
                            setLastTemplateId(parsed.templateId);
                        }
                    } else {
                        // 불러오지 않으면 임시저장 삭제
                        localStorage.removeItem('sms_draft');
                    }
                } else {
                    // 임시저장 자동 삭제
                    localStorage.removeItem('sms_draft');
                }
            }
        } catch (error) {
            console.log('임시 저장 불러오기 실패:', error);
        }
    }, []);

    // === 수동 임시저장 불러오기 ===
    const handleLoadDraft = () => {
        try {
            const savedData = localStorage.getItem('sms_draft');
            if (!savedData) {
                alert('저장된 임시저장이 없습니다.');
                return;
            }
            
            const parsed = JSON.parse(savedData);
            
            // 현재 내용이 있으면 확인
            if (message.trim() && hasUnsavedChanges) {
                const confirmReplace = confirm(
                    '현재 작성 중인 내용이 있습니다.\n임시저장을 불러오면 현재 내용이 사라집니다.\n계속하시겠습니까?'
                );
                if (!confirmReplace) return;
            }
            
            setMessage(parsed.message || '');
            setMessageSource('draft');
            setHasUnsavedChanges(false);
            
            // 템플릿 정보 복원
            if (parsed.templateId) {
                setLastTemplateId(parsed.templateId);
            }
            
            alert(`임시저장을 불러왔습니다.\n저장 시간: ${new Date(parsed.savedAt).toLocaleString()}`);
        } catch (error) {
            console.error('임시저장 불러오기 실패:', error);
            alert('임시저장 불러오기에 실패했습니다.');
        }
    };

    // === 메세지 변경 추적 ===
    const handleMessageChange = (value: string) => {
        setMessage(value);
        setHasUnsavedChanges(true);
        setMessageSource('manual');
    };

    // === 메세지 초기화 ===
    const handleClearMessage = () => {
        if (message.trim() && hasUnsavedChanges) {
            const confirmClear = confirm('작성 중인 내용을 모두 삭제하시겠습니까?');
            if (!confirmClear) return;
        }

        setMessage('');
        setHasUnsavedChanges(false);
        setMessageSource('manual');
        setLastTemplateId(undefined);
    };

    // === sms 발송 ===
    const handleSend = async () => {
        console.log('=== 일반 발송 버튼 클릭 ===');
        console.log('현재 시간:', new Date());
        console.log('현재 시간 문자열:', new Date().toString());
        console.log('scheduledAt 상태:', scheduledAt);
        
        if (!message.trim()) {
            alert('메세지를 입력해주세요.');
            return;
        }

        // 수신자 미설정
        if (!recipients || recipients.length === 0) {
            alert('수신자를 선택해주세요.');
            return;
        }

        setLoading(true);

        try {
            const request: SendSmsRequest = {
                messageContent: message.trim(),
                templateId: templateId || '',
                templateTitle: templateTitle || '',
                recipients: recipients.map(user => ({
                    userId: user.userId,
                    phoneNumber: user.phoneNumber,
                    name: user.name,
                }))
                

            };
            
            console.log('=== 발송 요청 데이터 ===');
            console.log('request:', request);

            const response = await smsService.sendBulkSms(request);

            if (response.success) {
                console.log('=== 발송 성공 응답 ===');
                console.log('response:', response);
                
                const messageText = scheduledAt
                    ? `${recipients.length}명에게 예약 발송이 등록되었습니다.`
                    : `${recipients.length}명에게 메세지가 발송되었습니다..`
                alert(messageText);
                setMessage('');
                setHasUnsavedChanges(false);
                setScheduledAt(''); // 일반 발송 후 예약 시간 초기화
                localStorage.removeItem('sms_draft'); // 발송 후 임시저장 삭제
                onSendComplete?.();
            } else {
                throw new Error(response.message || '발송 실패');
            }







        } catch (error) {
            console.error('SMS 발송 실패:', error);
            alert('메세지 발송에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }



    };
    
    // === sms 예약 발송 ===
    const handleScheduleSubmit = async (datetime: string) => {
        console.log('=== 예약 발송 함수 시작 ===');
        console.log('전달받은 datetime:', datetime);
        console.log('현재 시간:', new Date());
        
        if (!datetime) {
            alert('예약 시간을 선택해주세요.');
            return;
        }

        const selectedTime = new Date(datetime);
        const now = new Date();
        
        console.log('선택된 시간 객체:', selectedTime);
        console.log('시간 비교 결과:', selectedTime <= now);

        if (selectedTime <= now) {
            alert('현재 시각보다 이후로 시간을 선택해주세요.');
            return;
        }

        if (!message.trim()) {
            alert('메세지를 입력해주세요.');
            return;
        }

        if (!recipients || recipients.length === 0) {
            alert('수신자를 선택해주세요.');
            return;
        }
        setLoading(true);
        setScheduledAtOpen(false);

    try {
        const request: SendSmsRequest = {
            messageContent: message.trim(),
            templateId: templateId || '',
            templateTitle: templateTitle || '',
            recipients: recipients.map(user => ({
                userId: user.userId,
                phoneNumber: user.phoneNumber,
                name: user.name,
            })),
            scheduledAt: datetime.replace('T',' ')
        };
        
        console.log('=== 예약 발송 요청 데이터 ===');
        console.log('request:', request);

        const response = await smsService.sendBulkSms(request);
        
        console.log('=== 예약 발송 응답 ===');
        console.log('response:', response);

        if (response.success) {
            const scheduledTime = new Date(datetime);
            alert(`${recipients.length}명에게 예약 발송이 등록되었습니다.\n발송 예정 시간: ${scheduledTime.toLocaleString('ko-KR')}`);
            setMessage('');
            setHasUnsavedChanges(false);
            setScheduledAt('');
            localStorage.removeItem('sms_draft');
            onSendComplete?.();
        } else {
            console.log('예약 발송 실패 응답:', response);
            throw new Error(response.message || '예약 발송 실패');
        }
    } catch (error) {
        console.error('예약 발송 에러:', error);
        alert('예약 발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
        setLoading(false);
    }
    
    };

    // === 예약 날짜 초기화 ===
    const handleClearSchedul = () => {
        setScheduledAt('');
    }

    // === JSX ===
    return (
        <>
            <div className='bg-white border border-[#D1D5DB] rounded-lg w-full px-4 sm:px-6 py-3 sm:py-4'>
                {/* MARK: - 헤더 */}
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-base sm:text-lg font-[400] text-[#111827]'>메세지 작성</h3>

                    {/* 상태 표시 */}
                    <div className='flex items-center gap-2'>
                        {/* 템플릿 적용 버튼 */}
                        {templateId && !message.trim() && (
                            <button
                                onClick={handleApplyTemplate}
                                className='text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700'
                            >
                                템플릿 적용
                            </button>
                        )}

                        {/* 상태 표시 */}
                        {messageSource === 'template' && templateTitle && (
                            <span className='text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded'>
                                템플릿: {templateTitle}
                            </span>
                        )}
                        {messageSource === 'draft' && (
                            <span className='text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded'>
                                임시저장 불러옴
                            </span>
                        )}
                        {hasUnsavedChanges && (
                            <span className='text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded'>
                                저장되지 않음
                            </span>
                        )}
                    </div>
                </div>

                {/* MARK: - 콘텐츠 영역 */}
                <div>
                    <div className='flex justify-between items-center mb-2'>
                        <label className='block text-sm font-[400] text-[#374151]'>
                            메세지 내용
                        </label>

                        {/* 템플릿 적용 및 임시 저장 불러오기 버튼*/}
                        <div className='flex gap-2'>
                            {templateId && message.trim() !== templateContent && (
                                <button
                                    type='button'
                                    onClick={handleApplyTemplate}
                                    className='text-xs text-purple-600 hover:text-purple-700 underline'
                                >
                                    템플릿 다시 적용
                                </button>
                            )}
                            <button
                                type='button'
                                onClick={handleLoadDraft}
                                className='text-xs text-blue-600 hover:text-blue-700 underline'
                            >
                                임시저장 불러오기
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={message}
                        onChange={(e) => handleMessageChange(e.target.value)} 
                        className="w-full rounded-md px-3 sm:px-4 py-2 sm:py-3 border border-[#D1D5DB] resize-none h-32 sm:h-40 text-sm sm:text-base text-[#111827] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#8C60EE]"
                        placeholder='메세지 내용을 입력하세요.'
                        maxLength={2400}
                        disabled={loading}
                    />

                    {/* 글자 수 카운터 */}
                    <div className='flex items-center justify-between mt-2 gap-1 sm:gap-0'>
                        <p className='text-xs sm:text-sm text-[#6B7280] font-[400]'>SMS 최대 길이: 2400자</p>
                        <p className='text-xs sm:text-sm text-[#6B7280] font-[400]'>{message.length}/2400자</p>
                    </div>
                </div>

                {/* MARK: - 하단 버튼 영역 */}
                <div className='flex flex-col sm:flex-row justify-between pt-9 pb-7 sm:pb-6'>
                    {/*  초기화 버튼 */}
                    <button
                        className='text-xs text-gray-500 hover:text-gray-700 underline'
                        onClick={handleClearMessage}
                        disabled={loading || !message.trim()}
                    >
                        내용 초기화
                    </button>
                    
                    {/*  임시 저장 버튼 */}
                    <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
                        <button
                            className='w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 
                            border border-[#D1D5DB] rounded-md
                            text-sm text-[#374151] font-[400]
                            hover:bg-gray-50 transition-colors'
                            onClick={handleSave}
                            disabled={loading || !message.trim()}
                        >
                            임시저장
                        </button>
                        
                        {/* 예약 발송 */}
                        <button
                            onClick={() => {
                                const now = new Date();
                                console.log('=== 예약 발송 버튼 클릭 ===');
                                console.log('현재 시간:', now);
                                console.log('현재 시간 문자열:', now.toString());
                                const year = now.getFullYear();
                                const month = String(now.getMonth() + 1).padStart(2, '0');
                                const day = String(now.getDate()).padStart(2, '0');
                                const hours = String(now.getHours()).padStart(2, '0');
                                const minutes = String(now.getMinutes()).padStart(2, '0');
                                const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}`;
                                console.log('포맷된 시간:', formattedTime);
                                setScheduledAt(formattedTime);
                                setScheduledAtOpen(true);
                            }}
                            className='w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 
                            border border-[#D1D5DB] rounded-md
                            text-sm text-[#374151] font-[400]
                            hover:bg-gray-50 transition-colors'
                        >
                            예약 발송
                        </button>
                        <button
                            className='w-full sm:w-auto flex items-center justify-center gap-2 
                            px-4 sm:px-6 py-2 sm:py-2.5 
                            bg-[#885AEB] hover:bg-purple-700
                            text-white font-[400] text-sm rounded-md
                            transition-colors'
                            onClick={handleSend}
                            disabled={loading || !message.trim() || !recipients?.length}
                        >
                            {loading ? (
                                <div className='animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent' />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                                    <path d="M15.9092 0.174997C16.2248 0.393747 16.3905 0.771872 16.3311 1.15L14.3311 14.15C14.2842 14.4531 14.0998 14.7187 13.8311 14.8687C13.5623 15.0187 13.2405 15.0375 12.9561 14.9187L9.21859 13.3656L7.07796 15.6812C6.79984 15.9844 6.36234 16.0844 5.97796 15.9344C5.59359 15.7844 5.34359 15.4125 5.34359 15V12.3875C5.34359 12.2625 5.39046 12.1437 5.47484 12.0531L10.7123 6.3375C10.8936 6.14062 10.8873 5.8375 10.6998 5.65C10.5123 5.4625 10.2092 5.45 10.0123 5.62812L3.65609 11.275L0.896712 9.89375C0.565462 9.72812 0.352962 9.39687 0.343587 9.02812C0.334212 8.65937 0.527962 8.31562 0.846712 8.13125L14.8467 0.131247C15.1811 -0.0593776 15.5936 -0.0406276 15.9092 0.174997Z" fill="white" />
                                </svg>
                            )}

                            {loading ? '발송중 ...' : '발송하기'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 예약 시간 설정 모달*/}
            {scheduledAtOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0'>
                    <div className='bg-white rounded-lg p-6 w-96'>
                <h3 className='text-lg font-semibold mb-4'>예약 발송 시간 설정</h3>
                <input
                    type='datetime-local'
                    value={scheduledAt}
                    className='w-full border rounded px-3 py-2 mb-4'
                    onChange={(e) => {
                        console.log('=== input onChange ===');
                        console.log('이전 값:', scheduledAt);
                        console.log('새로운 값:', e.target.value);
                        setScheduledAt(e.target.value);
                    }}
                />
                <div className='text-xs text-gray-500 mb-2'>
                    현재 scheduledAt 상태: {scheduledAt}
                </div>
                <div className='flex gap-2'>
                    <button
                        onClick={() => setScheduledAtOpen(false)}
                        className='px-4 py-2 border rounded hover:bg-gray-50 transition-colors'
                    >
                    취소
                    </button>
                    <button
                        onClick={() => handleScheduleSubmit(scheduledAt)}
                        disabled={!scheduledAt}
                        className='px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors'
                    >
                        설정
                    </button>
                </div>
            </div>
        </div>
            )}
        </>
    );
}

