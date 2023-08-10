import { Injectable } from '@angular/core';
import { JsonMethodPluginService } from '@sinequa/core/web-services';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';

export interface TokenData {
  collection: string;
  date: Date;
  docs: DocumentData[];
}

export interface TokenInfo {
  token: string;
  name: string;
}

export interface DocumentData {
  docId: string;
  status: DocumentStatus;
  reindexed: boolean; // true when the document has been indexed or updated
}

export enum DocumentStatus {
  Update, // existing document
  Add // new document
}

@Injectable({
  providedIn: 'root'
})
export class IndexingService {

  /** Name of the IndexingToken plugin */
  IndexingToken = "IndexingToken";

  /** Local storage to store the tokens list */
  storageItem = 'upload-tokens';

  /** Stored tokens */
  tokens: TokenInfo[] = [];

  constructor(public jsonMethodWebService: JsonMethodPluginService) {
    this.fetchTokens();
  }

  /**
   * Get upload info from token
   */
  readToken(token: string): Observable<TokenData> {
    return this.jsonMethodWebService.post(this.IndexingToken, { token }).pipe(map(res => res.token));
  }

  /**
   * Get upload info from tokens list
   */
  readTokens(): Observable<(TokenData | undefined)[]> {
    const errorTokens: TokenInfo[] = [];
    const observables = this.tokens.map(token => this.readToken(token.token).pipe(catchError(error => {
      errorTokens.push(token);
      return of(undefined);
    })));
    return forkJoin(observables).pipe(
      tap(() => {
        this.tokens = this.tokens.filter(token => !errorTokens.find(t => t.token === token.token));
        setTimeout(() => { // waiting before deleting the tokens in case we need to wait for a login
          console.log('deleting errorTokens', errorTokens);
          this.saveTokens();
        }, 5000);
      }),
    )
  }

  /** Fetch tokens from local storage */
  fetchTokens(): void {
    const tokens = localStorage.getItem(this.storageItem);
    this.tokens = tokens ? JSON.parse(tokens) : [];
  }

  /** Save tokens in the local storage */
  saveTokens() {
    localStorage.setItem(this.storageItem, JSON.stringify(this.tokens));
  }

  /** Save a new token */
  addToken(token: TokenInfo): void {
    this.tokens.push(token);
    this.saveTokens();
  }

  /** Remove token */
  removeToken(index: number): void {
    this.tokens.splice(index, 1);
    this.saveTokens();
  }

}
