import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <EmptyState
      title="This page doesn't exist"
      message="The link may be old or mistyped."
      action={<Link to="/" className="btn btn--primary btn--md">Go home</Link>}
    />
  );
}
