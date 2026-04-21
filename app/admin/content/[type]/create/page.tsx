'use client';

import { useParams, notFound } from 'next/navigation';
import { CardSeriesForm } from '../../components/forms/CardSeriesForm';
import { ArticleForm } from '../../components/forms/ArticleForm';
import { NoticeForm } from '../../components/forms/NoticeForm';
import { CONTENT_TYPES, type ContentType } from '../../constants';

function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export default function CreatePage() {
  const { type } = useParams<{ type: string }>();
  if (!isContentType(type)) notFound();
  if (type === 'card-series') return <CardSeriesForm mode="create" />;
  if (type === 'article') return <ArticleForm mode="create" />;
  return <NoticeForm mode="create" />;
}
