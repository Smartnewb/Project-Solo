// TITLE: - 템플릿 관리
'use client';

import { useState, useEffect } from 'react';
import { TemplateModal } from '../components/TemplateModal';
import { SmsTemplate } from '../types';
import { smsService} from '@/app/services/sms';



// MARK: - props
interface TemplateManagerProps {
    onTemplateSelect?: (template: SmsTemplate | null) => void;
}

export function TemplateManager({ onTemplateSelect }: TemplateManagerProps) {
    // === 상태관리 ===
    const [template, setTemplates] = useState<SmsTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // === 템플릿 불러오기 ===
    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await smsService.getTemplates();
            setTemplates(data);
        } catch(error) {
            console.error('템플릿 불러오기 실패:',error);
        } finally {
            setIsLoading(false);
        }
    };

    // === 컴포넌트 마운트 시, 템플릿 불러오기 ===
    useEffect(() => {
        fetchTemplates();
    }, []);
    
    // === 핸들링 ===

    // 템플릿 추가
    const handleAddTemplate = async (newTemplate: SmsTemplate) => {
        try {
            setIsLoading(true);
            const savedTemplate = await smsService.createTemplate({
                title: newTemplate.title,
                content: newTemplate.content,
            });

            setTemplates(prev => [savedTemplate, ...prev]);
            setIsModalOpen(false);
        } catch (error) {
            console.error('템플릿 저장 실패:', error);
            alert('템플릿 저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 템플릿 선택
    const handleSelectTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const selected = template.find(t => t.id === templateId);

        if (templateId === '') {
            onTemplateSelect?.(null);
        } else if (selected) {
            onTemplateSelect?.(selected);
        }

        setIsDropdownOpen(false);
    };

    // TODO: - 템플릿 삭제 추가 구현

    // === JSX ===
    return (
    <>
        {/* MARK: - 전체 컨테이너 */}
        <div className='bg-white border border-[#E5E7EB] px-6 pt-6 pb-10 rounded-lg'>
            {/* MARK: - 헤더 */}
            <div className='flex items-center justify-between'>
                <h3 className='text-base sm:text-lg font-[400] text-[#111827]'>메세지 템플릿</h3>
                <button
                    className='flex w-full items-center justify-center gap-2 sm:w-auto px-4 py-2 text-sm font-medium text-white bg-[#885AEB] hover:bg-purple-700 transition-colors rounded-md'
                    onClick={() => setIsModalOpen(true)} // TODO: - 클릭 이벤트 수정
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7.73438 1.5C7.73438 0.946875 7.2875 0.5 6.73438 0.5C6.18125 0.5 5.73438 0.946875 5.73438 1.5V6H1.23438C0.68125 6 0.234375 6.44688 0.234375 7C0.234375 7.55312 0.68125 8 1.23438 8H5.73438V12.5C5.73438 13.0531 6.18125 13.5 6.73438 13.5C7.2875 13.5 7.73438 13.0531 7.73438 12.5V8H12.2344C12.7875 8 13.2344 7.55312 13.2344 7C13.2344 6.44688 12.7875 6 12.2344 6H7.73438V1.5Z" fill="white"/>
                    </svg>
                    새 템플릿
                </button>
            </div>

            {/* MARK: - 콘텐츠 영역 */}
            <div>
                <label
                    className='block text-sm font-[400] text-[#374151] mb-2'>템플릿 선택</label>
                <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className='w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-1 focust:ring-[#8558EA]'
                    >
                    <option value=''>템플릿을 선택하세요</option>
                    {template.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* MARK: - 템플릿 추가 모달창 */}
        <TemplateModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleAddTemplate}
        />
    </>);
}