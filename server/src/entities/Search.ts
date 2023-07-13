export interface ISearchResult {
  name: string;
  link: string;
  score: number;
  content: number;
  location: number;
  pageRank: number;
}

export class SearchResult implements ISearchResult {
  name: string;
  link: string;
  score: number;
  content: number;
  location: number;
  pageRank: number;

  constructor(
    name: string,
    link: string,
    score: number,
    content: number,
    location: number,
    pageRank: number
  ) {
    this.name = name;
    this.link = link;
    this.score = score;
    this.content = content;
    this.location = location;
    this.pageRank = pageRank;
  }
}
