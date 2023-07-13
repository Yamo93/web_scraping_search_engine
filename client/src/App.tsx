import React, { ChangeEvent, FormEvent, useState } from 'react';
import './App.css';
import { ModeType, SEARCH_MODES } from './const';

interface SearchPayload {
  query: string;
  mode: ModeType;
}

interface Result {
  name: string;
  link: string;
  score: number;
  content: number;
  location: number;
  pageRank: number;
}

interface ServerError {
  error: string;
  results?: never;
}

interface Results {
  results: Result[];
  error?: never;
}

type ServerResponse = Results | ServerError;

function App () {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState(SEARCH_MODES.basic);
  const [results, setResults] = useState<Result[]>([]);
  const [displayedResults, setDisplayedResults] = useState<Result[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [requestTime, setRequestTime] = useState(0);
  const [count, setCount] = useState(5);
  const [currentQuery, setCurrentQuery] = useState('');

  function handleQuery (e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  function handleSearchMode (e: ChangeEvent<HTMLSelectElement>) {
    const value: string = e.target.value;
    const newSearchMode = SEARCH_MODES[value];
    setSearchMode(newSearchMode);
  }

  function handleCount (e: ChangeEvent<HTMLInputElement>) {
    setCount(e.target.valueAsNumber);
  }

  function clearErrorMessage () {
    setErrorMessage('');
  }

  function loadResults (data: Results) {
    clearErrorMessage();
    if (!data.results.length) {
      setInfoMessage('No results found.');
    }
    setResults(data.results);
    setDisplayedResults(data.results.slice(0, count));
  }

  async function search (e: FormEvent) {
    e.preventDefault();
    const payload: SearchPayload = { query, mode: searchMode.value };
    try {
      const start = performance.now();
      setInfoMessage('Loading...');
      const response = await fetch('http://localhost:3000/api/search/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data: ServerResponse = await response.json();
      setInfoMessage('');
      const end = performance.now();
      const time = end - start;
      // save request time in seconds
      setRequestTime(time / 1000);
      if (data.error) {
        setErrorMessage(data.error);
      } else if (data.results) {
        loadResults(data);
        setCurrentQuery(query);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function getWikiLink (link: string): string {
    return 'https://wikipedia.org' + link;
  }

  return (
    <div className="App">
      <form onSubmit={search} className="mb">
        <div className="wrapper">
          <div className="wrapper mr">
            <label>Search query:</label>
            <input type="text" value={query} onChange={handleQuery} />
          </div>
          <div className="wrapper">
            <label>Search mode:</label>
            <select value={searchMode?.value} onChange={handleSearchMode}>
              {Object.values(SEARCH_MODES).map(({ value, text }) => (
                <option key={value} value={value}>{text}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="wrapper">
          <label>Number of results:</label>
          <input type="number" value={count} onChange={handleCount} />
        </div>
        <button className="button" type="submit">Search</button>
      </form>

      {infoMessage && <div className="info-message mb">{infoMessage}</div>}
      {errorMessage && <div className="error-message mb">{errorMessage}</div>}

      <table>
        <thead>
          <tr>
            <td>Link</td>
            <td>Score</td>
            <td>Content</td>
            <td>Location</td>
            <td>PageRank</td>
          </tr>
        </thead>
        <tbody>
          {displayedResults.map(result => (
            <tr key={result.name}>
              <td><a href={getWikiLink(result.link)} target="_blank" rel="noreferrer">{decodeURIComponent(result.name)}</a></td>
              <td>{result.score.toFixed(2)}</td>
              <td>{result.content.toFixed(2)}</td>
              <td>{result.location.toFixed(2)}</td>
              <td>{result.pageRank.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {displayedResults.length > 0 && <p>Showing {displayedResults.length} of {results.length} results for search query <strong>"{currentQuery}"</strong> in {requestTime.toFixed(3)} sec</p>}
    </div>
  );
}

export default App;
