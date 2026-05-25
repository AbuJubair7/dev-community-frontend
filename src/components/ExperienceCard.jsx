function fmt(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ExperienceCard({ exp, onDelete }) {
  return (
    <div className="exp-card">
      <div className="exp-card-title">{exp.role}</div>
      <div className="exp-card-company">{exp.companyName}</div>
      <div className="exp-card-dates">{fmt(exp.startDate)} — {exp.endDate ? fmt(exp.endDate) : 'Present'}</div>
      {exp.description && <div className="exp-card-desc">{exp.description}</div>}
      {onDelete && <div style={{ marginTop: 12 }}><button className="btn-danger btn-sm" onClick={onDelete}>Remove</button></div>}
    </div>
  );
}
