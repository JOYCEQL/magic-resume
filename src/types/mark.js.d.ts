declare module 'mark.js' {
  export default class Mark {
    constructor(element: string | HTMLElement | NodeList | null);
    mark(keyword: string | string[], options?: any): void;
    unmark(options?: any): void;
  }
}
