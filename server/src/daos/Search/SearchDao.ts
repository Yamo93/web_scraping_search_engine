import Scraper from '@daos/Scraper/Scraper';
import Page from '@entities/Page';
import PageDb from '@entities/PageDb';
import Scores from '@entities/Scores';
import { SearchResult } from '@entities/Search';
import { SEARCH_MODES } from 'src/const';
import FileService from 'src/services/FileService';

export interface IUserDao {
  search: (query: string, searchMode: string) => SearchResult[];
}

class UserDao implements IUserDao {
  pageDb: PageDb;
  fileService: FileService;
  scraper: Scraper;

  constructor(pageDb: PageDb, fileService: FileService, scraper: Scraper) {
    this.pageDb = pageDb;
    this.fileService = fileService;
    this.scraper = scraper;

    this.load();
  }

  private async load() {
    const articles = await this.scraper.initScraper();
    console.log('Loading articles...');
    this.pageDb.loadArticles(articles);
    // precompute page ranks
    console.log('Precomputing page ranks...');
    this.calculatePageRank();
    // store word frequencies for each page in memory
    console.log('Storing word frequencies...');
    this.pageDb.storeWordFrequencies();
    console.log('Finished loading Search module.');
    
  }

  public search(query: string, searchMode: string): SearchResult[] {
    query = query.trim().toLowerCase();
    let results: SearchResult[] = [];
    try {
      results = this.query(query, searchMode);
    } catch (error) {
      let errorMessage = `Failed to query ${query}`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }

    return results;
  }

  private query(query: string, searchMode: string): SearchResult[] {
    if (!query) throw new Error('Query is missing.');
    if (this.isBasic(searchMode) && query.split(' ').length > 1)
      throw new Error('Query must contain only one word.');

    // define variables
    const results: SearchResult[] = [];
    const scores = new Scores();

    // calculate score for each page in the db
    for (let i = 0; i < this.pageDb.pages.length; i++) {
      const page = this.pageDb.get(i);
      scores.content[i] = this.getFrequencyScore(page, query, searchMode);
      scores.location[i] = this.getLocationScore(page, query, searchMode);
    }

    // normalize scores
    this.normalize(scores.content, false);
    this.normalize(scores.location, true);

    // generate results
    for (let i = 0; i < this.pageDb.pages.length; i++) {
      const page = this.pageDb.get(i);
      if (!page) throw new Error('Page missing.');
      const score: number = this.calculateScore(
        scores,
        i,
        page.pageRank,
        searchMode
      );
      const hasRealScore = Boolean(scores.content[i]) && score > 0.001;
      if (hasRealScore) {
        results.push(
          new SearchResult(
            page.name,
            page.url,
            score || 0,
            scores.content[i] || 0,
            scores.location[i] * 0.8,
            this.isAdvanced(searchMode) ? page.pageRank : 0
          )
        );
      }
    }

    // sort results with highest score first
    this.sort(results);

    // return top 5
    return results;
  }

  calculateScore(
    scores: Scores,
    index: number,
    pageRank: number,
    searchMode: string
  ): number {
    if (this.isBasic(searchMode)) return 1 * scores.content[index];
    if (this.isMedium(searchMode))
      return 1.0 * scores.content[index] + 0.8 * scores.location[index];

    if (this.isAdvanced(searchMode)) {
      if (scores.content[index] === 0 && scores.location[index] < 0.001)
        return 0;
      return (
        1.0 * scores.content[index] +
        0.5 * scores.location[index] +
        1.0 * pageRank
      );
    }

    throw new Error(`Search mode ${searchMode} is missing or not supported.`);
  }

  private sort(results: SearchResult[]) {
    results.sort((a, b) => (a.score > b.score ? -1 : 1));
  }

  private normalize(scores: number[], smallIsBetter: boolean) {
    if (smallIsBetter) {
      // small values are inverted to higher values
      // and scaled between 0 and 1
      // find min value
      const minimum = Math.min(...scores);
      // divide min value by score and avoid division by zero
      for (let i = 0; i < scores.length; i++) {
        scores[i] = minimum / Math.max(scores[i], 0.00001);
      }
    } else {
      // higher values are scaled between 0 and 1
      // find max value
      const max = Math.max(...scores);
      if (!max) return;
      // divide all scores by max value
      for (let i = 0; i < scores.length; i++) {
        scores[i] = scores[i] / max;
      }
    }
  }

  private getFrequencyScore(
    page: Page | undefined,
    query: string,
    searchMode: string
  ): number {
    if (!page) throw new Error('Page is missing.');
    let score = 0;
    if (this.isBasic(searchMode)) {
      const id = this.pageDb.getIdForWord(query);
      const frequency = page.getWordFrequencyFor(id);
      score += frequency;
    } else {
      const queryWords = query.split(' ');
      for (const w of queryWords) {
        const id = this.pageDb.getIdForWord(w);
        const frequency = page.getWordFrequencyFor(id);
        score += frequency;
      }
    }
    return score;
  }

  private getLocationScore(
    page: Page | undefined,
    query: string,
    searchMode: string
  ): number {
    if (!page) throw new Error('Page is missing.');
    if (this.isBasic(searchMode)) return 0;

    const queryWords = query.split(' ');
    let score = 0;
    for (const w of queryWords) {
      const id = this.pageDb.getIdForWord(w);
      let found = false;
      for (let i = 0; i < page.words.length; i++) {
        const word = page.words[i];
        if (word === id) {
          score += i + 1;
          found = true;
          break;
        }
      }
      if (!found) score += 100_000;
    }
    return score;
  }

  private calculatePageRank() {
    const MAX_ITERATIONS = 20;
    const ranks: number[] = [];
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      for (let i = 0; i < this.pageDb.pages.length; i++) {
        const page = this.pageDb.get(i);
        if (!page) throw new Error('Page missing.');
        ranks[i] = this.iteratePR(page);
      }

      for (let i = 0; i < this.pageDb.pages.length; i++) {
        const page = this.pageDb.get(i);
        if (!page) throw new Error('Page missing.');
        page.pageRank = ranks[i];
      }
    }
    // normalize page ranks
    this.normalize(ranks, false);
  }

  private iteratePR(page: Page) {
    let pr = 0;
    for (const p of this.pageDb.pages) {
      if (p.hasLinkTo(page)) {
        // sum of all pages
        pr += p.pageRank / p.getNumberOfLinks();
      }
    }
    // calculate pr
    pr = 0.85 * pr + 0.15;
    return pr;
  }

  private isBasic(mode: string): boolean {
    return mode === SEARCH_MODES.basic;
  }

  private isMedium(mode: string): boolean {
    return mode === SEARCH_MODES.medium;
  }

  private isAdvanced(mode: string): boolean {
    return mode === SEARCH_MODES.advanced;
  }
}

export default UserDao;
