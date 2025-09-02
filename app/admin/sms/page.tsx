// TITLE: - sms 관리 페이지
'use client';

import { useState } from 'react';
import { RecipientSelector } from './components/RecipientSelector';
import { TemplateManager } from './components/TemplateManager';
import { MessageComposer } from './components/MessageComposer';
import { SmsHistoryTable } from './components/SmsHistoryTable';
import { User, SmsTemplate } from './types';

export default function Smspage() {
    // === 상태관리 ===
    const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);

    // === 핸들링 ===
    // 발송 완료 핸들러
    const handleSendComplete = () => {
        setSelectedRecipients([]); // 발송 후 초기화
        setSelectedTemplate(null); // 발송 내역 새로고침
    };


    // === JSX ===
    return (
        // MARK: - 전체 페이지
        <div className='bg-[#F9FAFB] min-h-screen px-4 sm:px-6 md:px-8 lg:px-20 xl:px-25'>
            {/* MARK: - 컨텐츠 영역 */}
            <div className='grid grid-cols-1 md:grid-cols-8 lg:grid-cols-10 gap-6'>
                <div className='lg:col-span-3'>
                    <RecipientSelector
                        onRecipientsChange={setSelectedRecipients} />
                </div>

                <div className='lg:col-span-7 space-y-6'>
                    <TemplateManager onTemplateSelect={setSelectedTemplate}/>
                    <MessageComposer
                        recipients={selectedRecipients}
                        templateId={selectedTemplate?.id}
                        templateTitle={selectedTemplate?.title}
                        templateContent={selectedTemplate?.content}
                        onSendComplete={handleSendComplete}/>
                    <SmsHistoryTable />
                </div>
            </div>
        </div>
    );
}


