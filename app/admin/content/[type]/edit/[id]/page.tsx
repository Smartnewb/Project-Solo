'use client';

import { useParams, notFound } from 'next/navigation';
import { CardSeriesForm } from '../../../components/forms/CardSeriesForm';
import { ArticleForm } from '../../../components/forms/ArticleForm';
import { NoticeForm } from '../../../components/forms/NoticeForm';
import { CONTENT_TYPES, type ContentType } from '../../../constants';

function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export default function EditPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  if (!isContentType(type)) notFound();
  if (type === 'card-series') return <CardSeriesForm mode="edit" id={id} />;
  if (type === 'article') return <ArticleForm mode="edit" id={id} />;
  return <NoticeForm mode="edit" id={id} />;
}
