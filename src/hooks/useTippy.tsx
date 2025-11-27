import { onCleanup, onMount } from "solid-js"
import tippy, { Instance, MultipleTargets, Props, SingleTarget } from "tippy.js"

export default function useTippy(props: {
  targets: SingleTarget | MultipleTargets
  options?: Partial<Props>
}) {
  onMount(() => {
    const instances = tippy(props.targets as unknown as any, props.options) as
      | Instance
      | Instance[]

    onCleanup(() => {
      if (Array.isArray(instances)) {
        instances.forEach((instance) => instance.destroy())
      } else {
        instances.destroy()
      }
    })
  })
}
