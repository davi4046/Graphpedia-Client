export default function useZoomLevels(
  zoom: () => number,
  zoomLevels: readonly number[]
) {
  const nextZoomIn = () =>
    zoomLevels.find((level) => level > zoom()) ?? zoomLevels.at(-1)!

  const nextZoomOut = () =>
    [...zoomLevels].reverse().find((level) => level < zoom()) ?? zoomLevels[0]

  return { nextZoomIn, nextZoomOut }
}
