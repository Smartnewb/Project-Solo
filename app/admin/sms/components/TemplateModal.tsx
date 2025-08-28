// TITLE: - 템플릿 생성 모달

'use client';

import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { SmsTemplate } from '../types';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: any) => void;
    // TODO: 템플릿 수정 기능
}

// MARK: - 템플릿 생성 모달
export function TemplateModal({ isOpen, onClose, onSave }: TemplateModalProps) {
    // === 상태 관리 ===
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    // === 변수 삽입 함수 ===
    const insertVariable = (variable: string) => {
        setContent(prev => {
            return prev + `{${variable}}`;
        });
    };

    // === 저장 함수 ===
    const handleSave = () => {
        // 제목 검증
        if (title.trim() === '') {
            setError('제목을 입력해주세요.');
            return;
        }

        // 내용 검증
        if (content.trim() === '') {
            setError('내용을 입력해주세요.');
            return;
        }

        // 템플릿 객체 생성
        const newTemplate = {
            id: Date.now().toString(), // 임시 id
            title: title.trim(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // 저장
        onSave(newTemplate);

        // NOTE: 모달 닫고 초기화 (무슨 말이지?)
        handleClose();

    };

    // === 종료 함수 ===
    const handleClose = () => {
        setTitle('');
        setContent('');
        setError(null);

        onClose();
    };

    // === 렌더링(JSX) ===
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleClose();
                        }
                    }}
                > 

                    {/* MARK: - 모달 전체 
                    TODO:
                    - 모달 헤더 텍스트 weight 변경
                    - 닫기 버튼 아이콘 변경(figma svg 참고)*/}
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg"
                        onClick = {(e) => {e.stopPropagation()}}>
                            {/* 모달 헤더 */}
                            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b">
                                <h2 className="text-base sm:text-lg font-medium text-gray-900">
                                    새 템플릿 만들기
                                </h2>

                                <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
                                    <X size={20}/>
                                </button>
                            </div>

                            {/* MARK: - 모달 바디 */}
                            <div className="px-4 sm:px-6 py-5 space-y-5">
                                    {/* 템플릿 제목 입력 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5"> 템플릿 제목 *</label>
                                        <input 
                                            type="text" 
                                            value={title}
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                setError(null);
                                                
                                            }}
                                            maxLength={50}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="예: 신규 회원 환영 메세지"/>
                                            {/* 하단 텍스트 */}
                                        <div className="flex justify-between">
                                            <p className="text-xs text-gray-500 mt-1">
                                                템플릿을 구분할 수 있는 제목을 입력하세요
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {title.length}/50자
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* MARK: - 템플릿 컨텐츠 입력 
                                    TODO:
                                    - 플레이스 홀더 변경
                                    - 클래스 적용*/}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">메세지 내용 *</label>
                                        <textarea 
                                            value={content}
                                            onChange={(e) => {
                                                setContent(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="예: 안녕하세요! 서비스 가입을 환영합니다. 궁금한 사항이 있으시면 언제든 문의해주세요."
                                            rows={5}
                                            maxLength={2400}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                            />
                                            
                                            {/* 글자 수 카운터 
                                            TODO:
                                            - 스타일 클래스 적용*/}
                                            <div className="flex justify-between">
                                                <p className="text-xs text-gray-500 mt-1">
                                                    SMS 최대 길이: 90바이트 (한글 45글자)
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {content.length}/2400자
                                                </p>
                                            </div>
                                            

                                    </div>

                                    {/* MARK: - 변수 섹션 
                                    TODO:
                                    - 섹션 헤더에 info 아이콘 등록*/}
                                    <div className="bg-gray-50 rounded-md p-3 sm:p-4 mt-2">
                                        {/* 섹션 헤더 */}
                                        <div className="flex items-center gap-1.5 mb-2.5">
                                            <Info size={16} className="text-gray-500"/>
                                            
                                            <span className="text-xs sm:text-sm font-medium text-gray-700">사용 가능한 변수</span>
                                        </div>
                                        
                                        {/* 섹션 컨텐츠 */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center">
                                                <code className="bg-white px-1.5 py-0.5 rounded text-purple-600 text-xs font-mono border">
                                                    {'{name}'}
                                                </code>
                                                <span className="ml-2 text-gray-600 text-xs">
                                                    - 사용자 이름
                                                </span>
                                            </div>

                                            <div className="flex">
                                                <code className="bg-white px-1.5 py-0.5 rounded text-purple-600 text-xs font-mono border">
                                                    {'{date}'}
                                                </code>
                                                <span className="ml-2 text-gray-600 text-xs">
                                                    - 현재 날짜
                                                </span>
                                            </div>
                                        </div>

                                    </div>   
                                </div>
                            {/* MARK: - 모달 푸터 구현 */}
                            <div className="flex flex-col-reverse rounded-lg sm:flex-row gap-2 sm:gap-3 justify-end px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50">
                                {/* 취소 버튼 */}
                                <button
                                    onClick={handleClose}
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                                        취소
                                    </button>

                                {/* 저장 버튼 */}
                                <button 
                                    onClick={handleSave}
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-[#885AEB] text-white rounded-md hover:bg-purple-700 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="17" viewBox="0 0 14 17" fill="none">
                                            <path d="M2 1.5C0.896875 1.5 0 2.39688 0 3.5V13.5C0 14.6031 0.896875 15.5 2 15.5H12C13.1031 15.5 14 14.6031 14 13.5V5.91563C14 5.38438 13.7906 4.875 13.4156 4.5L11 2.08438C10.625 1.70938 10.1156 1.5 9.58438 1.5H2ZM2 4.5C2 3.94688 2.44688 3.5 3 3.5H9C9.55313 3.5 10 3.94688 10 4.5V6.5C10 7.05312 9.55313 7.5 9 7.5H3C2.44688 7.5 2 7.05312 2 6.5V4.5ZM7 9.5C7.53043 9.5 8.03914 9.71071 8.41421 10.0858C8.78929 10.4609 9 10.9696 9 11.5C9 12.0304 8.78929 12.5391 8.41421 12.9142C8.03914 13.2893 7.53043 13.5 7 13.5C6.46957 13.5 5.96086 13.2893 5.58579 12.9142C5.21071 12.5391 5 12.0304 5 11.5C5 10.9696 5.21071 10.4609 5.58579 10.0858C5.96086 9.71071 6.46957 9.5 7 9.5Z" fill="white"/>
                                        </svg>
                                    {loading ? '저장 중...' : '템플릿 저장'}
                                    </button>

                            </div>


                    </div>

                </div>
            )}
        </>
    );




}