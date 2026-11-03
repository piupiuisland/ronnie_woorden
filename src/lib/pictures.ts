/** Pictures in src/words/pictures, bundled into the app (and so available offline). */
const modules = import.meta.glob<string>('../words/pictures/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const urls = new Map(Object.entries(modules).map(([path, url]) => [path.split('/').pop() ?? path, url]))

export function pictureUrl(name: string | undefined): string | undefined {
  return name ? urls.get(name) : undefined
}

export function pictureNames(): Set<string> {
  return new Set(urls.keys())
}
