// TITLE: - 템플릿 관리
'use client';

import { Trash2, Edit2, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TemplateModal } from '../components/TemplateModal';
import { SmsTemplate } from '../types';
import { smsService } from '@/app/services/sms';

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
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null); // 템플릿 수정 추적
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create'); // 모달 모드 추적

    // === 템플릿 불러오기 ===
    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await smsService.getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('템플릿 불러오기 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // === 컴포넌트 마운트 시, 템플릿 불러오기 ===
    useEffect(() => {
        fetchTemplates();
    }, []);

    // === 드롭다운 메뉴 닫기 ===
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (activeMenuId !== null) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMenuId]); 

    // === 템플릿 저장/추가/수정  === 
    const handleSaveTemplate = async (newTemplate: SmsTemplate) => {
        try {
            setIsLoading(true);

            if (modalMode === 'edit' && editingTemplate) {
                // 수정 
                const updatedTemplate = await smsService.updateTemplate(editingTemplate.id, {
                    title: newTemplate.title,
                    content: newTemplate.content,
                });

                setTemplates(prev =>
                    prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
                );

            
                if (selectedTemplateId === editingTemplate.id) {
                    onTemplateSelect?.(updatedTemplate);
                }

                alert('템플릿이 수정되었습니다.');
            } else {
                // 생성
                const savedTemplate = await smsService.createTemplate({
                    title: newTemplate.title,
                    content: newTemplate.content,
                });

                setTemplates(prev => [savedTemplate, ...prev]);
                alert('템플릿이 저장되었습니다.');
            }

            setIsModalOpen(false);
            setEditingTemplate(null);
            setModalMode('create');
        } catch (error) {
            console.error('템플릿 저장 실패:', error);
            alert(modalMode === 'edit' ? '템플릿 수정에 실패했습니다.' : '템플릿 저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // === 템플릿 선택 === 
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

    // === 템플릿 삭제 === 
    const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
        if (!confirm(`"${templateTitle}" 템플릿을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            setIsLoading(true);
            await smsService.removeTemplate(templateId);
            setTemplates(prev => prev.filter(t => t.id !== templateId));

            if (selectedTemplateId === templateId) {
                setSelectedTemplateId('');
                onTemplateSelect?.(null);
            }

            setActiveMenuId(null);
            alert('템플릿이 삭제되었습니다.');
        } catch (error) {
            console.error('템플릿 삭제 실패:', error)
            alert('템플릿 삭제에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // === 템플릿 수정 ===
    const handleEditClick = (templateId: string) => {
        const targetTemplate = template.find(t => t.id === templateId);
        if (targetTemplate) {
            setEditingTemplate(targetTemplate);
            setModalMode('edit');
            setIsModalOpen(true);
            setActiveMenuId(null);
        }
    };

    // === 템플릿 생성 ===
    const handleNewTemplateClick = () => {
        setEditingTemplate(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    // === JSX ===
    return (
        <>
            {/* MARK: - 전체 컨테이너 */}
            <div className='bg-white border border-[#E5E7EB] px-6 pt-6 pb-10 rounded-lg'>
                {/* MARK: - 헤더 */}
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-base sm:text-lg font-[400] text-[#111827]'>메세지 템플릿</h3>
                    <button
                        className='flex w-full items-center justify-center gap-2 sm:w-auto px-4 py-2 text-sm font-medium text-white bg-[#885AEB] hover:bg-purple-700 transition-colors rounded-md'
                        onClick={handleNewTemplateClick}  
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7.73438 1.5C7.73438 0.946875 7.2875 0.5 6.73438 0.5C6.18125 0.5 5.73438 0.946875 5.73438 1.5V6H1.23438C0.68125 6 0.234375 6.44688 0.234375 7C0.234375 7.55312 0.68125 8 1.23438 8H5.73438V12.5C5.73438 13.0531 6.18125 13.5 6.73438 13.5C7.2875 13.5 7.73438 13.0531 7.73438 12.5V8H12.2344C12.7875 8 13.2344 7.55312 13.2344 7C13.2344 6.44688 12.7875 6 12.2344 6H7.73438V1.5Z" fill="white" />
                        </svg>
                        새 템플릿
                    </button>
                </div>

                {/* MARK: - 콘텐츠 영역 */}
                <div>
                    <label className='block text-sm font-[400] text-[#374151] mb-2'>
                        템플릿 선택
                    </label>

                    {/* 템플릿 목록 */}
                    {template.length === 0 ? (
                        <div className='text-center py-8 text-gray-500 text-sm'>
                            등록된 템플릿이 없습니다.
                        </div>
                    ) : (
                        <>
                            <div className='space-y-2 max-h-72 overflow-y-auto'>
                                <div
                                    className={`relative p-3 border rounded-md cursor-pointer transition-colors
                                        ${!selectedTemplateId
                                            ? 'border-[#885AEB] bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => handleSelectTemplate('')}
                                >
                                    <div className='flex items-center'>
                                        <h4 className='font-medium text-sm text-gray-600'>템플릿 미선택</h4>
                                    </div>
                                </div>

                                {/* 기존 템플릿 목록 */}
                                {template.map((t) => (
                                    <div
                                        key={t.id}
                                        className={`relative p-3 border rounded-md cursor-pointer transition-colors
                                            ${selectedTemplateId === t.id
                                                ? 'border-[#885AEB] bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => handleSelectTemplate(t.id)}
                                    >
                                        <div className='flex justify-between items-start'>
                                            {/* 템플릿 정보 */}
                                            <div className='flex-1 pr-2'>
                                                <h4 className='font-medium text-sm text-gray-900'>{t.title}</h4>
                                                <p className='text-xs text-gray-500 mt-1 line-clamp-2'>{t.content}</p>
                                            </div>

                                            {/* 수정,삭제 버튼 */}
                                            <div className='relative'>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === t.id ? null : t.id);
                                                    }}
                                                    className='p-1 hover:bg-gray-100 rounded transition-colors'
                                                >
                                                    <MoreVertical className='w-4 h-4 text-gray-500' />
                                                </button>

                                                {/* 드롭다운 메뉴 */}
                                                {activeMenuId === t.id && (
                                                    <div className='absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-lg z-10'>
                                                        {/* 수정 버튼 */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditClick(t.id);
                                                            }}
                                                            className='flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                                        >
                                                            <Edit2 className='w-3 h-3' />
                                                            수정
                                                        </button>

                                                        {/* 삭제 버튼 */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTemplate(t.id, t.title);
                                                            }}
                                                            disabled={isLoading}
                                                            className='flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50'
                                                        >
                                                            <Trash2 className='w-3 h-3' />
                                                            삭제
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 템플릿 미리보기*/}
                            {selectedTemplateId && (
                                <div className='mt-4 p-3 bg-gray-50 rounded-md'>
                                    <div className='flex justify-between items-start mb-2'>
                                        <p className='text-xs text-gray-600 font-medium'>선택된 템플릿</p>
                                        <button
                                            onClick={() => handleSelectTemplate('')}
                                            className='text-xs text-gray-500 hover:text-gray-700 underline'
                                        >
                                            선택 해제
                                        </button>
                                    </div>
                                    <p className='text-sm text-gray-800 whitespace-pre-wrap'>
                                        {template.find(t => t.id === selectedTemplateId)?.content}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* MARK: - 템플릿 추가/수정 모달창 */}
            <TemplateModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTemplate(null);
                    setModalMode('create');
                }}
                onSave={handleSaveTemplate}
                editingTemplate={editingTemplate}  
                mode={modalMode} 
            />
        </>);
}