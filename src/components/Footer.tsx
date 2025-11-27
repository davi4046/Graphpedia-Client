export default function Footer() {
  return (
    <footer>
      <p class="h-1 border border-[var(--pico-primary)]"></p>
      <p>
        Graphpedia is an independent open knowledge project inspired by the
        Wikimedia movement. The graphs are generated and regularly updated from
        the data available on{" "}
        <a
          href="https://www.wikidata.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wikidata
        </a>
        . Please feel free to share your findings with the world and help us
        spread the word about Graphpedia. Happy exploring!
      </p>
      <ul class="flex flex-wrap gap-4">
        <li class="list-none">
          <a href="/" role="button" class="outline">
            Home
          </a>
        </li>
        <li class="list-none">
          <a
            href="https://graphpedia.flarum.cloud/"
            target="_blank"
            rel="noopener noreferrer"
            role="button"
            class="outline"
          >
            Forum
          </a>
        </li>
        <li class="list-none">
          <a href="mailto:contact@graphpedia.org" role="button" class="outline">
            Contact
          </a>
        </li>
        <li class="list-none">
          <a
            href="https://www.svgbackgrounds.com/category/geometric/"
            target="_blank"
            rel="noopener noreferrer"
            role="button"
            class="secondary outline"
          >
            Geometric Backgrounds by SVGBackgrounds.com
          </a>
        </li>
      </ul>
      <p class="font-bold">
        A special thanks to Stefan Hachul and Michael Jünger for their
        contributions to graph drawing algorithms and software.
      </p>
    </footer>
  )
}
