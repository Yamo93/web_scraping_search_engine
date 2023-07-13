import Article from './Article';
import Page from './Page';

export default class PageDb {
  #wordToId: Map<string, number>;
  #pages: Page[];

  constructor() {
    this.#wordToId = new Map<string, number>();
    this.#pages = [];
  }

  get wordToId(): Map<string, number> {
    return this.#wordToId;
  }

  get pages(): Page[] {
    return this.#pages;
  }

  public loadArticles(articles: Article[]) {
    const pages: Page[] = [];
    for (const article of articles) {
      const fileName = article.getFileName();
      const wordIds = this.getWordIds(article);
      const page = new Page(fileName, wordIds, article.links);
      pages.push(page);
    }
    this.save(pages);
  }

  private getWordIds(article: Article): number[] {
    const wordIds: number[] = [];
    for (const word of article.words) {
      const id = this.getIdForWord(word);
      wordIds.push(id);
    }
    return wordIds;
  }

  public getIdForWord(word: string): number {
    let id = this.#wordToId.get(word);
    if (id) {
      return id;
    }
    // start id from 1
    id = this.#wordToId.size + 1;
    this.#wordToId.set(word, id);
    return id;
  }

  public save(pages: Page[]) {
    this.#pages = pages;
  }

  public hasPages(): boolean {
    return this.#pages.length > 0;
  }

  public search(id: number): Page[] {
    return this.#pages.filter((page) => page.hasWord(id));
  }

  public get(index: number): Page | undefined {
    return this.#pages[index];
  }

  public storeWordFrequencies() {
    for (const page of this.#pages) {
      page.storeWordFrequencies();
    }
  }
}
