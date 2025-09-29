import { For, Signal } from "solid-js"

export default function MultiSelect(props: {
  name: string
  options: [string, string][]
  selected: Signal<string[]>
}) {
  const [selected, setSelected] = props.selected

  const toggleValue = (value: string) => {
    setSelected(
      (prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value) // remove
          : [...prev, value] // add
    )
  }

  return (
    <details class="dropdown invalid">
      <summary>
        {props.options
          .filter((opt) => selected().includes(opt[1])) // keep selected only
          .map((opt) => opt[0].charAt(0) + opt[0].slice(1)) // capitalize
          .join(", ") || "None selected"}
      </summary>
      <ul>
        <For each={props.options} fallback={<div>No options found</div>}>
          {(option) => (
            <li>
              <label>
                <input
                  type="checkbox"
                  name={props.name}
                  value={option[1]}
                  checked={selected().includes(option[1])}
                  onChange={() => toggleValue(option[1])}
                />
                {option[0]}
              </label>
            </li>
          )}
        </For>
      </ul>
    </details>
  )
}
