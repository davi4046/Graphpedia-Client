export default function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <a href="/" aria-label="Graphpedia" class="flex items-center">
              <img
                src="/graphpedia.svg"
                alt=""
                class="mr-[0.9rem] h-[3.0rem] w-[3.0rem]"
              />
              <picture>
                {/* <source
                  srcset="/graphpedia-wordmark-dark.svg"
                  media="(prefers-color-scheme: dark)"
                /> */}
                <img
                  src="/graphpedia-wordmark-light.svg"
                  alt=""
                  class="h-[1.8rem] w-auto"
                />
              </picture>
            </a>
          </li>
        </ul>
        <ul>
          <li>
            <a
              href="https://graphpedia.flarum.cloud/"
              target="_blank"
              rel="noopener noreferrer"
              role="button"
              class="outline"
            >
              Forum✨
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
