export default class Page {
  #name: string;
  #url: string;
  #words: number[];
  #links: Set<string>;
  pageRank: number;
  #wordFrequencies: Map<number, number>;

  constructor (name: string, words: number[], links: string[]) {
    this.#name = name;
    this.#url = this.generateWikiUrl(name);
    this.#words = words;
    this.#links = new Set(links);
    this.pageRank = 1; // initial PR value
    this.#wordFrequencies = new Map<number, number>();
  }

  get name (): string {
    return this.#name;
  }

  get url (): string {
    return this.#url;
  }

  get words (): number[] {
    return this.#words;
  }

  get links (): Set<string> {
    return this.#links;
  }

  public getNumberOfLinks (): number {
    return this.#links.size;
  }

  public hasWord (id: number): boolean {
    return this.#words.some((word) => word === id);
  }

  public hasLinkTo (page: Page): boolean {
    return this.#links.has(page.#url);
  }

  private generateWikiUrl (name: string): string {
    return '/wiki/' + name;
  }

  public storeWordFrequencies () {
    for (const word of this.#words) {
      this.storeWordFrequency(word);
    }
  }

  private storeWordFrequency (word: number) {
    const frequency = this.#wordFrequencies.get(word);
    if (frequency) {
      this.#wordFrequencies.set(word, frequency + 1);
    } else {
      this.#wordFrequencies.set(word, 1);
    }
  }

  public getWordFrequencyFor (word: number): number {
    return this.#wordFrequencies.get(word) || 0;
  }
}
