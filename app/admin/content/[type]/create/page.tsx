'use client';

import { useParams, notFound } from 'next/navigation';
import { CardSeriesForm } from '../../components/forms/CardSeriesForm';
import { ArticleForm } from '../../components/forms/ArticleForm';
import { NoticeForm } from '../../components/forms/NoticeForm';

export default function CreatePage() {
  const { type } = useParams<{ type: string }>();
  if (type === 'card-series') return <CardSeriesForm mode="create" />;
  if (type === 'article') return <ArticleForm mode="create" />;
  if (type === 'notice') return <NoticeForm mode="create" />;
  notFound();
}
