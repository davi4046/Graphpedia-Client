export default function Footer() {
  return (
    <footer class="grid grid-cols-[auto_1fr] border-t-1 text-xs">
      <section class="flex flex-col gap-2">
        <a href="/" aria-label="Graphpedia">
          <img src="/graphpedia.svg" alt="" class="h-14 w-14" />
          <picture>
            {/* <source
              srcset="/graphpedia-wordmark-dark.svg"
              media="(prefers-color-scheme: dark)"
            /> */}
            <img
              src="/graphpedia-wordmark-light.svg"
              alt=""
              class="mt-0.5 w-14"
            />
          </picture>
        </a>
        <a
          href="https://www.wikidata.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Wikidata_stamp.png"
            alt="Powered by Wikidata"
            class="w-14"
          />
        </a>
      </section>
      <section>
        <p>
          This site is an independent open knowledge project inspired by the
          Wikimedia movement.
        </p>
        <p>
          All graphs are generated and regularly updated from the data available
          on{" "}
          <a
            href="https://www.wikidata.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikidata
          </a>
          .
        </p>
        <p>
          Please feel free to share your findings with the world in the form of
          screenshots or links and help us spread the word about Graphpedia!
        </p>
        <p>Happy exploring!</p>
        <ul class="ml-3">
          <li>
            <strong>Forum: </strong>
            <a
              href="https://graphpedia.flarum.cloud/"
              target="_blank"
              rel="noopener noreferrer"
            >
              graphpedia.flarum.cloud
            </a>{" "}
            (bug reports, feature proposals, updates)
          </li>
          <li>
            <strong>Contact: </strong>
            <a href="mailto:contact@graphpedia.org">
              contact@graphpedia.org
            </a>{" "}
            (for direct inquiries)
          </li>
          <li>
            <a href="https://www.svgbackgrounds.com/category/geometric/">
              Geometric Backgrounds by SVGBackgrounds.com
            </a>
          </li>
        </ul>
        <p class="font-bold italic">
          A special thanks to Stefan Hachul and Michael Jünger for their
          contributions to graph drawing algorithms and software.
        </p>
      </section>
    </footer>
  )
}
