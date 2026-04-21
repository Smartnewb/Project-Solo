'use client';

import { useParams, notFound } from 'next/navigation';
import { CardSeriesForm } from '../../../components/forms/CardSeriesForm';
import { ArticleForm } from '../../../components/forms/ArticleForm';
import { NoticeForm } from '../../../components/forms/NoticeForm';

export default function EditPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  if (type === 'card-series') return <CardSeriesForm mode="edit" id={id} />;
  if (type === 'article') return <ArticleForm mode="edit" id={id} />;
  if (type === 'notice') return <NoticeForm mode="edit" id={id} />;
  notFound();
}
