interface LivesProps {
  current: number;
  compact?: boolean;
}

export function Lives({ current, compact = false }: LivesProps) {
  return (
    <div aria-label={`Nyawa tersisa ${current} dari 3`} className={`lives ${compact ? 'lives-compact' : ''}`}>
      <span>{compact ? 'HP' : `Nyawa: ${current}`}</span>
      <div aria-hidden="true" className="life-icons">
        {[0, 1, 2].map((index) => (
          <img
            alt=""
            key={index}
            src={index < current ? '/assets/Shared/Game/LifeFull.png' : '/assets/Shared/Game/LifeEmpty.png'}
          />
        ))}
      </div>
    </div>
  );
}
