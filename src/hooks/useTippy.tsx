import { Accessor, createSignal, onCleanup, onMount } from "solid-js"
import tippy, { Instance, MultipleTargets, Props, SingleTarget } from "tippy.js"

export default function useTippy(props: {
  targets: SingleTarget
  options?: Partial<Props>
}): Accessor<Instance>

export default function useTippy(props: {
  targets: MultipleTargets
  options?: Partial<Props>
}): Accessor<Instance[]>

export default function useTippy(props: {
  targets: SingleTarget | MultipleTargets
  options?: Partial<Props>
}) {
  const [instances, setInstances] = createSignal<Instance | Instance[]>()

  onMount(() => {
    // @ts-ignore
    const insts = tippy(props.targets, props.options)
    setInstances(insts)
  })

  onCleanup(() => {
    const insts = instances()
    if (Array.isArray(insts)) {
      insts.forEach((inst) => inst.destroy())
    } else {
      insts?.destroy()
    }
  })

  return instances
}
