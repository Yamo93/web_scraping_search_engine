export default class Scores {
  #content: number[];
  #location: number[];

  constructor() {
    this.#content = [];
    this.#location = [];
  }

  get content(): number[] {
      return this.#content;
  }

  get location(): number[] {
      return this.#location;
  }
}
