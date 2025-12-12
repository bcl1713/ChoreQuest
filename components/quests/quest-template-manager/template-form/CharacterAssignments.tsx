interface CharacterAssignmentsProps {
  characters: { id: string; name: string; ownerName: string }[];
  assignedIds: string[];
  onToggle: (characterId: string) => void;
}

export function CharacterAssignments({
  characters,
  assignedIds,
  onToggle,
}: CharacterAssignmentsProps) {
  return (
    <div>
      <label className="block text-sm font-semibold uppercase text-gray-300 mb-2">
        Assign to Characters
      </label>
      {characters.length === 0 ? (
        <p className="text-sm text-gray-400">No characters found for this family.</p>
      ) : (
        <div className="space-y-2">
          {characters.map((character) => (
            <div key={character.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                id={character.id}
                checked={assignedIds.includes(character.id)}
                onChange={() => onToggle(character.id)}
                className="form-checkbox h-4 w-4 text-purple-500"
              />
              <label htmlFor={character.id}>
                {character.name}
                {character.ownerName ? ` (${character.ownerName})` : ''}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
