export default function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <a href="/" class="flex items-center">
              <img
                src="/graphpedia.svg"
                class="mr-[0.9rem] h-[3.0rem] w-auto"
              />
              <img src="/graphpedia-wordmark.svg" class="h-[1.8rem] w-auto" />
            </a>
          </li>
        </ul>
        <ul>
          <li>
            <form class="flex" action="/graphs" method="get">
              <input
                type="search"
                name="search"
                placeholder="Search"
                aria-label="Search"
                class="rounded-sm rounded-r-none"
              />
              <input
                type="submit"
                value="Search"
                class="w-min rounded-l-none"
              />
            </form>
          </li>
        </ul>
      </nav>
    </header>
  )
}
