export default function ErrorCard({ message }) {
  return <div className="error-card">⚠️ {message || 'Something went wrong.'}</div>;
}
