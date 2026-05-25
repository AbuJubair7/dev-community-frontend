export default function SkillTag({ name, onDelete }) {
  return (
    <span className="skill-tag">
      {name}
      {onDelete && (
        <button className="skill-tag-delete" onClick={onDelete} title="Remove">×</button>
      )}
    </span>
  );
}
