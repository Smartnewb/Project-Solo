// TITLE: 메세지 작성 컴포넌트
import { useState, useEffect } from "react";

interface MessageComposerProps {
    templateId?: string;
    templateTitle?: string;
    templateContent?: string;
    onMessageChange?: (message: string) => void;
}

export function MessageComposer({ templateId, templateTitle, templateContent, onMessageChange }: MessageComposerProps) {
    // === 상태관리 ===
    const [message, setMessage] = useState<string>('');
    const [scheduledAt, setScheduledAt] = useState<string>('');
    const [scheduledAtOpen, setScheduledAtOpen] = useState<boolean>(false);

    const [messageSource, setMessageSource] = useState<'draft' | 'template' | 'manual'>('manual');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastTemplateId, setLastTemplateId] = useState<string | undefined>();

    const updateMessage = (value: string, source: 'draft' | 'template' | 'manual', dirty: boolean) => {
        setMessage(value);
        setMessageSource(source);
        setHasUnsavedChanges(dirty);
        onMessageChange?.(value);
    };

    // === 임시 저장 ===
    const handleSave = async () => {
        if (!message.trim()) {
            alert('메세지를 입력해주세요.');
            return;
        }

        try {
            const savedData = {
                message,
                templateId: templateId || null,
                templateTitle: templateTitle || null,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('sms_draft', JSON.stringify(savedData));
            setHasUnsavedChanges(false);
            alert('임시 저장이 완료되었습니다.');
        } catch (error) {
            alert('임시 저장에 실패했습니다.');
        }
    };

    // === 템플릿 적용 ===
    const handleApplyTemplate = () => {
        if (!templateContent) {
            alert('선택된 템플릿이 없습니다.');
            return;
        }

        updateMessage(templateContent, 'template', false);
        setLastTemplateId(templateId);
    };

    // === 템플릿 내용 불러오기 ===
    useEffect(() => {
        if (templateContent && templateId && templateId !== lastTemplateId) {
            if (!message.trim() || !hasUnsavedChanges) {
                updateMessage(templateContent, 'template', false);
                setLastTemplateId(templateId);
            } else {
                const confirmReplace = confirm(
                    '현재 작성 중인 내용이 있습니다.\n템플릿을 불러오면 현재 내용이 사라집니다.\n계속하시겠습니까?'
                );

                if (confirmReplace) {
                    updateMessage(templateContent, 'template', false);
                    setLastTemplateId(templateId);
                }
            }
        } else if (!templateId && lastTemplateId) {
            updateMessage('', 'manual', false);
            setLastTemplateId(undefined);
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

                if (hoursDiff < 24) {
                    const loadDraft = confirm(
                        `임시 저장된 메시지가 있습니다.\n저장 시간: ${new Date(parsed.savedAt).toLocaleString()}\n불러오시겠습니까?`
                    );

                    if (loadDraft) {
                        updateMessage(parsed.message || '', 'draft', false);

                        if (parsed.templateId) {
                            setLastTemplateId(parsed.templateId);
                        }
                    } else {
                        localStorage.removeItem('sms_draft');
                    }
                } else {
                    localStorage.removeItem('sms_draft');
                }
            }
        } catch (error) {
            ;
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

            if (message.trim() && hasUnsavedChanges) {
                const confirmReplace = confirm(
                    '현재 작성 중인 내용이 있습니다.\n임시저장을 불러오면 현재 내용이 사라집니다.\n계속하시겠습니까?'
                );
                if (!confirmReplace) return;
            }

            updateMessage(parsed.message || '', 'draft', false);

            if (parsed.templateId) {
                setLastTemplateId(parsed.templateId);
            }

            alert(`임시저장을 불러왔습니다.\n저장 시간: ${new Date(parsed.savedAt).toLocaleString()}`);
        } catch (error) {
            alert('임시저장 불러오기에 실패했습니다.');
        }
    };

    // === 메세지 변경 추적 ===
    const handleMessageChange = (value: string) => {
        updateMessage(value, 'manual', true);
    };

    // === 메세지 초기화 ===
    const handleClearMessage = () => {
        if (message.trim() && hasUnsavedChanges) {
            const confirmClear = confirm('작성 중인 내용을 모두 삭제하시겠습니까?');
            if (!confirmClear) return;
        }

        updateMessage('', 'manual', false);
        setLastTemplateId(undefined);
    };

    // === JSX ===
    return (
        <>
            <div className='bg-white border border-[#D1D5DB] rounded-lg w-full px-4 sm:px-6 py-3 sm:py-4'>
                {/* MARK: - 헤더 */}
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-base sm:text-lg font-[400] text-[#111827]'>메세지 작성</h3>

                    <div className='flex items-center gap-2'>
                        {templateId && !message.trim() && (
                            <button
                                onClick={handleApplyTemplate}
                                className='text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700'
                            >
                                템플릿 적용
                            </button>
                        )}

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
                    />

                    <div className='flex items-center justify-between mt-2 gap-1 sm:gap-0'>
                        <p className='text-xs sm:text-sm text-[#6B7280] font-[400]'>SMS 최대 길이: 2400자</p>
                        <p className='text-xs sm:text-sm text-[#6B7280] font-[400]'>{message.length}/2400자</p>
                    </div>
                </div>

                {/* MARK: - 하단 버튼 영역 */}
                <div className='flex flex-col sm:flex-row justify-between pt-9 pb-7 sm:pb-6'>
                    <button
                        className='text-xs text-gray-500 hover:text-gray-700 underline'
                        onClick={handleClearMessage}
                        disabled={!message.trim()}
                    >
                        내용 초기화
                    </button>

                    <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
                        <button
                            className='w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5
                            border border-[#D1D5DB] rounded-md
                            text-sm text-[#374151] font-[400]
                            hover:bg-gray-50 transition-colors'
                            onClick={handleSave}
                            disabled={!message.trim()}
                        >
                            임시저장
                        </button>
                    </div>
                </div>
            </div>

            {scheduledAtOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0'>
                    <div className='bg-white rounded-lg p-6 w-96'>
                        <h3 className='text-lg font-semibold mb-4'>예약 발송 시간 설정</h3>
                        <input
                            type='datetime-local'
                            value={scheduledAt}
                            className='w-full border rounded px-3 py-2 mb-4'
                            onChange={(e) => setScheduledAt(e.target.value)}
                        />
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setScheduledAtOpen(false)}
                                className='px-4 py-2 border rounded hover:bg-gray-50 transition-colors'
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
