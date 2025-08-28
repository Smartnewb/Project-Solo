// TITLE: 메세지 작성 컴포넌트
import { useState, useEffect } from "react"; 
import { SendSmsRequest, User } from '../types';
import { smsService } from '@/app/services/sms';


// MARK: - props
interface MessageComposerProps {
    recipients?: User[]; // 수신자 목록
    templateId?: string;
    templateTitle?: string;
    onSendComplete?: () => void;
}

// MARK: - 메인 컴포넌트
export function MessageComposer({ recipients, templateId, templateTitle, onSendComplete }: MessageComposerProps) {
    // === 상태관리 ===
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // === 임시 저장 ===
    const handleSave = async () => {
        if (!message.trim()) {
            alert('메세지를 입력해주세요.');
            return;
        }

        try {
            // NOTE: - localStorage 임시 저장
            const savedData = {
                message,
                recipients,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('sms_draft', JSON.stringify(savedData));
            alert('임시 저장이 완료되었습니다.');
        } catch(error) {
            console.log('임시 저장 실패:',error);
            alert('임시 저장에 실패했습니다.');
        }
    };

    // === sms 발송 ===
    const handleSend = async () => {
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

            await smsService.sendBulkSms(request);

            // 발송 후 메세지 초기화
            setMessage('')
            localStorage.remove('sms_draft')

            onSendComplete?.();

        } catch(error) {
            console.error('SMS 발송 실패:',error);
            alert('메세지 발송에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }



    };

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('sms_draft');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setMessage(parsed.message || '');
            }
        } catch (error) {
            console.log('임시 저장 불러오기 실패:', error);
        }
    }, []);

    // === JSX ===
    return (
        <>
        {/* MARK: - 전체 컨테이너 */}
        <div className='bg-white border border-[#D1D5DB] rounded-lg w-full px-4 sm:px-6 py-3 sm:py-4'>
            {/* MARK: - 헤더 */}
            <div>
                <h3 className='text-base sm:text-lg font-[400] text-[#111827]'>메세지 작성</h3>
            </div>

            {/* MARK: - 콘텐츠 영역 */}
            <div>
                <label className='block text-sm font-[400] text-[#374151] mb-2'>메세지 내용</label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
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
            <div className='flex flex-col sm:flex-row justify-end gap-2 pt-9 sm:gap-3 pb-7 sm:pb-6'>
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

            
                <button
                    className='w-full sm:w-auto flex items-center justify-center gap-2 
                        px-4 sm:px-6 py-2 sm:py-2.5 
                        bg-[#7C3AED] hover:bg-[#6D28D9] 
                        text-white font-[400] text-sm rounded-md
                        transition-colors
                        '
                    onClick={handleSend}
                    disabled={loading || !message.trim() || !recipients?.length}
                    >
                        {loading ? (
                            <div className='animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent' />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                                <path d="M15.9092 0.174997C16.2248 0.393747 16.3905 0.771872 16.3311 1.15L14.3311 14.15C14.2842 14.4531 14.0998 14.7187 13.8311 14.8687C13.5623 15.0187 13.2405 15.0375 12.9561 14.9187L9.21859 13.3656L7.07796 15.6812C6.79984 15.9844 6.36234 16.0844 5.97796 15.9344C5.59359 15.7844 5.34359 15.4125 5.34359 15V12.3875C5.34359 12.2625 5.39046 12.1437 5.47484 12.0531L10.7123 6.3375C10.8936 6.14062 10.8873 5.8375 10.6998 5.65C10.5123 5.4625 10.2092 5.45 10.0123 5.62812L3.65609 11.275L0.896712 9.89375C0.565462 9.72812 0.352962 9.39687 0.343587 9.02812C0.334212 8.65937 0.527962 8.31562 0.846712 8.13125L14.8467 0.131247C15.1811 -0.0593776 15.5936 -0.0406276 15.9092 0.174997Z" fill="white"/>
                            </svg>
                        )}

                        {loading ? '발송중 ...' : '발송하기'}
                </button>
            </div>
                

        </div>

            
    </>
    );
}

