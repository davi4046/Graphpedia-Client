import { For } from "solid-js"

export default function Select(props: {
  name: string
  ariaLabel: string
  options: [string, string][]
  selected: [() => string, (val: string) => void]
}) {
  const [selected, setSelected] = props.selected

  return (
    <select
      name={props.name}
      aria-label={props.ariaLabel}
      onChange={(e) => setSelected(e.currentTarget.value)}
      required
    >
      <For each={props.options} fallback={<div>No options found</div>}>
        {(option) => (
          <option value={option[1]} selected={selected() === option[1]}>
            {option[0]}
          </option>
        )}
      </For>
    </select>
  )
}
